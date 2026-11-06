-- qa-storage-cleanup-policy.sql — Temporary, single-object Admin cleanup permission.
-- Apply only for cleanup, then immediately remove after verified Storage deletion.
CREATE POLICY ideontra_qa_cleanup ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='idea-demos' AND name='7cb2d8a1-8728-4dc1-b654-24db604bcdd1/qa.webm'
 AND (SELECT public.is_admin()));
-- After deletion: DROP POLICY ideontra_qa_cleanup ON storage.objects;
