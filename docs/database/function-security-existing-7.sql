-- Proposed existing-function hardening — pending review, not applied.
-- save_idea_demo: restricted DEFINER is required to perform validated RPC-only writes.
CREATE OR REPLACE FUNCTION public.save_idea_demo(p_idea_id uuid, p_demo_video_path text DEFAULT NULL::text, p_demo_video_url text DEFAULT NULL::text, p_outcome_summary text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
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
       p_demo_video_url !~* '^https://(www\.)?(youtube\.com|youtu\.be|loom\.com|drive\.google\.com|docs\.google\.com)(/|$)'
     ) THEN
    RAISE EXCEPTION 'Use a valid YouTube, Loom or Google Drive HTTPS link.';
  END IF;

  IF length(coalesce(p_outcome_summary, '')) > 5000 THEN
    RAISE EXCEPTION 'Outcome summary cannot exceed 5000 characters.';
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

REVOKE ALL ON FUNCTION public.save_idea_demo(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_idea_demo(uuid,text,text,text) TO authenticated;

-- get_idea_submitter_name: restricted DEFINER is required to return sanitized data beyond raw-table visibility.
CREATE OR REPLACE FUNCTION public.get_idea_submitter_name(p_idea_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
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
$function$;

REVOKE ALL ON FUNCTION public.get_idea_submitter_name(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_idea_submitter_name(uuid) TO authenticated;

