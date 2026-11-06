-- live-integration.sql — Rollback-only persistence contracts and soft-deletion checks.
BEGIN;
SELECT set_config('test.author',(SELECT id::text FROM public.profiles WHERE role='member' ORDER BY id LIMIT 1),true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.author'),'role','authenticated','app_metadata',jsonb_build_object('role','member'))::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE idea uuid; parent uuid; reply uuid; detail jsonb; result jsonb; BEGIN
 idea:=public.save_idea_form('{"title":"Partial integration draft","category":"","problem":"","solution":"","beneficiaries":"","impact":"","links":[]}'::jsonb);
 BEGIN PERFORM public.submit_idea(idea);RAISE EXCEPTION 'Incomplete draft submitted';EXCEPTION WHEN check_violation THEN NULL;WHEN raise_exception THEN IF SQLERRM='Incomplete draft submitted' THEN RAISE;END IF;END;
 IF public.get_idea_summary(idea)->>'status'<>'Draft' THEN RAISE EXCEPTION 'Failed submit was not atomic';END IF;
 PERFORM public.save_idea_form('{"title":"Integration contract idea","category":"Internal Tool","problem":"Problem","solution":"Solution","beneficiaries":"Team","impact":"Impact","links":[]}'::jsonb,idea,true);
 result:=public.list_ideas(1,10,'Integration contract',NULL,NULL,NULL,NULL,'newest','submissions');
 IF (result->>'total')::int<1 THEN RAISE EXCEPTION 'List failed to return saved idea';END IF;
 parent:=public.add_idea_comment(idea,'Parent');reply:=public.add_idea_comment(idea,'Reply',parent);
 PERFORM public.delete_idea_comment(parent);
 detail:=public.get_idea_detail(idea);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(detail->'comments') c WHERE c->>'id'=parent::text AND c->>'deleted_at' IS NOT NULL) THEN RAISE EXCEPTION 'Missing deletion placeholder';END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(detail->'comments') c WHERE c->>'id'=reply::text) THEN RAISE EXCEPTION 'Reply lost';END IF;
 BEGIN PERFORM public.edit_idea_comment(parent,'Restore');RAISE EXCEPTION 'Deleted comment edited';EXCEPTION WHEN raise_exception THEN IF SQLERRM='Deleted comment edited' THEN RAISE;END IF;END;
 BEGIN PERFORM public.save_idea_form(jsonb_build_object('title',repeat('x',101),'category','','links','[]'::jsonb));RAISE EXCEPTION 'Oversized title saved';EXCEPTION WHEN string_data_right_truncation THEN NULL;WHEN raise_exception THEN IF SQLERRM='Oversized title saved' THEN RAISE;END IF;END;
END $$;
RESET ROLE;
ROLLBACK;
