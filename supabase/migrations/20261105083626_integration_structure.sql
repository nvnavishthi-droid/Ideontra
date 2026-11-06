-- integration-structure.sql — Persisted form caps and approved incomplete drafts.
ALTER TABLE public.idea_comments ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.ideas DROP CONSTRAINT ideas_category_check;
ALTER TABLE public.ideas ADD CONSTRAINT ideas_category_check CHECK (
 (status='Draft' AND category='') OR category IN ('New Service Offering','Internal Tool','Process Improvement','Marketing/Content','Client Experience','Training'));
ALTER TABLE public.ideas ADD CONSTRAINT ideas_required_on_submit CHECK (status='Draft' OR
 (length(trim(title))>0 AND length(trim(category))>0 AND length(trim(problem))>0 AND length(trim(proposed_solution))>0 AND length(trim(who_benefits))>0 AND length(trim(expected_impact))>0));
ALTER TABLE public.ideas ADD CONSTRAINT ideas_form_limits CHECK (
 char_length(problem)<=5000 AND char_length(proposed_solution)<=5000 AND char_length(who_benefits)<=5000 AND char_length(expected_impact)<=5000 AND char_length(coalesce(outcome_summary,''))<=2000 AND char_length(coalesce(demo_video_url,''))<=2000);
ALTER TABLE public.idea_comments ADD CONSTRAINT comments_content_limit CHECK (char_length(content)<=2000);
ALTER TABLE public.idea_progress_updates ADD CONSTRAINT progress_text_limit CHECK (char_length(update_text)<=2000);
ALTER TABLE public.idea_status_history ADD CONSTRAINT history_reason_limit CHECK (char_length(coalesce(reason,''))<=2000);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_name_limit CHECK (char_length(full_name)<=100);
-- Validate aggregate link length, each URL and avoid query-time array CHECK subqueries.
CREATE FUNCTION public.validate_idea_links() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF char_length(array_to_string(NEW.links,E'\n'))>2000 OR EXISTS (SELECT 1 FROM unnest(NEW.links) l WHERE l !~* '^https?://[^[:space:]]+$') THEN RAISE EXCEPTION 'Supporting links must be HTTP(S) URLs, at most 2000 characters combined'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_idea_links() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_idea_links BEFORE INSERT OR UPDATE OF links ON public.ideas FOR EACH ROW EXECUTE FUNCTION public.validate_idea_links();
CREATE OR REPLACE FUNCTION public.delete_idea_comment(p_comment_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 UPDATE public.idea_comments SET content='Comment deleted',deleted_at=now(),updated_at=now()
 WHERE id=p_comment_id AND user_id=auth.uid() AND deleted_at IS NULL AND created_at>=now()-interval '15 minutes';
 IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found or deletion window expired'; END IF;
 INSERT INTO public.audit_log(actor_id,idea_id,action,details) SELECT auth.uid(),idea_id,'comment_deleted',jsonb_build_object('comment_id',id) FROM public.idea_comments WHERE id=p_comment_id;
 RETURN p_comment_id;
END $$;
