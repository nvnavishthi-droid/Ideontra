-- function-baseline SQL — Read-only snapshot before security remediation.
CREATE OR REPLACE FUNCTION public.unfollow_idea(p_idea_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    DELETE FROM public.idea_followers
    WHERE idea_id = p_idea_id
      AND user_id = v_user_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.transition_idea(p_idea_id uuid, p_new_status text, p_reason text DEFAULT NULL::text, p_owner_id uuid DEFAULT NULL::uuid, p_target_date date DEFAULT NULL::date)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_old_status text;
    v_is_admin boolean;
    v_is_author boolean;
    v_is_owner boolean;
    v_old_owner_id uuid;
    v_owner_id uuid;
    v_target_date date;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    v_is_admin := public.is_admin();

    SELECT status, owner_id, target_date
    INTO v_old_status, v_old_owner_id, v_target_date
    FROM public.ideas
    WHERE id = p_idea_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Idea not found.';
    END IF;

    v_owner_id := v_old_owner_id;

    SELECT EXISTS (
        SELECT 1
        FROM public.idea_private_details
        WHERE idea_id = p_idea_id
          AND submitter_id = auth.uid()
    ) INTO v_is_author;

    v_is_owner := v_owner_id = auth.uid();

    IF p_new_status NOT IN (
        'Submitted', 'Needs More Info', 'Under Evaluation',
        'Approved', 'In Progress', 'Done', 'Rejected',
        'Parked', 'Withdrawn'
    ) THEN
        RAISE EXCEPTION 'Invalid target status.';
    END IF;

    IF p_new_status IN ('Needs More Info', 'Rejected', 'Parked')
       AND NULLIF(trim(p_reason), '') IS NULL THEN
        RAISE EXCEPTION 'A reason is required for this status.';
    END IF;

    -- Author transitions
    IF v_old_status = 'Submitted'
       AND p_new_status = 'Withdrawn'
       AND v_is_author THEN
        NULL;

    ELSIF v_old_status = 'Needs More Info'
       AND p_new_status IN ('Submitted', 'Withdrawn')
       AND v_is_author THEN
        NULL;

    -- Admin transitions from Submitted
    ELSIF v_old_status = 'Submitted'
       AND p_new_status IN (
           'Under Evaluation', 'Needs More Info', 'Rejected'
       )
       AND v_is_admin THEN
        NULL;

    -- Admin transitions from Under Evaluation
    ELSIF v_old_status = 'Under Evaluation'
       AND p_new_status IN (
           'Approved', 'Rejected', 'Parked', 'Needs More Info'
       )
       AND v_is_admin THEN
        NULL;

    -- Admin returns a Parked idea to evaluation
    ELSIF v_old_status = 'Parked'
       AND p_new_status = 'Under Evaluation'
       AND v_is_admin THEN
        NULL;

    -- Admin or assigned owner starts approved work
    ELSIF v_old_status = 'Approved'
       AND p_new_status = 'In Progress'
       AND (v_is_admin OR v_is_owner) THEN
        NULL;

    -- Admin or assigned owner parks or completes work
    ELSIF v_old_status = 'In Progress'
       AND p_new_status IN ('Done', 'Parked')
       AND (v_is_admin OR v_is_owner) THEN
        NULL;

    ELSE
        RAISE EXCEPTION 'This status transition is not permitted.';
    END IF;

    -- Evaluation required before approval
    IF p_new_status = 'Approved' THEN
        IF NOT EXISTS (
            SELECT 1
            FROM public.ideas
            WHERE id = p_idea_id
              AND impact_score IS NOT NULL
              AND effort_score IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'Complete the evaluation before approval.';
        END IF;
    END IF;

    -- Assign owner and target date before work begins
    IF v_old_status = 'Approved'
       AND p_new_status = 'In Progress' THEN

        IF p_owner_id IS NOT NULL AND NOT v_is_admin THEN
            RAISE EXCEPTION 'Only admins can assign an owner.';
        END IF;

        IF p_target_date IS NOT NULL AND NOT v_is_admin THEN
            RAISE EXCEPTION 'Only admins can set the target date.';
        END IF;

        IF p_owner_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE id = p_owner_id
                  AND role = 'member'
            ) THEN
                RAISE EXCEPTION 'Select a valid member as the owner.';
            END IF;

            v_owner_id := p_owner_id;
        END IF;

        IF p_target_date IS NOT NULL THEN
            v_target_date := p_target_date;
        END IF;

        IF v_owner_id IS NULL OR v_target_date IS NULL THEN
            RAISE EXCEPTION 'An owner and target date are required.';
        END IF;
    END IF;

    -- Completion requires a demo
    IF p_new_status = 'Done' THEN
        IF NOT EXISTS (
            SELECT 1
            FROM public.ideas
            WHERE id = p_idea_id
              AND (
                  NULLIF(trim(demo_video_path), '') IS NOT NULL
                  OR NULLIF(trim(demo_video_url), '') IS NOT NULL
              )
        ) THEN
            RAISE EXCEPTION
                'Add a demo video or external demo link before marking Done.';
        END IF;
    END IF;

    -- Update idea
    UPDATE public.ideas
    SET
        status = p_new_status,
        owner_id = v_owner_id,
        target_date = v_target_date,
        updated_at = now()
    WHERE id = p_idea_id;

    -- Record owner assignment
    IF v_old_owner_id IS DISTINCT FROM v_owner_id
       AND v_owner_id IS NOT NULL THEN
        INSERT INTO public.idea_owner_history (
            idea_id,
            owner_id,
            assigned_by
        )
        VALUES (
            p_idea_id,
            v_owner_id,
            auth.uid()
        );
    END IF;

    -- Record status transition
    INSERT INTO public.idea_status_history (
        idea_id,
        from_status,
        to_status,
        changed_by,
        reason
    )
    VALUES (
        p_idea_id,
        v_old_status,
        p_new_status,
        auth.uid(),
        NULLIF(trim(p_reason), '')
    );

    RETURN p_new_status;
END;
$function$

CREATE OR REPLACE FUNCTION public.evaluate_idea(p_idea_id uuid, p_impact_score integer, p_effort_score integer)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_quadrant text;
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be logged in.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can evaluate ideas.';
  END IF;

  IF p_impact_score IS NULL OR p_effort_score IS NULL
     OR p_impact_score NOT BETWEEN 1 AND 5
     OR p_effort_score NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Impact and effort scores must be between 1 and 5.';
  END IF;

  SELECT status
  INTO v_status
  FROM public.ideas
  WHERE id = p_idea_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Idea not found.';
  END IF;

  IF v_status NOT IN ('Submitted', 'Under Evaluation') THEN
    RAISE EXCEPTION 'This idea cannot be evaluated in its current status.';
  END IF;

  IF p_impact_score >= 3 AND p_effort_score < 3 THEN
    v_quadrant := 'Quick Win';
  ELSIF p_impact_score >= 3 AND p_effort_score >= 3 THEN
    v_quadrant := 'Big Bet';
  ELSIF p_impact_score < 3 AND p_effort_score < 3 THEN
    v_quadrant := 'Fill-in';
  ELSE
    v_quadrant := 'Not Worth It';
  END IF;

  UPDATE public.ideas
  SET
    impact_score = p_impact_score,
    effort_score = p_effort_score,
    updated_at = now()
  WHERE id = p_idea_id;

  RETURN v_quadrant;
END;
$function$

