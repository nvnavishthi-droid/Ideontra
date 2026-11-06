-- Install Auth-only role claim hook; hosted activation is a separate setting.
-- Inject the stored role when Auth issues tokens; callable only by Auth.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_role text; v_claims jsonb;
BEGIN
  SELECT role::text INTO v_role FROM public.profiles WHERE id=(event->>'user_id')::uuid;
  IF v_role IS NULL THEN RAISE EXCEPTION 'Profile required before issuing access token'; END IF;
  v_claims:=event->'claims';
  v_claims:=jsonb_set(v_claims,'{app_metadata}',COALESCE(v_claims->'app_metadata','{}'::jsonb)
    || jsonb_build_object('role',v_role));
  RETURN jsonb_set(event,'{claims}',v_claims);
END;
$$;
REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;


