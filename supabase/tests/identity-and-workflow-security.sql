-- identity-and-workflow-security.sql — Rollback-only Member/Admin/identity regression checks.
BEGIN;
SELECT set_config('test.author',(SELECT id::text FROM public.profiles WHERE role='member' ORDER BY id LIMIT 1),true);
SELECT set_config('test.other',(SELECT id::text FROM public.profiles WHERE role='member' ORDER BY id OFFSET 1 LIMIT 1),true);
SELECT set_config('test.admin',(SELECT id::text FROM public.profiles WHERE role='admin' ORDER BY id LIMIT 1),true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.author'),
 'role','authenticated','app_metadata',jsonb_build_object('role','member'))::text,true);
SET LOCAL ROLE authenticated;
SELECT set_config('test.idea',public.create_idea('Anonymous security check','Internal Tool','Problem',
 'Solution','Team','Impact','Small',ARRAY[]::text[],true)::text,true);
SELECT set_config('test.draft',public.create_idea('Private draft security check','Internal Tool','Problem',
 'Solution','Team','Impact','Small',ARRAY[]::text[],false)::text,true);
SELECT public.submit_idea(current_setting('test.idea')::uuid);
SELECT set_config('test.comment',public.add_idea_comment(current_setting('test.idea')::uuid,'Anonymous comment')::text,true);
SELECT public.edit_idea_comment(current_setting('test.comment')::uuid,'Edited within window');
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.other'),
 'role','authenticated','app_metadata',jsonb_build_object('role','member'),
 'user_metadata',jsonb_build_object('role','admin'))::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE d jsonb; BEGIN
 IF public.is_admin() THEN RAISE EXCEPTION 'User metadata escalated role'; END IF;
 IF public.get_idea_summary(current_setting('test.draft')::uuid) IS NOT NULL THEN RAISE EXCEPTION 'Private draft exposed'; END IF;
 d:=public.get_idea_detail(current_setting('test.idea')::uuid);
 IF d->>'author_name' IS NOT NULL OR d::text LIKE '%'||current_setting('test.author')||'%'
   THEN RAISE EXCEPTION 'Anonymous identity exposed'; END IF;
 BEGIN PERFORM public.get_idea_detail(current_setting('test.draft')::uuid); RAISE EXCEPTION 'Draft detail exposed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Draft detail exposed' THEN RAISE; END IF; END;
 BEGIN PERFORM public.get_idea_follow_summary(current_setting('test.draft')::uuid); RAISE EXCEPTION 'Draft follow exposed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Draft follow exposed' THEN RAISE; END IF; END;
 BEGIN PERFORM 1 FROM public.idea_comments; RAISE EXCEPTION 'Raw comment identities exposed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM 1 FROM public.idea_status_history; RAISE EXCEPTION 'Raw history identities exposed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.edit_idea_comment(current_setting('test.comment')::uuid,'Not mine'); RAISE EXCEPTION 'Other comment edited';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Other comment edited' THEN RAISE; END IF; END;
END $$;
SELECT public.vote_for_idea(current_setting('test.idea')::uuid);
SELECT public.unvote_for_idea(current_setting('test.idea')::uuid);
SELECT public.follow_idea(current_setting('test.idea')::uuid);
SELECT public.unfollow_idea(current_setting('test.idea')::uuid);
SELECT set_config('test.reply',public.add_idea_comment(current_setting('test.idea')::uuid,'Reply',current_setting('test.comment')::uuid)::text,true);
DO $$ BEGIN
 BEGIN PERFORM public.add_idea_comment(current_setting('test.idea')::uuid,'Too deep',current_setting('test.reply')::uuid);
   RAISE EXCEPTION 'Nested reply allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Nested reply allowed' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
UPDATE public.idea_comments SET created_at=now()-interval '16 minutes' WHERE id=current_setting('test.reply')::uuid;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.edit_idea_comment(current_setting('test.reply')::uuid,'Expired'); RAISE EXCEPTION 'Expired edit allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Expired edit allowed' THEN RAISE; END IF; END;
 BEGIN PERFORM public.delete_idea_comment(current_setting('test.reply')::uuid); RAISE EXCEPTION 'Expired delete allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Expired delete allowed' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.admin'),
 'role','authenticated','app_metadata',jsonb_build_object('role','admin'))::text,true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF public.get_idea_summary(current_setting('test.draft')::uuid) IS NOT NULL THEN RAISE EXCEPTION 'Admin read others draft'; END IF;
 IF public.get_idea_submitter_name(current_setting('test.draft')::uuid) IS NOT NULL THEN RAISE EXCEPTION 'Admin read draft author'; END IF;
 IF public.get_idea_detail(current_setting('test.idea')::uuid)->>'author_name' IS NULL THEN RAISE EXCEPTION 'Admin identity unavailable'; END IF;
 BEGIN UPDATE public.profiles SET role='admin' WHERE id=current_setting('test.other')::uuid;
   RAISE EXCEPTION 'Direct role write allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT public.transition_idea(current_setting('test.idea')::uuid,'Under Evaluation');
DO $$ BEGIN
 BEGIN PERFORM public.transition_idea(current_setting('test.idea')::uuid,'Approved'); RAISE EXCEPTION 'Approval without scores';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Approval without scores' THEN RAISE; END IF; END;
END $$;
SELECT public.evaluate_idea(current_setting('test.idea')::uuid,4,2);
SELECT public.transition_idea(current_setting('test.idea')::uuid,'Approved');
SELECT public.transition_idea(current_setting('test.idea')::uuid,'In Progress',NULL,current_setting('test.admin')::uuid,current_date+1);
DO $$ BEGIN
 BEGIN PERFORM public.transition_idea(current_setting('test.idea')::uuid,'Done'); RAISE EXCEPTION 'Done without demo';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Done without demo' THEN RAISE; END IF; END;
 BEGIN PERFORM public.save_idea_demo(current_setting('test.idea')::uuid,current_setting('test.idea')||'/fake.mp4');
   RAISE EXCEPTION 'Missing upload accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Missing upload accepted' THEN RAISE; END IF; END;
END $$;
SELECT public.add_idea_progress_update(current_setting('test.idea')::uuid,'Progress');
SELECT public.save_idea_demo(current_setting('test.idea')::uuid,NULL,'https://www.loom.com/share/security-test','Outcome');
SELECT public.transition_idea(current_setting('test.idea')::uuid,'Done');
DO $$ BEGIN
 BEGIN PERFORM public.transition_idea(current_setting('test.idea')::uuid,'Under Evaluation'); RAISE EXCEPTION 'Final status reopened';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Final status reopened' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.audit_log WHERE idea_id=current_setting('test.idea')::uuid)<5
 THEN RAISE EXCEPTION 'Workflow audit incomplete'; END IF;
END $$;
SELECT 'Identity and workflow checks passed; changes rolled back' AS result;
ROLLBACK;
