-- jwt-role-cutover.sql — Apply after hosted Auth hook activation.
-- Read the role claim without elevated privileges or a profiles lookup.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT auth.uid() IS NOT NULL AND COALESCE(auth.jwt()->'app_metadata'->>'role' = 'admin', false);
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
