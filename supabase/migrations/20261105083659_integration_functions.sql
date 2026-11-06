-- integration-functions.sql — Approved drafts, stable read contracts and demo URL correction.
CREATE OR REPLACE FUNCTION public.create_idea(p_title text, p_category text, p_problem text, p_proposed_solution text, p_who_benefits text, p_expected_impact text, p_rough_effort text DEFAULT NULL::text, p_links text[] DEFAULT '{}'::text[], p_is_anonymous boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id uuid;
    v_idea_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in to create an idea.';
    END IF;

    IF length(coalesce(p_title,'')) > 100 THEN
        RAISE EXCEPTION 'Title must contain between 1 and 100 characters.';
    END IF;

    IF coalesce(p_category,'') <> '' AND p_category NOT IN (
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
        trim(coalesce(p_title,'')),
        coalesce(p_category,''),
        trim(coalesce(p_problem,'')),
        trim(coalesce(p_proposed_solution,'')),
        trim(coalesce(p_who_benefits,'')),
        trim(coalesce(p_expected_impact,'')),
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
$function$;


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
$function$;


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
      AND (NULLIF(trim(p_q),'') IS NULL OR concat_ws(' ',i.title,i.problem,
        i.proposed_solution,i.who_benefits,i.expected_impact) ILIKE '%'||trim(p_q)||'%')
  ), filtered AS MATERIALIZED (
    SELECT * FROM visible i WHERE
      CASE p_mode WHEN 'drafts' THEN i.status='Draft' AND i.own
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
$function$;


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
$function$;

