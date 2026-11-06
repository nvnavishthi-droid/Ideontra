-- integration-read-fix.sql — Keep reads read-only under PostgREST transactions.
CREATE OR REPLACE FUNCTION public.get_idea_vote_summary(p_idea_id uuid) RETURNS TABLE(vote_count bigint,has_voted boolean) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.ideas i WHERE i.id=p_idea_id AND (i.status<>'Draft' OR EXISTS(SELECT 1 FROM public.idea_private_details d WHERE d.idea_id=i.id AND d.submitter_id=auth.uid()))) THEN RAISE EXCEPTION 'Idea not found'; END IF;
 RETURN QUERY SELECT count(*)::bigint,coalesce(bool_or(v.user_id=auth.uid()),false) FROM public.idea_votes v WHERE v.idea_id=p_idea_id;
END $$;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX ideas_text_search_idx ON public.ideas USING gin ((coalesce(title,'')||' '||coalesce(problem,'')||' '||coalesce(proposed_solution,'')||' '||coalesce(who_benefits,'')||' '||coalesce(expected_impact,'')) extensions.gin_trgm_ops);
CREATE INDEX profiles_name_id_idx ON public.profiles(full_name,id);

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
  IF p_sort IS NULL OR p_sort NOT IN ('newest','updated','votes')
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
      CASE WHEN p_mode='review' THEN i.submitted_at END ASC NULLS LAST,
      CASE WHEN p_mode<>'review' AND p_sort='votes' THEN i.votes END DESC,
      CASE WHEN p_mode<>'review' AND p_sort='updated' THEN i.updated_at END DESC,
      CASE WHEN p_mode<>'review' AND p_sort='newest' THEN i.created_at END DESC,
      i.id
    LIMIT p_page_size OFFSET ((p_page::bigint-1)*p_page_size)
  ) SELECT (SELECT count(*) FROM filtered),
      COALESCE((SELECT jsonb_agg(public.get_idea_summary(id)) FROM page_rows),'[]'::jsonb)
    INTO v_total,v_rows;
  RETURN jsonb_build_object('rows',v_rows,'total',v_total);
END;
$function$;


