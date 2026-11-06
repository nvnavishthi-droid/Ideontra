-- Proposed existing-function hardening — pending review, not applied.
-- follow_idea: restricted DEFINER is required to perform validated RPC-only writes.
CREATE OR REPLACE FUNCTION public.follow_idea(p_idea_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
DECLARE
    v_user_id uuid;
    v_status text;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    SELECT status INTO v_status
    FROM public.ideas
    WHERE id = p_idea_id;

    IF NOT FOUND OR v_status = 'Draft' THEN
        RAISE EXCEPTION 'This idea cannot be followed.';
    END IF;

    INSERT INTO public.idea_followers (idea_id, user_id)
    VALUES (p_idea_id, v_user_id)
    ON CONFLICT (idea_id, user_id) DO NOTHING;
END;
$function$;

REVOKE ALL ON FUNCTION public.follow_idea(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.follow_idea(uuid) TO authenticated;

-- delete_draft: restricted DEFINER is required to perform validated RPC-only writes.
CREATE OR REPLACE FUNCTION public.delete_draft(p_idea_id uuid)
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
        RAISE EXCEPTION 'Only Draft ideas can be deleted.';
    END IF;

    DELETE FROM public.idea_private_details
    WHERE idea_id = p_idea_id
      AND submitter_id = v_user_id;

    DELETE FROM public.ideas
    WHERE id = p_idea_id;

    RETURN p_idea_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_draft(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_draft(uuid) TO authenticated;

-- get_idea_follow_summary: restricted DEFINER is required to return sanitized data beyond raw-table visibility.
CREATE OR REPLACE FUNCTION public.get_idea_follow_summary(p_idea_id uuid)
 RETURNS TABLE(follower_count bigint, is_following boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.ideas WHERE id = p_idea_id AND public.can_see_idea(p_idea_id)
    ) THEN
        RAISE EXCEPTION 'Idea not found.';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::bigint,
        COALESCE(
            BOOL_OR(f.user_id = v_user_id),
            false
        )
    FROM public.idea_followers f
    WHERE f.idea_id = p_idea_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_idea_follow_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_idea_follow_summary(uuid) TO authenticated;

