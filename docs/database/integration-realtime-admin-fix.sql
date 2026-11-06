-- integration-realtime-admin-fix.sql — Include both authenticated employee roles.
ALTER POLICY ideontra_receive_broadcast ON realtime.messages USING (
 extension='broadcast' AND ((SELECT public.is_member()) OR (SELECT public.is_admin()))
 AND ((SELECT realtime.topic())='ideas:public' OR (SELECT realtime.topic())='user:'||(SELECT auth.uid())::text
 OR ((SELECT realtime.topic())='admin:ideas' AND (SELECT public.is_admin())))
);
