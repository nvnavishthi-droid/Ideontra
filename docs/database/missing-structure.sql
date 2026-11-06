-- missing-structure.sql — Proposed audit table and protected profile email.
-- Review draft only; not applied. Target: knmqlkhnfumeuxgnkuez.
BEGIN;
ALTER TABLE public.profiles ADD COLUMN email text;
UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_length CHECK (email IS NULL OR char_length(email) <= 320);

-- Populate new profiles from the trusted Auth row rather than user metadata email.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Synchronize confirmed Auth email changes into profiles.
CREATE FUNCTION public.sync_profile_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sync_profile_email_after_auth_update AFTER UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- Restrict direct profile updates to the name field; role/email remain protected.
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;
REVOKE INSERT, DELETE ON public.profiles FROM PUBLIC, anon, authenticated;

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  idea_id uuid,
  action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 100),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object')
);
-- idea_id intentionally has no FK so records survive idea deletion.
CREATE INDEX audit_log_actor_id_idx ON public.audit_log(actor_id);
CREATE INDEX audit_log_idea_time_idx ON public.audit_log(idea_id, occurred_at DESC);
CREATE INDEX audit_log_time_idx ON public.audit_log(occurred_at DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.audit_log TO authenticated;
CREATE POLICY audit_log_admin_read ON public.audit_log FOR SELECT TO authenticated
USING ((SELECT public.is_admin()));
-- No client DML policies or grants: reviewed workflow RPCs must write audit events.
COMMIT;
