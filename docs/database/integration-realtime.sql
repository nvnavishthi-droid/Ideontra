-- integration-realtime.sql — Private ID-only change events and tombstone protection.
CREATE OR REPLACE FUNCTION public.edit_idea_comment(p_comment_id uuid,p_content text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF nullif(trim(p_content),'') IS NULL OR char_length(p_content)>2000 THEN RAISE EXCEPTION 'Comment must contain 1 to 2000 characters'; END IF;
 UPDATE public.idea_comments SET content=trim(p_content),updated_at=now() WHERE id=p_comment_id AND user_id=auth.uid() AND deleted_at IS NULL AND created_at>=now()-interval '15 minutes';
 IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found or edit period expired'; END IF;
 RETURN p_comment_id;
END $$;
CREATE FUNCTION public.broadcast_idea_event() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
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
END $$;
REVOKE ALL ON FUNCTION public.broadcast_idea_event() FROM PUBLIC,anon,authenticated;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['ideas','idea_private_details','idea_votes','idea_comments','idea_followers','idea_status_history','idea_owner_history','idea_progress_updates'] LOOP
  EXECUTE format('CREATE TRIGGER broadcast_idea_event AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.broadcast_idea_event()',t);
 END LOOP;
END $$;
-- live-integration-rls.sql — Reviewed private Broadcast receive permissions.
-- No client INSERT/UPDATE/DELETE policy is granted on realtime.messages.
CREATE POLICY ideontra_receive_broadcast ON realtime.messages
FOR SELECT TO authenticated
USING (
  extension = 'broadcast'
  AND (SELECT public.is_member())
  AND (
    (SELECT realtime.topic()) = 'ideas:public'
    OR (SELECT realtime.topic()) = 'user:' || (SELECT auth.uid())::text
    OR ((SELECT realtime.topic()) = 'admin:ideas' AND (SELECT public.is_admin()))
  )
);
-- Triggers send only {idea_id,event}; drafts only reach their author's user topic.
-- Private non-draft topics carry no author IDs, names, content, or storage paths.
