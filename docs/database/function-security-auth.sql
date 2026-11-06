-- function-security-auth.sql — Proposed Auth-only domain validation; pending review.
-- Validate trusted Auth trigger rows without elevated database access.
CREATE OR REPLACE FUNCTION public.enforce_employee_email() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email !~* '^[^@[:space:]]+@closefuture[.]io$' THEN
    RAISE EXCEPTION 'Use a closefuture.io employee email address';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_employee_email() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER enforce_employee_email_before_auth_write BEFORE INSERT OR UPDATE OF email
ON auth.users FOR EACH ROW EXECUTE FUNCTION public.enforce_employee_email();
