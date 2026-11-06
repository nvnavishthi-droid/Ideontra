-- dashboard-interactions.sql — Hide deleted comment branches and allow explicit review sorting.
-- Locked target: knmqlkhnfumeuxgnkuez. Preserve Auth checks, DEFINER scopes and grants.

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
      FROM public.idea_comments c LEFT JOIN public.profiles p ON p.id=c.user_id WHERE c.idea_id=p_idea_id AND c.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.idea_comments parent WHERE parent.id=c.parent_comment_id AND parent.deleted_at IS NOT NULL)),'[]'::jsonb),
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
;

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
    'comment_count',(SELECT count(*) FROM public.idea_comments c WHERE c.idea_id=i.id AND c.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.idea_comments parent WHERE parent.id=c.parent_comment_id AND parent.deleted_at IS NOT NULL)),
    'has_voted',EXISTS(SELECT 1 FROM public.idea_votes WHERE idea_id=i.id AND user_id=auth.uid()),
    'is_following',EXISTS(SELECT 1 FROM public.idea_followers WHERE idea_id=i.id AND user_id=auth.uid()),
    'is_overdue',i.status='In Progress' AND i.target_date<current_date);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.list_ideas(p_page integer DEFAULT 1, p_page_size integer DEFAULT 25, p_q text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_owner uuid DEFAULT NULL::uuid, p_quadrant text DEFAULT NULL::text, p_sort text DEFAULT 'newest'::text, p_mode text DEFAULT 'all'::text, p_active_statuses text[] DEFAULT NULL::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_rows jsonb; v_total bigint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_page IS NULL OR p_page<1 OR p_page_size IS NULL OR p_page_size NOT IN (10,25,50,100)
    THEN RAISE EXCEPTION 'Invalid pagination'; END IF;
  IF NULLIF(trim(p_q),'') IS NOT NULL AND char_length(trim(p_q))<3
    THEN RAISE EXCEPTION 'Search requires at least 3 characters'; END IF;
  IF p_sort IS NULL OR p_sort NOT IN ('newest','updated','votes','oldest')
    THEN RAISE EXCEPTION 'Invalid sort'; END IF;
  IF p_mode IS NULL OR p_mode NOT IN ('all','drafts','submissions','owned','following','review','overdue')
    THEN RAISE EXCEPTION 'Invalid view'; END IF;
  IF p_mode IN ('review','overdue') AND NOT public.is_admin()
    THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_mode='review' AND NULLIF(p_status,'') IS NULL
    THEN RAISE EXCEPTION 'Review queue requires an explicit status filter'; END IF;
  WITH visible AS MATERIALIZED (
    SELECT i.*, public.is_idea_author(i.id) AS own,
      (SELECT vote_count FROM public.get_idea_vote_summary(i.id)) AS votes
    FROM public.ideas i
    WHERE (i.status<>'Draft' OR public.is_idea_author(i.id))
      AND (NULLIF(p_status,'') IS NULL OR i.status=p_status)
      AND (p_active_statuses IS NULL OR i.status=ANY(p_active_statuses))
      AND (NULLIF(p_category,'') IS NULL OR i.category=p_category)
      AND (p_owner IS NULL OR (p_owner='00000000-0000-0000-0000-000000000000'::uuid AND i.owner_id IS NULL) OR (i.owner_id=p_owner AND (public.is_admin() OR NOT i.is_anonymous OR NOT EXISTS (SELECT 1 FROM public.idea_private_details d WHERE d.idea_id=i.id AND d.submitter_id=i.owner_id))))
      AND (NULLIF(p_quadrant,'') IS NULL OR i.evaluation_quadrant=p_quadrant)
      AND (NULLIF(trim(p_q),'') IS NULL OR (coalesce(i.title,'')||' '||coalesce(i.problem,'')||' '||coalesce(i.proposed_solution,'')||' '||coalesce(i.who_benefits,'')||' '||coalesce(i.expected_impact,'')) ILIKE '%'||trim(p_q)||'%')
  ), filtered AS MATERIALIZED (
    SELECT * FROM visible i WHERE
      CASE p_mode WHEN 'drafts' THEN i.status='Draft' AND i.own
        WHEN 'all' THEN i.status<>'Draft'
        WHEN 'submissions' THEN i.status<>'Draft' AND i.own
        WHEN 'owned' THEN i.owner_id=auth.uid()
        WHEN 'following' THEN EXISTS(SELECT 1 FROM public.idea_followers f WHERE f.idea_id=i.id AND f.user_id=auth.uid())
        WHEN 'overdue' THEN i.status='In Progress' AND i.target_date<current_date
        ELSE true END
  ), page_rows AS (
    SELECT * FROM filtered i ORDER BY
      CASE WHEN p_sort='oldest' THEN i.submitted_at END ASC NULLS LAST,
      CASE WHEN p_sort='votes' THEN i.votes END DESC,
      CASE WHEN p_sort='updated' THEN i.updated_at END DESC,
      CASE WHEN p_sort='newest' THEN i.created_at END DESC,
      i.id
    LIMIT p_page_size OFFSET ((p_page::bigint-1)*p_page_size)
  ) SELECT (SELECT count(*) FROM filtered),
      COALESCE((SELECT jsonb_agg(public.get_idea_summary(id)) FROM page_rows),'[]'::jsonb)
    INTO v_total,v_rows;
  RETURN jsonb_build_object('rows',v_rows,'total',v_total);
END;
$function$
;
