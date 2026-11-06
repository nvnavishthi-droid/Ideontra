-- 03-functions-6.sql — Data-free verified Supabase schema snapshot, 2026-11-05.
SET check_function_bodies=false;
CREATE OR REPLACE FUNCTION public.update_idea(p_idea_id uuid, p_title text, p_category text, p_problem text, p_proposed_solution text, p_who_benefits text, p_expected_impact text, p_rough_effort text, p_links text[], p_is_anonymous boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
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

    IF length(coalesce(p_title,'')) > 100 OR (v_current_status <> 'Draft' AND nullif(trim(coalesce(p_title,'')),'') IS NULL) THEN
        RAISE EXCEPTION 'Title must contain between 1 and 100 characters.';
    END IF;

    IF NOT (v_current_status='Draft' AND coalesce(p_category,'')='') AND (p_category IS NULL OR p_category NOT IN (
        'New Service Offering',
        'Internal Tool',
        'Process Improvement',
        'Marketing/Content',
        'Client Experience',
        'Training'
    )) THEN
        RAISE EXCEPTION 'Invalid idea category.';
    END IF;

    IF p_rough_effort IS NOT NULL
       AND p_rough_effort NOT IN ('Small', 'Medium', 'Large') THEN
        RAISE EXCEPTION 'Invalid rough effort.';
    END IF;

    IF v_current_status <> 'Draft' AND (p_problem IS NULL OR length(trim(coalesce(p_problem,''))) = 0
       OR p_proposed_solution IS NULL OR length(trim(coalesce(p_proposed_solution,''))) = 0
       OR p_who_benefits IS NULL OR length(trim(coalesce(p_who_benefits,''))) = 0
       OR p_expected_impact IS NULL OR length(trim(coalesce(p_expected_impact,''))) = 0) THEN
        RAISE EXCEPTION 'All required idea fields must be provided.';
    END IF;

    UPDATE public.ideas
    SET
        title = trim(coalesce(p_title,'')),
        category = coalesce(p_category,''),
        problem = trim(coalesce(p_problem,'')),
        proposed_solution = trim(coalesce(p_proposed_solution,'')),
        who_benefits = trim(coalesce(p_who_benefits,'')),
        expected_impact = trim(coalesce(p_expected_impact,'')),
        rough_effort = p_rough_effort,
        links = COALESCE(p_links, '{}'),
        is_anonymous = COALESCE(p_is_anonymous, false),
        updated_at = now()
    WHERE id = p_idea_id;

    RETURN p_idea_id;
END;
$function$

REVOKE ALL ON FUNCTION public.update_idea(uuid,text,text,text,text,text,text,text,text[],boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.update_idea(uuid,text,text,text,text,text,text,text,text[],boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_idea_links()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
 IF char_length(array_to_string(NEW.links,E'\n'))>2000 OR EXISTS (SELECT 1 FROM unnest(NEW.links) l WHERE l !~* '^https?://[^[:space:]]+$') THEN RAISE EXCEPTION 'Supporting links must be HTTP(S) URLs, at most 2000 characters combined'; END IF;
 RETURN NEW;
END $function$

REVOKE ALL ON FUNCTION public.validate_idea_links() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.vote_for_idea(p_idea_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
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
$function$

REVOKE ALL ON FUNCTION public.vote_for_idea(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vote_for_idea(uuid) TO authenticated;

SET check_function_bodies=true;
