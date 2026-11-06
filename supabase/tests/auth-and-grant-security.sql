-- auth-and-grant-security.sql — Rollback Auth-hook, domain and anonymous grant checks.
BEGIN;
SELECT set_config('test.admin',(SELECT id::text FROM public.profiles WHERE role='admin' ORDER BY id LIMIT 1),true);
SELECT set_config('test.member',(SELECT id::text FROM public.profiles WHERE role='member' ORDER BY id LIMIT 1),true);
-- MCP cannot SET ROLE supabase_auth_admin; verify its grant and test as owner.
DO $$ BEGIN
 IF NOT has_function_privilege('supabase_auth_admin','public.custom_access_token_hook(jsonb)','EXECUTE') THEN
 RAISE EXCEPTION 'Auth role lacks hook execute'; END IF;
END $$;
DO $$ DECLARE e jsonb; BEGIN
 e:=public.custom_access_token_hook(jsonb_build_object('user_id',current_setting('test.admin'),
  'claims',jsonb_build_object('sub',current_setting('test.admin'),'app_metadata','{}'::jsonb)));
 IF e->'claims'->'app_metadata'->>'role'<>'admin' THEN RAISE EXCEPTION 'Admin hook claim incorrect'; END IF;
 e:=public.custom_access_token_hook(jsonb_build_object('user_id',current_setting('test.member'),
  'claims',jsonb_build_object('sub',current_setting('test.member'),'app_metadata',jsonb_build_object('role','admin'))));
 IF e->'claims'->'app_metadata'->>'role'<>'member' THEN RAISE EXCEPTION 'Hook retained untrusted role'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.list_ideas(); RAISE EXCEPTION 'Anonymous API access';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.custom_access_token_hook('{}'::jsonb); RAISE EXCEPTION 'Anonymous hook access';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM 1 FROM public.ideas; RAISE EXCEPTION 'Anonymous table access';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 BEGIN INSERT INTO auth.users(id,email) VALUES(gen_random_uuid(),'security-check@example.com');
 RAISE EXCEPTION 'External domain accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='External domain accepted' THEN RAISE; END IF; END;
END $$;
SELECT 'Auth hook, domain and anonymous permission checks passed' AS result;
ROLLBACK;
