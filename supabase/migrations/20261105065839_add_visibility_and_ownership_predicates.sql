-- function-security-helpers.sql — Proposed JWT predicates and visibility helpers.
-- Pending policy review and Auth hook activation; not applied.

-- Identify an authenticated Member using a server-controlled claim.
CREATE OR REPLACE FUNCTION public.is_member() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT auth.uid() IS NOT NULL AND COALESCE(auth.jwt()->'app_metadata'->>'role' = 'member', false);
$$;
-- Test authorship through caller-visible private details.
CREATE OR REPLACE FUNCTION public.is_idea_author(p_idea_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.idea_private_details
    WHERE idea_id=p_idea_id AND submitter_id=auth.uid());
$$;
-- Test ownership through caller-visible ideas.
CREATE OR REPLACE FUNCTION public.is_idea_owner(p_idea_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT auth.uid() IS NOT NULL AND COALESCE((public.get_idea_summary(p_idea_id)->>'is_owner')::boolean,false);
$$;
-- Return visibility without granting administrators access to other authors' drafts.
CREATE OR REPLACE FUNCTION public.can_see_idea(p_idea_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT auth.uid() IS NOT NULL AND public.get_idea_summary(p_idea_id) IS NOT NULL;
$$;
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
REVOKE ALL ON FUNCTION public.is_admin(),public.is_member(),public.is_idea_author(uuid),
  public.is_idea_owner(uuid),public.can_see_idea(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_admin(),public.is_member(),public.is_idea_author(uuid),
  public.is_idea_owner(uuid),public.can_see_idea(uuid) TO authenticated;
