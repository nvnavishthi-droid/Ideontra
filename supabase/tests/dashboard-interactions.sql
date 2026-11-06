-- dashboard-interactions.sql — Rollback-only deleted branch, sort and privacy checks.
BEGIN;
SELECT set_config('test.author',(SELECT id::text FROM public.profiles WHERE role='member' ORDER BY id LIMIT 1),true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.author'),'role','authenticated','app_metadata',jsonb_build_object('role','member'))::text,true);
SET LOCAL ROLE authenticated;
-- Create disposable records through the same validated RPCs used by the application.
DO $$ DECLARE idea uuid; draft uuid; parent uuid; reply uuid; sibling uuid; detail jsonb; BEGIN
 draft:=public.save_idea_form('{"title":"Private interaction test","category":"","links":[]}'::jsonb);
 PERFORM set_config('test.draft',draft::text,true);
 idea:=public.save_idea_form('{"title":"Interaction visibility test","category":"Internal Tool","problem":"Problem","solution":"Solution","beneficiaries":"Team","impact":"Impact","links":[],"anonymous":true}'::jsonb,NULL,true);
 PERFORM set_config('test.idea',idea::text,true);
 parent:=public.add_idea_comment(idea,'Parent');
 reply:=public.add_idea_comment(idea,'First reply',parent);
 sibling:=public.add_idea_comment(idea,'Separate conversation');
 IF (public.get_idea_detail(idea)->>'comment_count')::int<>3 THEN RAISE EXCEPTION 'Initial count mismatch';END IF;
 PERFORM public.delete_idea_comment(reply);
 IF jsonb_array_length(public.get_idea_detail(idea)->'comments')<>2 THEN RAISE EXCEPTION 'Deleted reply still visible';END IF;
 PERFORM public.add_idea_comment(idea,'Second reply',parent);
 PERFORM public.delete_idea_comment(parent);
 detail:=public.get_idea_detail(idea);
 IF jsonb_array_length(detail->'comments')<>1 OR (detail->>'comment_count')::int<>1 THEN RAISE EXCEPTION 'Deleted branch counted or visible';END IF;
 IF detail->'comments'->0->>'id'<>sibling::text THEN RAISE EXCEPTION 'Unrelated thread hidden';END IF;
 IF detail->>'author_name' IS NOT NULL OR detail->'comments'->0->>'author_name' IS NOT NULL THEN RAISE EXCEPTION 'Anonymous identity exposed';END IF;
END $$;
RESET ROLE;
-- Soft deletion must preserve the original rows and live reply rather than cascade.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.idea_comments WHERE idea_id=current_setting('test.idea')::uuid)<>4 THEN RAISE EXCEPTION 'Comment records removed';END IF;
 IF (SELECT count(*) FROM public.idea_comments WHERE idea_id=current_setting('test.idea')::uuid AND deleted_at IS NOT NULL)<>2 THEN RAISE EXCEPTION 'Unexpected deletion cascade';END IF;
END $$;
-- Record expected server ordering before returning to restricted caller privileges.
DO $$ DECLARE sorting text; expected jsonb; BEGIN
 FOREACH sorting IN ARRAY ARRAY['oldest','newest','updated','votes'] LOOP
  SELECT coalesce(jsonb_agg(id),'[]'::jsonb) INTO expected FROM (
   SELECT i.id FROM public.ideas i WHERE i.status='Submitted' ORDER BY
    CASE WHEN sorting='oldest' THEN i.submitted_at END ASC NULLS LAST,
    CASE WHEN sorting='newest' THEN i.created_at END DESC,
    CASE WHEN sorting='updated' THEN i.updated_at END DESC,
    CASE WHEN sorting='votes' THEN (SELECT count(*) FROM public.idea_votes v WHERE v.idea_id=i.id) END DESC,
    i.id LIMIT 25
  ) ordered;
  PERFORM set_config('test.expected_'||sorting,expected::text,true);
 END LOOP;
END $$;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',(SELECT id FROM public.profiles WHERE role='admin' ORDER BY id LIMIT 1),'role','authenticated','app_metadata',jsonb_build_object('role','admin'))::text,true);
SET LOCAL ROLE authenticated;
-- Even an Admin cannot access another employee's private draft.
DO $$ DECLARE sorting text; actual jsonb; BEGIN
 IF public.get_idea_summary(current_setting('test.draft')::uuid) IS NOT NULL THEN RAISE EXCEPTION 'Private draft exposed';END IF;
 IF (public.get_idea_detail(current_setting('test.idea')::uuid)->>'comment_count')::int<>1 THEN RAISE EXCEPTION 'Admin count differs';END IF;
 FOREACH sorting IN ARRAY ARRAY['oldest','newest','updated','votes'] LOOP
  SELECT coalesce(jsonb_agg(item->'id'),'[]'::jsonb) INTO actual
   FROM jsonb_array_elements(public.list_ideas(p_status=>'Submitted',p_mode=>'review',p_sort=>sorting)->'rows') item;
  IF actual<>current_setting('test.expected_'||sorting)::jsonb THEN RAISE EXCEPTION 'Review sort mismatch: %',sorting;END IF;
 END LOOP;
END $$;
RESET ROLE;
ROLLBACK;
