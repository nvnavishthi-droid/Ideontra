-- function-baseline SQL — Read-only snapshot before security remediation.
CREATE OR REPLACE FUNCTION public.sync_profile_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$function$

CREATE OR REPLACE FUNCTION public.follow_idea(p_idea_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid;
    v_status text;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    SELECT status INTO v_status
    FROM public.ideas
    WHERE id = p_idea_id;

    IF NOT FOUND OR v_status = 'Draft' THEN
        RAISE EXCEPTION 'This idea cannot be followed.';
    END IF;

    INSERT INTO public.idea_followers (idea_id, user_id)
    VALUES (p_idea_id, v_user_id)
    ON CONFLICT (idea_id, user_id) DO NOTHING;
END;
$function$

