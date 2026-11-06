-- function-baseline SQL — Read-only snapshot before security remediation.
CREATE OR REPLACE FUNCTION public.add_idea_progress_update(p_idea_id uuid, p_update_text text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid;
    v_owner_id uuid;
    v_status text;
    v_update_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    IF p_update_text IS NULL
       OR length(trim(p_update_text)) = 0
       OR length(trim(p_update_text)) > 2000 THEN
        RAISE EXCEPTION 'Update must contain 1 to 2000 characters.';
    END IF;

    SELECT owner_id, status
    INTO v_owner_id, v_status
    FROM public.ideas
    WHERE id = p_idea_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Idea not found.';
    END IF;

    IF v_status <> 'In Progress' THEN
        RAISE EXCEPTION 'Progress updates are allowed only for ideas In Progress.';
    END IF;

    IF NOT public.is_admin() AND v_owner_id IS DISTINCT FROM v_user_id THEN
        RAISE EXCEPTION 'Only the assigned owner or an admin can post updates.';
    END IF;

    INSERT INTO public.idea_progress_updates (
        idea_id,
        user_id,
        update_text
    )
    VALUES (
        p_idea_id,
        v_user_id,
        trim(p_update_text)
    )
    RETURNING id INTO v_update_id;

    RETURN v_update_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.reassign_idea_owner(p_idea_id uuid, p_new_owner_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_old_owner_id uuid;
    v_status text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can reassign an idea.';
    END IF;

    SELECT owner_id, status
    INTO v_old_owner_id, v_status
    FROM public.ideas
    WHERE id = p_idea_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Idea not found.';
    END IF;

    IF v_status NOT IN ('Approved', 'In Progress', 'Parked') THEN
        RAISE EXCEPTION 'Owner cannot be reassigned in the current status.';
    END IF;

    IF p_new_owner_id IS NULL THEN
        RAISE EXCEPTION 'Please select a new owner.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = p_new_owner_id
          AND role = 'member'
    ) THEN
        RAISE EXCEPTION 'Select a valid member.';
    END IF;

    IF v_old_owner_id IS NOT DISTINCT FROM p_new_owner_id THEN
        RAISE EXCEPTION 'This member is already the assigned owner.';
    END IF;

    UPDATE public.ideas
    SET owner_id = p_new_owner_id,
        updated_at = now()
    WHERE id = p_idea_id;

    INSERT INTO public.idea_owner_history (
        idea_id,
        owner_id,
        assigned_by
    )
    VALUES (
        p_idea_id,
        p_new_owner_id,
        auth.uid()
    );
END;
$function$

CREATE OR REPLACE FUNCTION public.get_profile_names(p_user_ids uuid[])
 RETURNS TABLE(id uuid, full_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    RETURN QUERY
    SELECT p.id, p.full_name
    FROM public.profiles AS p
    WHERE p.id = ANY(p_user_ids)
      AND EXISTS (
          SELECT 1
          FROM public.ideas AS i
          WHERE i.owner_id = p.id
            AND i.status NOT IN ('Draft', 'Withdrawn')
      );
END;
$function$

