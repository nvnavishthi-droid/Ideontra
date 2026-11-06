-- 03-functions-4.sql — Data-free verified Supabase schema snapshot, 2026-11-05.
SET check_function_bodies=false;
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
$function$

REVOKE ALL ON FUNCTION public.list_ideas(integer,integer,text,text,text,uuid,text,text,text,text[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_ideas(integer,integer,text,text,text,uuid,text,text,text,text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_visible_owners(p_page integer DEFAULT 1, p_page_size integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_page<1 OR p_page_size NOT IN (10,25,50,100) THEN RAISE EXCEPTION 'Invalid pagination'; END IF;
 WITH visible AS (SELECT DISTINCT p.id,p.full_name FROM public.profiles p JOIN public.ideas i ON i.owner_id=p.id WHERE i.status<>'Draft' AND (public.is_admin() OR NOT i.is_anonymous OR NOT EXISTS(SELECT 1 FROM public.idea_private_details d WHERE d.idea_id=i.id AND d.submitter_id=p.id))), page AS (SELECT * FROM visible ORDER BY full_name,id LIMIT p_page_size OFFSET (p_page::bigint-1)*p_page_size)
 SELECT jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(p)) FROM page p),'[]'),'total',(SELECT count(*) FROM visible)) INTO result;
 RETURN result;
END $function$

REVOKE ALL ON FUNCTION public.list_visible_owners(integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_visible_owners(integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.reassign_idea_owner(p_idea_id uuid, p_new_owner_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
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
          AND role IN ('member','admin')
    ) THEN
        RAISE EXCEPTION 'Select a valid user.';
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

REVOKE ALL ON FUNCTION public.reassign_idea_owner(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reassign_idea_owner(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_idea_demo(p_idea_id uuid, p_demo_video_path text DEFAULT NULL::text, p_demo_video_url text DEFAULT NULL::text, p_outcome_summary text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_owner_id uuid;
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be logged in.';
  END IF;

  SELECT i.owner_id, i.status
  INTO v_owner_id, v_status
  FROM public.ideas AS i
  WHERE i.id = p_idea_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Idea not found.';
  END IF;

  IF v_status <> 'In Progress' THEN
    RAISE EXCEPTION 'Demo details can only be added while the idea is In Progress.';
  END IF;

  IF v_owner_id IS DISTINCT FROM auth.uid()
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the assigned owner or an admin can update demo details.';
  END IF;

  IF NULLIF(p_demo_video_path, '') IS NOT NULL
     AND split_part(p_demo_video_path, '/', 1) <> p_idea_id::text THEN
    RAISE EXCEPTION 'Invalid demo video path.';
  END IF;

  IF NULLIF(p_demo_video_path, '') IS NOT NULL
     AND NULLIF(p_demo_video_url, '') IS NOT NULL THEN
    RAISE EXCEPTION 'Provide either an uploaded video or an external link, not both.';
  END IF;

  IF NULLIF(p_demo_video_url, '') IS NOT NULL
     AND (
       p_demo_video_url !~* '^https://(www[.])?(youtube[.]com|youtu[.]be|loom[.]com|drive[.]google[.]com)(/|$)'
     ) THEN
    RAISE EXCEPTION 'Use a valid YouTube, Loom or Google Drive HTTPS link.';
  END IF;

  IF length(coalesce(p_outcome_summary, '')) > 2000 THEN
    RAISE EXCEPTION 'Outcome summary cannot exceed 2000 characters.';
  END IF;

  IF NULLIF(p_demo_video_path, '') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM storage.objects o WHERE o.bucket_id='idea-demos'
      AND o.name=p_demo_video_path
      AND o.metadata->>'mimetype' IN ('video/mp4','video/quicktime','video/webm')
      AND CASE WHEN o.metadata->>'size' ~ '^[0-9]+$'
        THEN (o.metadata->>'size')::numeric <= 104857600 ELSE false END
  ) THEN RAISE EXCEPTION 'Uploaded demo must exist and have an allowed type and size'; END IF;

  UPDATE public.ideas
  SET
    demo_video_path = NULLIF(p_demo_video_path, ''),
    demo_video_url = NULLIF(p_demo_video_url, ''),
    outcome_summary = NULLIF(trim(coalesce(p_outcome_summary, '')), ''),
    updated_at = now()
  WHERE id = p_idea_id;
END;
$function$

REVOKE ALL ON FUNCTION public.save_idea_demo(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_idea_demo(uuid,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_idea_form(p_values jsonb, p_idea_id uuid DEFAULT NULL::uuid, p_submit boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid; v_status text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_idea_id IS NULL THEN
  v_id:=public.create_idea(p_values->>'title',p_values->>'category',p_values->>'problem',p_values->>'solution',p_values->>'beneficiaries',p_values->>'impact',nullif(p_values->>'effort',''),ARRAY(SELECT jsonb_array_elements_text(coalesce(p_values->'links','[]'))),coalesce((p_values->>'anonymous')::boolean,false));
 ELSE
  v_id:=public.update_idea(p_idea_id,p_values->>'title',p_values->>'category',p_values->>'problem',p_values->>'solution',p_values->>'beneficiaries',p_values->>'impact',nullif(p_values->>'effort',''),ARRAY(SELECT jsonb_array_elements_text(coalesce(p_values->'links','[]'))),coalesce((p_values->>'anonymous')::boolean,false));
 END IF;
 IF p_submit THEN
  v_status:=public.get_idea_summary(v_id)->>'status';
  IF v_status='Draft' THEN PERFORM public.submit_idea(v_id);
  ELSIF v_status='Needs More Info' THEN PERFORM public.transition_idea(v_id,'Submitted');
  ELSE RAISE EXCEPTION 'This idea cannot be submitted from its current status'; END IF;
 END IF;
 RETURN v_id;
END $function$

REVOKE ALL ON FUNCTION public.save_idea_form(jsonb,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_idea_form(jsonb,uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_idea(p_idea_id uuid)
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

    IF v_current_status <> 'Draft' THEN
        RAISE EXCEPTION 'Only Draft ideas can be submitted.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.ideas WHERE id=p_idea_id AND (nullif(trim(title),'') IS NULL OR nullif(trim(category),'') IS NULL OR nullif(trim(problem),'') IS NULL OR nullif(trim(proposed_solution),'') IS NULL OR nullif(trim(who_benefits),'') IS NULL OR nullif(trim(expected_impact),'') IS NULL)) THEN RAISE EXCEPTION 'Complete all required fields before submitting'; END IF;

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
$function$

REVOKE ALL ON FUNCTION public.submit_idea(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_idea(uuid) TO authenticated;

SET check_function_bodies=true;
