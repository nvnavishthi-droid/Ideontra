-- function-security-policies.sql — Proposed RLS and guard changes; pending review.
-- Apply only after the custom access token hook is enabled and verified.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname,tablename FROM pg_policies WHERE schemaname='public'
    AND tablename IN ('ideas','idea_private_details','profiles','idea_comments',
      'idea_status_history','idea_progress_updates','idea_owner_history','idea_votes','idea_followers')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename); END LOOP;
END $$;
CREATE POLICY ideas_visible ON public.ideas FOR SELECT TO authenticated
USING (status<>'Draft' OR EXISTS(SELECT 1 FROM public.idea_private_details d
  WHERE d.idea_id=ideas.id AND d.submitter_id=(SELECT auth.uid())));
-- No admin exception: raw private identifiers are visible only to their author.
CREATE POLICY private_details_self ON public.idea_private_details FOR SELECT TO authenticated
USING (submitter_id=(SELECT auth.uid()));
CREATE POLICY profiles_self_or_admin ON public.profiles FOR SELECT TO authenticated
USING (id=(SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY follows_self ON public.idea_followers FOR SELECT TO authenticated
USING (user_id=(SELECT auth.uid()));
-- Other raw identity-bearing tables have no client SELECT policy; use sanitized RPCs.
REVOKE ALL ON public.idea_comments,public.idea_status_history,public.idea_owner_history,
 public.idea_progress_updates,public.idea_votes FROM PUBLIC,anon,authenticated;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.ideas,
 public.idea_private_details,public.profiles,public.idea_followers FROM PUBLIC,anon,authenticated;
REVOKE UPDATE(full_name) ON public.profiles FROM PUBLIC,anon,authenticated;
REVOKE SELECT ON public.ideas FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.idea_private_details,public.profiles,public.idea_followers TO authenticated;
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t.tablename);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t.tablename);
  END LOOP;
END $$;

-- Reject workflow/history DML outside trusted RPC execution; no caller-set GUC bypass.
CREATE OR REPLACE FUNCTION public.guard_workflow_write() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
  IF current_user<>'postgres' THEN RAISE EXCEPTION 'Use an authorized workflow RPC'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_workflow_write() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_idea_workflow BEFORE INSERT OR UPDATE OR DELETE ON public.ideas
FOR EACH ROW EXECUTE FUNCTION public.guard_workflow_write();
CREATE TRIGGER guard_status_history BEFORE INSERT OR UPDATE OR DELETE ON public.idea_status_history
FOR EACH ROW EXECUTE FUNCTION public.guard_workflow_write();
CREATE TRIGGER guard_owner_history BEFORE INSERT OR UPDATE OR DELETE ON public.idea_owner_history
FOR EACH ROW EXECUTE FUNCTION public.guard_workflow_write();
CREATE TRIGGER guard_audit_log BEFORE INSERT OR UPDATE OR DELETE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.guard_workflow_write();

-- Append audit events within the caller's already-authorized definer RPC transaction.
CREATE OR REPLACE FUNCTION public.audit_idea_write() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
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
$$;
REVOKE ALL ON FUNCTION public.audit_idea_write() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER audit_idea_changes AFTER INSERT OR UPDATE OR DELETE ON public.ideas
FOR EACH ROW EXECUTE FUNCTION public.audit_idea_write();

-- Index existing FK/filter/order paths used by the RPCs.
CREATE INDEX IF NOT EXISTS idea_private_submitter_idx ON public.idea_private_details(submitter_id);
CREATE INDEX IF NOT EXISTS idea_votes_user_idx ON public.idea_votes(user_id);
CREATE INDEX IF NOT EXISTS idea_comments_user_idx ON public.idea_comments(user_id);
CREATE INDEX IF NOT EXISTS idea_comments_parent_idx ON public.idea_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idea_comments_idea_time_idx ON public.idea_comments(idea_id,created_at);
CREATE INDEX IF NOT EXISTS idea_followers_user_idx ON public.idea_followers(user_id);
CREATE INDEX IF NOT EXISTS idea_status_actor_idx ON public.idea_status_history(changed_by);
CREATE INDEX IF NOT EXISTS idea_owner_owner_idx ON public.idea_owner_history(owner_id);
CREATE INDEX IF NOT EXISTS idea_owner_assigner_idx ON public.idea_owner_history(assigned_by);
CREATE INDEX IF NOT EXISTS idea_progress_user_idx ON public.idea_progress_updates(user_id);
CREATE INDEX IF NOT EXISTS ideas_status_submitted_idx ON public.ideas(status,submitted_at,id);
CREATE INDEX IF NOT EXISTS ideas_category_idx ON public.ideas(category);
CREATE INDEX IF NOT EXISTS ideas_created_idx ON public.ideas(created_at DESC,id);
CREATE INDEX IF NOT EXISTS ideas_updated_idx ON public.ideas(updated_at DESC,id);

-- Audit explicit and cascading comment deletions without copying comment text.
CREATE OR REPLACE FUNCTION public.audit_comment_delete() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
  IF current_user<>'postgres' THEN RAISE EXCEPTION 'Authorized workflow required'; END IF;
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_log(actor_id,idea_id,action,details)
      VALUES(auth.uid(),OLD.idea_id,'comment_deleted',jsonb_build_object('comment_id',OLD.id));
  END IF;
  RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION public.audit_comment_delete() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER audit_comment_deletion AFTER DELETE ON public.idea_comments
FOR EACH ROW EXECUTE FUNCTION public.audit_comment_delete();
REVOKE CREATE ON SCHEMA public FROM PUBLIC,anon,authenticated;
