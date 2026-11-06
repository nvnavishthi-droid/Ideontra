-- Proposed existing-function hardening — pending review, not applied.
-- create_idea: restricted DEFINER is required to perform validated RPC-only writes.
CREATE OR REPLACE FUNCTION public.create_idea(p_title text, p_category text, p_problem text, p_proposed_solution text, p_who_benefits text, p_expected_impact text, p_rough_effort text DEFAULT NULL::text, p_links text[] DEFAULT '{}'::text[], p_is_anonymous boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
DECLARE
    v_user_id uuid;
    v_idea_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in to create an idea.';
    END IF;

    IF p_title IS NULL OR length(trim(p_title)) = 0 OR length(p_title) > 100 THEN
        RAISE EXCEPTION 'Title must contain between 1 and 100 characters.';
    END IF;

    IF p_category IS NULL OR p_category NOT IN (
        'New Service Offering',
        'Internal Tool',
        'Process Improvement',
        'Marketing/Content',
        'Client Experience',
        'Training'
    ) THEN
        RAISE EXCEPTION 'Invalid idea category.';
    END IF;

    IF p_rough_effort IS NOT NULL
       AND p_rough_effort NOT IN ('Small', 'Medium', 'Large') THEN
        RAISE EXCEPTION 'Invalid rough effort.';
    END IF;

    IF p_problem IS NULL OR length(trim(p_problem)) = 0
       OR p_proposed_solution IS NULL OR length(trim(p_proposed_solution)) = 0
       OR p_who_benefits IS NULL OR length(trim(p_who_benefits)) = 0
       OR p_expected_impact IS NULL OR length(trim(p_expected_impact)) = 0 THEN
        RAISE EXCEPTION 'All required idea fields must be provided.';
    END IF;

    INSERT INTO public.ideas (
        title,
        category,
        problem,
        proposed_solution,
        who_benefits,
        expected_impact,
        rough_effort,
        links,
        is_anonymous,
        status
    )
    VALUES (
        trim(p_title),
        p_category,
        trim(p_problem),
        trim(p_proposed_solution),
        trim(p_who_benefits),
        trim(p_expected_impact),
        p_rough_effort,
        COALESCE(p_links, '{}'),
        COALESCE(p_is_anonymous, false),
        'Draft'
    )
    RETURNING id INTO v_idea_id;

    INSERT INTO public.idea_private_details (
        idea_id,
        submitter_id
    )
    VALUES (
        v_idea_id,
        v_user_id
    );

    RETURN v_idea_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_idea(text,text,text,text,text,text,text,text[],boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_idea(text,text,text,text,text,text,text,text[],boolean) TO authenticated;

-- submit_idea: restricted DEFINER is required to perform validated RPC-only writes.
CREATE OR REPLACE FUNCTION public.submit_idea(p_idea_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
DECLARE
    v_user_id uuid;
    v_current_status text;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    SELECT i.status
    INTO v_current_status
    FROM public.ideas i
    JOIN public.idea_private_details pd
        ON pd.idea_id = i.id
    WHERE i.id = p_idea_id
      AND pd.submitter_id = v_user_id
    FOR UPDATE OF i;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Idea not found or you are not its author.';
    END IF;

    IF v_current_status <> 'Draft' THEN
        RAISE EXCEPTION 'Only Draft ideas can be submitted.';
    END IF;

    UPDATE public.ideas
    SET
        status = 'Submitted',
        submitted_at = now(),
        updated_at = now()
    WHERE id = p_idea_id;

    INSERT INTO public.idea_status_history (
        idea_id,
        from_status,
        to_status,
        changed_by,
        reason
    )
    VALUES (
        p_idea_id,
        'Draft',
        'Submitted',
        v_user_id,
        NULL
    );

    RETURN p_idea_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_idea(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_idea(uuid) TO authenticated;

-- update_idea: restricted DEFINER is required to perform validated RPC-only writes.
CREATE OR REPLACE FUNCTION public.update_idea(p_idea_id uuid, p_title text, p_category text, p_problem text, p_proposed_solution text, p_who_benefits text, p_expected_impact text, p_rough_effort text, p_links text[], p_is_anonymous boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
DECLARE
    v_user_id uuid;
    v_current_status text;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    SELECT i.status
    INTO v_current_status
    FROM public.ideas i
    JOIN public.idea_private_details pd
        ON pd.idea_id = i.id
    WHERE i.id = p_idea_id
      AND pd.submitter_id = v_user_id
    FOR UPDATE OF i;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Idea not found or you are not its author.';
    END IF;

    IF v_current_status NOT IN ('Draft', 'Submitted', 'Needs More Info') THEN
        RAISE EXCEPTION 'This idea cannot be edited in its current status.';
    END IF;

    IF p_title IS NULL OR length(trim(p_title)) = 0
       OR length(trim(p_title)) > 100 THEN
        RAISE EXCEPTION 'Title must contain between 1 and 100 characters.';
    END IF;

    IF p_category IS NULL OR p_category NOT IN (
        'New Service Offering',
        'Internal Tool',
        'Process Improvement',
        'Marketing/Content',
        'Client Experience',
        'Training'
    ) THEN
        RAISE EXCEPTION 'Invalid idea category.';
    END IF;

    IF p_rough_effort IS NOT NULL
       AND p_rough_effort NOT IN ('Small', 'Medium', 'Large') THEN
        RAISE EXCEPTION 'Invalid rough effort.';
    END IF;

    IF p_problem IS NULL OR length(trim(p_problem)) = 0
       OR p_proposed_solution IS NULL OR length(trim(p_proposed_solution)) = 0
       OR p_who_benefits IS NULL OR length(trim(p_who_benefits)) = 0
       OR p_expected_impact IS NULL OR length(trim(p_expected_impact)) = 0 THEN
        RAISE EXCEPTION 'All required idea fields must be provided.';
    END IF;

    UPDATE public.ideas
    SET
        title = trim(p_title),
        category = p_category,
        problem = trim(p_problem),
        proposed_solution = trim(p_proposed_solution),
        who_benefits = trim(p_who_benefits),
        expected_impact = trim(p_expected_impact),
        rough_effort = p_rough_effort,
        links = COALESCE(p_links, '{}'),
        is_anonymous = COALESCE(p_is_anonymous, false),
        updated_at = now()
    WHERE id = p_idea_id;

    RETURN p_idea_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_idea(uuid,text,text,text,text,text,text,text,text[],boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_idea(uuid,text,text,text,text,text,text,text,text[],boolean) TO authenticated;

