-- remove-seeded-ideas.sql — Explicitly approved one-time cleanup; not a schema migration.
-- Removes only exact seed titles owned by the seeded demo member; keeps accounts.
BEGIN;
DO $$
DECLARE targets uuid[]; remaining_snapshot jsonb; removed integer;
BEGIN
 SELECT array_agg(i.id) INTO targets FROM public.ideas i
 JOIN public.idea_private_details d ON d.idea_id=i.id
 JOIN auth.users u ON u.id=d.submitter_id
 WHERE u.email='demo-member@closefuture.io'
 AND i.title ~ '^Demo · (Draft|Submitted|Needs More Info|Under Evaluation|Approved|In Progress|Done|Rejected|Parked|Withdrawn) · [12]$';
 IF cardinality(targets) IS DISTINCT FROM 20 THEN RAISE EXCEPTION 'Expected exactly twenty seed ideas'; END IF;
 IF EXISTS(SELECT 1 FROM public.ideas WHERE id=ANY(targets) AND demo_video_path IS NOT NULL)
 OR EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='idea-demos' AND split_part(name,'/',1)=ANY(SELECT unnest(targets)::text))
 THEN RAISE EXCEPTION 'Uploaded object requires separate review'; END IF;
 SELECT jsonb_agg(to_jsonb(i) ORDER BY id) INTO remaining_snapshot FROM public.ideas i WHERE NOT(id=ANY(targets));
 DELETE FROM public.audit_log WHERE idea_id=ANY(targets);
 DELETE FROM public.ideas WHERE id=ANY(targets);
 GET DIAGNOSTICS removed=ROW_COUNT;
 IF removed<>20 THEN RAISE EXCEPTION 'Unexpected deletion count'; END IF;
 IF remaining_snapshot IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM public.ideas i)
 THEN RAISE EXCEPTION 'Other ideas changed'; END IF;
 IF (SELECT count(*) FROM auth.users WHERE email IN ('demo-admin@closefuture.io','demo-member@closefuture.io','demo-owner@closefuture.io','demo-colleague@closefuture.io'))<>4
 THEN RAISE EXCEPTION 'Demo accounts missing'; END IF;
END $$;
COMMIT;
SELECT count(*) AS remaining_ideas FROM public.ideas;
