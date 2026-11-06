-- 03-functions-2.sql — Data-free verified Supabase schema snapshot, 2026-11-05.
SET check_function_bodies=false;
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
$function$

REVOKE ALL ON FUNCTION public.create_idea(text,text,text,text,text,text,text,text[],boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_idea(text,text,text,text,text,text,text,text[],boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_role text; v_claims jsonb;
BEGIN
  SELECT role::text INTO v_role FROM public.profiles WHERE id=(event->>'user_id')::uuid;
  IF v_role IS NULL THEN RAISE EXCEPTION 'Profile required before issuing access token'; END IF;
  v_claims:=event->'claims';
  v_claims:=jsonb_set(v_claims,'{app_metadata}',COALESCE(v_claims->'app_metadata','{}'::jsonb)
    || jsonb_build_object('role',v_role));
  RETURN jsonb_set(event,'{claims}',v_claims);
END;
$function$

REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

CREATE OR REPLACE FUNCTION public.delete_draft(p_idea_id uuid)
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

REVOKE ALL ON FUNCTION public.delete_draft(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.delete_draft(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_idea_comment(p_comment_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 UPDATE public.idea_comments SET content='Comment deleted',deleted_at=now(),updated_at=now()
 WHERE id=p_comment_id AND user_id=auth.uid() AND deleted_at IS NULL AND created_at>=now()-interval '15 minutes';
 IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found or deletion window expired'; END IF;
 INSERT INTO public.audit_log(actor_id,idea_id,action,details) SELECT auth.uid(),idea_id,'comment_deleted',jsonb_build_object('comment_id',id) FROM public.idea_comments WHERE id=p_comment_id;
 RETURN p_comment_id;
END $function$

REVOKE ALL ON FUNCTION public.delete_idea_comment(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.delete_idea_comment(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.edit_idea_comment(p_comment_id uuid, p_content text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF nullif(trim(p_content),'') IS NULL OR char_length(p_content)>2000 THEN RAISE EXCEPTION 'Comment must contain 1 to 2000 characters'; END IF;
 UPDATE public.idea_comments SET content=trim(p_content),updated_at=now() WHERE id=p_comment_id AND user_id=auth.uid() AND deleted_at IS NULL AND created_at>=now()-interval '15 minutes';
 IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found or edit period expired'; END IF;
 RETURN p_comment_id;
END $function$

REVOKE ALL ON FUNCTION public.edit_idea_comment(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.edit_idea_comment(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_employee_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.email IS NULL OR NEW.email !~* '^[^@[:space:]]+@closefuture[.]io$' THEN
    RAISE EXCEPTION 'Use a closefuture.io employee email address';
  END IF;
  RETURN NEW;
END;
$function$

REVOKE ALL ON FUNCTION public.enforce_employee_email() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.evaluate_idea(p_idea_id uuid, p_impact_score integer, p_effort_score integer)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_quadrant text;
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be logged in.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can evaluate ideas.';
  END IF;

  IF p_impact_score IS NULL OR p_effort_score IS NULL
     OR p_impact_score NOT BETWEEN 1 AND 5
     OR p_effort_score NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Impact and effort scores must be between 1 and 5.';
  END IF;

  SELECT status
  INTO v_status
  FROM public.ideas
  WHERE id = p_idea_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Idea not found.';
  END IF;

  IF v_status <> 'Under Evaluation' THEN
    RAISE EXCEPTION 'This idea cannot be evaluated in its current status.';
  END IF;

  IF p_impact_score >= 3 AND p_effort_score < 3 THEN
    v_quadrant := 'Quick Win';
  ELSIF p_impact_score >= 3 AND p_effort_score >= 3 THEN
    v_quadrant := 'Big Bet';
  ELSIF p_impact_score < 3 AND p_effort_score < 3 THEN
    v_quadrant := 'Fill-in';
  ELSE
    v_quadrant := 'Not Worth It';
  END IF;

  UPDATE public.ideas
  SET
    impact_score = p_impact_score,
    effort_score = p_effort_score,
    updated_at = now()
  WHERE id = p_idea_id;

  RETURN v_quadrant;
END;
$function$

REVOKE ALL ON FUNCTION public.evaluate_idea(uuid,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_idea(uuid,integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.follow_idea(p_idea_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
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
$function$

REVOKE ALL ON FUNCTION public.follow_idea(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.follow_idea(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN jsonb_build_object('status_counts',COALESCE((SELECT jsonb_object_agg(status,n)
    FROM (SELECT status,count(*) n FROM public.ideas WHERE status<>'Draft' GROUP BY status) s),'{}'::jsonb),
    'category_counts',COALESCE((SELECT jsonb_object_agg(category,n)
    FROM (SELECT category,count(*) n FROM public.ideas WHERE status<>'Draft' GROUP BY category) c),'{}'::jsonb),
    'overdue_count',(SELECT count(*) FROM public.ideas WHERE status='In Progress' AND target_date<current_date));
END;
$function$

REVOKE ALL ON FUNCTION public.get_admin_dashboard() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard() TO authenticated;

SET check_function_bodies=true;
