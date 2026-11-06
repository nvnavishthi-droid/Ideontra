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
