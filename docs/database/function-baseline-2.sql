-- function-baseline SQL — Read-only snapshot before security remediation.
CREATE OR REPLACE FUNCTION public.delete_draft(p_idea_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
$function$

CREATE OR REPLACE FUNCTION public.get_idea_follow_summary(p_idea_id uuid)
 RETURNS TABLE(follower_count bigint, is_following boolean)
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

    IF NOT EXISTS (
        SELECT 1 FROM public.ideas WHERE id = p_idea_id
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
$function$

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$

