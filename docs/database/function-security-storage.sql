-- function-security-storage.sql — Keep private video access working through protected reads.
-- Validate a path and check permissions without exposing raw idea/actor identifiers.
CREATE OR REPLACE FUNCTION public.can_access_idea_demo(p_name text,p_write boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_data jsonb;
BEGIN
  IF auth.uid() IS NULL OR p_name IS NULL THEN RETURN false; END IF;
  BEGIN v_id:=split_part(p_name,'/',1)::uuid;
  EXCEPTION WHEN invalid_text_representation THEN RETURN false; END;
  v_data:=public.get_idea_summary(v_id);
  IF v_data IS NULL OR v_data->>'status'='Draft' THEN RETURN false; END IF;
  IF p_write THEN
    RETURN v_data->>'status'='In Progress'
      AND ((SELECT public.is_admin()) OR COALESCE((v_data->>'is_owner')::boolean,false));
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.can_access_idea_demo(text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_access_idea_demo(text,boolean) TO authenticated;
DROP POLICY "Owners and admins can upload idea demos" ON storage.objects;
DROP POLICY "Users can view demos of visible ideas" ON storage.objects;
CREATE POLICY idea_demo_upload ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='idea-demos' AND (SELECT public.can_access_idea_demo(name,true)));
CREATE POLICY idea_demo_read ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='idea-demos' AND (SELECT public.can_access_idea_demo(name,false)));
