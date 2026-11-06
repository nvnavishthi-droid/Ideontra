-- function-security.sql — Transactional checks for the proposed function remediation.
-- Run only after policy approval, hook activation, and migration; always rolls back.
BEGIN;
DO $$ DECLARE f record; BEGIN
  FOR f IN SELECT p.oid,p.proname,p.prosecdef,p.proconfig FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' LOOP
    IF has_function_privilege('anon',f.oid,'EXECUTE') THEN
      RAISE EXCEPTION 'Anonymous execution remains: %',f.proname;
    END IF;
    IF NOT COALESCE(f.proconfig @> ARRAY['search_path=public, pg_temp'],false) THEN
      RAISE EXCEPTION 'Unpinned search path: %',f.proname;
    END IF;
    IF f.proname IN ('is_admin','is_member','is_idea_author','is_idea_owner','can_see_idea',
      'guard_workflow_write','audit_idea_write') AND f.prosecdef THEN
      RAISE EXCEPTION 'Expected invoker: %',f.proname;
    END IF;
  END LOOP;
END $$;
SELECT set_config('test.member',(SELECT id::text FROM public.profiles WHERE role='member' ORDER BY id LIMIT 1),true);
SELECT set_config('test.admin',(SELECT id::text FROM public.profiles WHERE role='admin' ORDER BY id LIMIT 1),true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.member'),
  'role','authenticated','app_metadata',jsonb_build_object('role','member'))::text,true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF public.is_admin() OR NOT public.is_member() THEN RAISE EXCEPTION 'Member claims failed'; END IF;
  BEGIN PERFORM public.get_admin_dashboard(); RAISE EXCEPTION 'Admin view unexpectedly allowed';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='Admin view unexpectedly allowed' THEN RAISE; END IF; END;
END $$;
SELECT set_config('test.idea',public.create_idea('Security test','Internal Tool','Problem',
  'Solution','Team','Improvement','Small',ARRAY[]::text[],true)::text,true);
DO $$ BEGIN
  IF public.get_idea_detail(current_setting('test.idea')::uuid) IS NULL THEN RAISE EXCEPTION 'Author cannot read draft'; END IF;
  BEGIN PERFORM public.vote_for_idea(current_setting('test.idea')::uuid); RAISE EXCEPTION 'Draft vote allowed';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='Draft vote allowed' THEN RAISE; END IF; END;
END $$;
SELECT public.submit_idea(current_setting('test.idea')::uuid);
DO $$ BEGIN
  BEGIN PERFORM public.vote_for_idea(current_setting('test.idea')::uuid); RAISE EXCEPTION 'Own vote allowed';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='Own vote allowed' THEN RAISE; END IF; END;
  BEGIN UPDATE public.ideas SET status='Done' WHERE id=current_setting('test.idea')::uuid;
    RAISE EXCEPTION 'Direct write allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.admin'),
  'role','authenticated','app_metadata',jsonb_build_object('role','admin'))::text,true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN PERFORM public.evaluate_idea(current_setting('test.idea')::uuid,4,2); RAISE EXCEPTION 'Submitted scoring allowed';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='Submitted scoring allowed' THEN RAISE; END IF; END;
END $$;
SELECT public.transition_idea(current_setting('test.idea')::uuid,'Under Evaluation');
SELECT public.evaluate_idea(current_setting('test.idea')::uuid,4,2);
SELECT public.transition_idea(current_setting('test.idea')::uuid,'Approved');
SELECT public.list_ideas(1,25,NULL,'Approved');
RESET ROLE;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.audit_log WHERE idea_id=current_setting('test.idea')::uuid)
    THEN RAISE EXCEPTION 'Audit events missing'; END IF;
END $$;
ROLLBACK;
