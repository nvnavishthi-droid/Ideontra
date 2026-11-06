-- 03-functions-1.sql — Data-free verified Supabase schema snapshot, 2026-11-05.
SET check_function_bodies=false;
CREATE OR REPLACE FUNCTION public.add_idea_comment(p_idea_id uuid, p_content text, p_parent_comment_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$DECLARE
    v_user_id uuid;
    v_status text;
    v_comment_id uuid;
    v_parent_idea_id uuid;
    v_parent_parent_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
        RAISE EXCEPTION 'Comment cannot be empty.';
    END IF;

    IF length(p_content) > 5000 THEN
        RAISE EXCEPTION 'Comment cannot exceed 5000 characters.';
    END IF;

    SELECT i.status INTO v_status
    FROM public.ideas i
    WHERE i.id = p_idea_id;

    IF NOT FOUND OR v_status = 'Draft' THEN
        RAISE EXCEPTION 'Comments are not allowed for this idea.';
    END IF;

    IF p_parent_comment_id IS NOT NULL THEN
        SELECT c.idea_id, c.parent_comment_id
        INTO v_parent_idea_id, v_parent_parent_id
        FROM public.idea_comments c
        WHERE c.id = p_parent_comment_id;

        IF NOT FOUND OR v_parent_idea_id <> p_idea_id THEN
            RAISE EXCEPTION 'Invalid parent comment.';
        END IF;

        IF v_parent_parent_id IS NOT NULL THEN
            RAISE EXCEPTION 'Replies can only be one level deep.';
        END IF;
    END IF;

    INSERT INTO public.idea_comments (
        idea_id, user_id, parent_comment_id, content
    )
    VALUES (
        p_idea_id, v_user_id, p_parent_comment_id, trim(p_content)
    )
    RETURNING id INTO v_comment_id;

    RETURN v_comment_id;
END;$function$

REVOKE ALL ON FUNCTION public.add_idea_comment(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.add_idea_comment(uuid,text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_idea_progress_update(p_idea_id uuid, p_update_text text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id uuid;
    v_owner_id uuid;
    v_status text;
    v_update_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    IF p_update_text IS NULL
       OR length(trim(p_update_text)) = 0
       OR length(trim(p_update_text)) > 2000 THEN
        RAISE EXCEPTION 'Update must contain 1 to 2000 characters.';
    END IF;

    SELECT owner_id, status
    INTO v_owner_id, v_status
    FROM public.ideas
    WHERE id = p_idea_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Idea not found.';
    END IF;

    IF v_status <> 'In Progress' THEN
        RAISE EXCEPTION 'Progress updates are allowed only for ideas In Progress.';
    END IF;

    IF NOT public.is_admin() AND v_owner_id IS DISTINCT FROM v_user_id THEN
        RAISE EXCEPTION 'Only the assigned owner or an admin can post updates.';
    END IF;

    INSERT INTO public.idea_progress_updates (
        idea_id,
        user_id,
        update_text
    )
    VALUES (
        p_idea_id,
        v_user_id,
        trim(p_update_text)
    )
    RETURNING id INTO v_update_id;

    RETURN v_update_id;
END;
$function$

REVOKE ALL ON FUNCTION public.add_idea_progress_update(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.add_idea_progress_update(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_evaluated_idea(p_idea_id uuid, p_impact integer, p_effort integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
 PERFORM public.evaluate_idea(p_idea_id,p_impact,p_effort);
 PERFORM public.transition_idea(p_idea_id,'Approved');
END $function$

REVOKE ALL ON FUNCTION public.approve_evaluated_idea(uuid,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.approve_evaluated_idea(uuid,integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_comment_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF current_user<>'postgres' THEN RAISE EXCEPTION 'Authorized workflow required'; END IF;
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_log(actor_id,idea_id,action,details)
      VALUES(auth.uid(),OLD.idea_id,'comment_deleted',jsonb_build_object('comment_id',OLD.id));
  END IF;
  RETURN OLD;
END;
$function$

REVOKE ALL ON FUNCTION public.audit_comment_delete() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.audit_idea_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid; v_action text; v_details jsonb:='{}'::jsonb;
BEGIN
  IF current_user<>'postgres' THEN RAISE EXCEPTION 'Authorized workflow required'; END IF;
  IF auth.uid() IS NULL THEN
    IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  IF TG_OP='INSERT' THEN v_id:=NEW.id; v_action:='idea_created';
  ELSIF TG_OP='DELETE' THEN v_id:=OLD.id; v_action:='draft_deleted';
  ELSE
    v_id:=NEW.id; v_action:='idea_updated';
    IF OLD.status IS DISTINCT FROM NEW.status THEN v_action:='status_changed'; END IF;
    v_details:=jsonb_build_object('from_status',OLD.status,'to_status',NEW.status,
      'scores_changed',OLD.impact_score IS DISTINCT FROM NEW.impact_score OR OLD.effort_score IS DISTINCT FROM NEW.effort_score,
      'owner_changed',OLD.owner_id IS DISTINCT FROM NEW.owner_id,
      'demo_changed',OLD.demo_video_path IS DISTINCT FROM NEW.demo_video_path OR OLD.demo_video_url IS DISTINCT FROM NEW.demo_video_url);
  END IF;
  INSERT INTO public.audit_log(actor_id,idea_id,action,details)
    VALUES(auth.uid(),v_id,v_action,v_details);
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$

REVOKE ALL ON FUNCTION public.audit_idea_write() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.broadcast_idea_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE r jsonb; v_id uuid; v_status text; v_author uuid; payload jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RETURN NULL; END IF;
 r:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 v_id:=CASE WHEN TG_TABLE_NAME='ideas' THEN (r->>'id')::uuid ELSE (r->>'idea_id')::uuid END;
 SELECT status INTO v_status FROM public.ideas WHERE id=v_id;
 SELECT submitter_id INTO v_author FROM public.idea_private_details WHERE idea_id=v_id;
 payload:=jsonb_build_object('idea_id',v_id,'event','changed');
 IF v_status='Draft' OR v_status IS NULL THEN
  PERFORM realtime.send(payload,'changed','user:'||coalesce(v_author,auth.uid())::text,true);
 ELSE
  PERFORM realtime.send(payload,'changed','ideas:public',true);
  PERFORM realtime.send(payload,'changed','admin:ideas',true);
 END IF;
 RETURN NULL;
END $function$

REVOKE ALL ON FUNCTION public.broadcast_idea_event() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.can_access_idea_demo(p_name text, p_write boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid; v_data jsonb;
BEGIN
  IF auth.uid() IS NULL OR p_name IS NULL THEN RETURN false; END IF;
  BEGIN v_id:=split_part(p_name,'/',1)::uuid;
  EXCEPTION WHEN invalid_text_representation THEN RETURN false; END;
  v_data:=public.get_idea_summary(v_id);
  IF v_data IS NULL OR v_data->>'status'='Draft' THEN RETURN false; END IF;
  IF p_write THEN
    RETURN v_data->>'status'='In Progress'
      AND ((SELECT public.is_admin()) OR COALESCE((v_data->>'is_owner')::boolean,false));
  END IF;
  RETURN true;
END;
$function$

REVOKE ALL ON FUNCTION public.can_access_idea_demo(text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_idea_demo(text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_see_idea(p_idea_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND public.get_idea_summary(p_idea_id) IS NOT NULL;
$function$

REVOKE ALL ON FUNCTION public.can_see_idea(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_idea(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_idea(p_idea_id uuid, p_path text DEFAULT NULL::text, p_url text DEFAULT NULL::text, p_outcome text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
 PERFORM public.save_idea_demo(p_idea_id,p_path,p_url,p_outcome);
 PERFORM public.transition_idea(p_idea_id,'Done');
END $function$

REVOKE ALL ON FUNCTION public.complete_idea(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_idea(uuid,text,text,text) TO authenticated;

SET check_function_bodies=true;
