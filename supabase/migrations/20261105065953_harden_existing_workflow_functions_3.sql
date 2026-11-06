-- Proposed existing-function hardening — pending review, not applied.
-- vote_for_idea: restricted DEFINER is required to perform validated RPC-only writes.
CREATE OR REPLACE FUNCTION public.vote_for_idea(p_idea_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
DECLARE
    v_user_id uuid;
    v_status text;
    v_is_owner boolean;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in to vote.';
    END IF;

    SELECT i.status
    INTO v_status
    FROM public.ideas i
    WHERE i.id = p_idea_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Idea not found.';
    END IF;

    IF v_status NOT IN (
        'Submitted',
        'Needs More Info',
        'Under Evaluation'
    ) THEN
        RAISE EXCEPTION 'Voting is not allowed for this idea status.';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.idea_private_details pd
        WHERE pd.idea_id = p_idea_id
        AND pd.submitter_id = v_user_id
    )
    INTO v_is_owner;

    IF v_is_owner THEN
        RAISE EXCEPTION 'You cannot vote for your own idea.';
    END IF;

    INSERT INTO public.idea_votes (
        idea_id,
        user_id
    )
    VALUES (
        p_idea_id,
        v_user_id
    );

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'You have already voted for this idea.';
END;
$function$;

REVOKE ALL ON FUNCTION public.vote_for_idea(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vote_for_idea(uuid) TO authenticated;

-- unvote_for_idea: restricted DEFINER is required to perform validated RPC-only writes.
CREATE OR REPLACE FUNCTION public.unvote_for_idea(p_idea_id uuid)
 RETURNS void
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

    DELETE FROM public.idea_votes
    WHERE idea_id = p_idea_id
    AND user_id = v_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.unvote_for_idea(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unvote_for_idea(uuid) TO authenticated;

-- get_idea_vote_summary: restricted DEFINER is required to return sanitized data beyond raw-table visibility.
CREATE OR REPLACE FUNCTION public.get_idea_vote_summary(p_idea_id uuid)
 RETURNS TABLE(vote_count bigint, has_voted boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
DECLARE
    v_user_id uuid;
    v_status text;
    v_can_view boolean;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    SELECT i.status
    INTO v_status
    FROM public.ideas i
    WHERE i.id = p_idea_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Idea not found.';
    END IF;

    SELECT (
        v_status <> 'Draft'
        OR EXISTS (
            SELECT 1
            FROM public.idea_private_details pd
            WHERE pd.idea_id = p_idea_id
            AND pd.submitter_id = v_user_id
        )
    )
    INTO v_can_view;

    IF NOT v_can_view THEN
        RAISE EXCEPTION 'You are not allowed to view this idea.';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::bigint,
        EXISTS (
            SELECT 1
            FROM public.idea_votes iv
            WHERE iv.idea_id = p_idea_id
            AND iv.user_id = v_user_id
        )
    FROM public.idea_votes iv
    WHERE iv.idea_id = p_idea_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_idea_vote_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_idea_vote_summary(uuid) TO authenticated;

