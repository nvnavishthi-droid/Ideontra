-- remove_temporary_qa_cleanup_policy.sql — Restore the production no-delete policy set.
DROP POLICY ideontra_qa_cleanup ON storage.objects;
