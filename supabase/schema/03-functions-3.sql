-- 03-functions-3.sql — Data-free verified Supabase schema snapshot, 2026-11-05.
SET check_function_bodies=false;
CREATE OR REPLACE FUNCTION public.get_idea_detail(p_idea_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_row jsonb; v_mask uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  v_row:=public.get_idea_summary(p_idea_id);
  IF v_row IS NULL THEN RAISE EXCEPTION 'Idea not found'; END IF;
  IF (v_row->>'is_anonymous')::boolean AND NOT public.is_admin() THEN
    SELECT submitter_id INTO v_mask FROM public.idea_private_details WHERE idea_id=p_idea_id;
  END IF;
  RETURN v_row || jsonb_build_object(
    'comments',COALESCE((SELECT jsonb_agg((to_jsonb(c)-'user_id') || jsonb_build_object(
      'user_id',CASE WHEN c.user_id=v_mask THEN NULL ELSE c.user_id END,
      'author_name',CASE WHEN c.user_id=v_mask THEN NULL ELSE p.full_name END,
      'is_own',c.user_id=auth.uid()) ORDER BY c.created_at,c.id)
      FROM public.idea_comments c LEFT JOIN public.profiles p ON p.id=c.user_id WHERE c.idea_id=p_idea_id),'[]'::jsonb),
    'status_history',COALESCE((SELECT jsonb_agg((to_jsonb(h)-'changed_by') || jsonb_build_object(
      'changed_by',CASE WHEN h.changed_by=v_mask THEN NULL ELSE h.changed_by END,
      'actor_name',CASE WHEN h.changed_by=v_mask THEN NULL ELSE p.full_name END) ORDER BY h.changed_at,h.id)
      FROM public.idea_status_history h LEFT JOIN public.profiles p ON p.id=h.changed_by WHERE h.idea_id=p_idea_id),'[]'::jsonb),
    'owner_history',COALESCE((SELECT jsonb_agg((to_jsonb(h)-'owner_id'-'assigned_by') || jsonb_build_object(
      'owner_id',CASE WHEN h.owner_id=v_mask THEN NULL ELSE h.owner_id END,
      'assigned_by',CASE WHEN h.assigned_by=v_mask THEN NULL ELSE h.assigned_by END,
      'owner_name',CASE WHEN h.owner_id=v_mask THEN NULL ELSE p.full_name END) ORDER BY h.assigned_at,h.id)
      FROM public.idea_owner_history h LEFT JOIN public.profiles p ON p.id=h.owner_id WHERE h.idea_id=p_idea_id),'[]'::jsonb),
    'progress_updates',COALESCE((SELECT jsonb_agg((to_jsonb(u)-'user_id') || jsonb_build_object(
      'user_id',CASE WHEN u.user_id=v_mask THEN NULL ELSE u.user_id END,
      'author_name',CASE WHEN u.user_id=v_mask THEN NULL ELSE p.full_name END) ORDER BY u.created_at,u.id)
      FROM public.idea_progress_updates u LEFT JOIN public.profiles p ON p.id=u.user_id WHERE u.idea_id=p_idea_id),'[]'::jsonb));
END;
$function$

REVOKE ALL ON FUNCTION public.get_idea_detail(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_idea_detail(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_idea_follow_summary(p_idea_id uuid)
 RETURNS TABLE(follower_count bigint, is_following boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
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
$function$

REVOKE ALL ON FUNCTION public.get_idea_follow_summary(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_idea_follow_summary(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_idea_submitter_name(p_idea_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_submitter_name text;
    v_is_anonymous boolean;
    v_is_admin boolean;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    v_is_admin := public.is_admin();

    -- Confirm that the caller is allowed to view this idea.
    IF NOT EXISTS (
        SELECT 1
        FROM public.ideas AS i
        LEFT JOIN public.idea_private_details AS pd
            ON pd.idea_id = i.id
        WHERE i.id = p_idea_id
          AND (
              i.status <> 'Draft'
              OR pd.submitter_id = v_user_id
          )
    ) THEN
        RETURN NULL;
    END IF;

    -- Read the anonymity setting and submitter's name.
    SELECT
        i.is_anonymous,
        p.full_name
    INTO
        v_is_anonymous,
        v_submitter_name
    FROM public.ideas AS i
    JOIN public.idea_private_details AS pd
        ON pd.idea_id = i.id
    JOIN public.profiles AS p
        ON p.id = pd.submitter_id
    WHERE i.id = p_idea_id;

    -- Hide anonymous identities from all non-admin users.
    IF v_is_anonymous AND NOT v_is_admin THEN
        RETURN NULL;
    END IF;

    RETURN v_submitter_name;
END;
$function$

REVOKE ALL ON FUNCTION public.get_idea_submitter_name(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_idea_submitter_name(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_idea_summary(p_idea_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE i public.ideas; a uuid; v_admin boolean; v_row jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO i FROM public.ideas WHERE id=p_idea_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT submitter_id INTO a FROM public.idea_private_details WHERE idea_id=i.id;
  IF i.status='Draft' AND a IS DISTINCT FROM auth.uid() THEN RETURN NULL; END IF;
  v_admin:=public.is_admin();
  v_row:=to_jsonb(i);
  IF i.is_anonymous AND NOT v_admin AND i.owner_id=a THEN
    v_row:=v_row || jsonb_build_object('owner_id',NULL);
  END IF;
  RETURN v_row || jsonb_build_object(
    'author_name',CASE WHEN i.is_anonymous AND NOT v_admin THEN NULL ELSE
      (SELECT full_name FROM public.profiles WHERE id=a) END,
    'owner_name',CASE WHEN i.is_anonymous AND NOT v_admin AND i.owner_id=a THEN NULL ELSE
      (SELECT full_name FROM public.profiles WHERE id=i.owner_id) END,
    'is_author',COALESCE(a=auth.uid(),false), 'is_owner',COALESCE(i.owner_id=auth.uid(),false),
    'vote_count',(SELECT count(*) FROM public.idea_votes WHERE idea_id=i.id),
    'comment_count',(SELECT count(*) FROM public.idea_comments WHERE idea_id=i.id AND deleted_at IS NULL),
    'has_voted',EXISTS(SELECT 1 FROM public.idea_votes WHERE idea_id=i.id AND user_id=auth.uid()),
    'is_following',EXISTS(SELECT 1 FROM public.idea_followers WHERE idea_id=i.id AND user_id=auth.uid()),
    'is_overdue',i.status='In Progress' AND i.target_date<current_date);
END;
$function$;
REVOKE ALL ON FUNCTION public.get_idea_summary(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_idea_summary(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_idea_vote_summary(p_idea_id uuid)
 RETURNS TABLE(vote_count bigint, has_voted boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.ideas i WHERE i.id=p_idea_id AND (i.status<>'Draft' OR EXISTS(SELECT 1 FROM public.idea_private_details d WHERE d.idea_id=i.id AND d.submitter_id=auth.uid()))) THEN RAISE EXCEPTION 'Idea not found'; END IF;
 RETURN QUERY SELECT count(*)::bigint,coalesce(bool_or(v.user_id=auth.uid()),false) FROM public.idea_votes v WHERE v.idea_id=p_idea_id;
END $function$

REVOKE ALL ON FUNCTION public.get_idea_vote_summary(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_idea_vote_summary(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_profile_names(p_user_ids uuid[])
 RETURNS TABLE(id uuid, full_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
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

REVOKE ALL ON FUNCTION public.get_profile_names(uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_names(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_workflow_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF current_user<>'postgres' THEN RAISE EXCEPTION 'Use an authorized workflow RPC'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$

REVOKE ALL ON FUNCTION public.guard_workflow_write() FROM PUBLIC,anon,authenticated;

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

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND COALESCE(auth.jwt()->'app_metadata'->>'role' = 'admin', false);
$function$

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_idea_author(p_idea_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.idea_private_details
    WHERE idea_id=p_idea_id AND submitter_id=auth.uid());
$function$

REVOKE ALL ON FUNCTION public.is_idea_author(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.is_idea_author(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_idea_owner(p_idea_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND COALESCE((public.get_idea_summary(p_idea_id)->>'is_owner')::boolean,false);
$function$

REVOKE ALL ON FUNCTION public.is_idea_owner(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.is_idea_owner(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_member()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND COALESCE(auth.jwt()->'app_metadata'->>'role' = 'member', false);
$function$

REVOKE ALL ON FUNCTION public.is_member() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.is_member() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_idea_owners(p_page integer DEFAULT 1, p_page_size integer DEFAULT 25)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_page IS NULL OR p_page<1 OR p_page_size IS NULL OR p_page_size NOT IN (10,25,50,100)
    THEN RAISE EXCEPTION 'Invalid pagination'; END IF;
  RETURN jsonb_build_object('total',(SELECT count(*) FROM public.profiles),
    'rows',COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM
      (SELECT id,full_name FROM public.profiles ORDER BY full_name NULLS LAST,id
       LIMIT p_page_size OFFSET ((p_page::bigint-1)*p_page_size)) p),'[]'::jsonb));
END;
$function$

REVOKE ALL ON FUNCTION public.list_idea_owners(integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_idea_owners(integer,integer) TO authenticated;

SET check_function_bodies=true;
