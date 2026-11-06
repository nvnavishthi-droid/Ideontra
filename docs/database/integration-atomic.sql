-- integration-atomic.sql — Atomic validated RPC compositions; no direct DML grants.
CREATE FUNCTION public.save_idea_form(p_values jsonb,p_idea_id uuid DEFAULT NULL,p_submit boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_status text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_idea_id IS NULL THEN
  v_id:=public.create_idea(p_values->>'title',p_values->>'category',p_values->>'problem',p_values->>'solution',p_values->>'beneficiaries',p_values->>'impact',nullif(p_values->>'effort',''),ARRAY(SELECT jsonb_array_elements_text(coalesce(p_values->'links','[]'))),coalesce((p_values->>'anonymous')::boolean,false));
 ELSE
  v_id:=public.update_idea(p_idea_id,p_values->>'title',p_values->>'category',p_values->>'problem',p_values->>'solution',p_values->>'beneficiaries',p_values->>'impact',nullif(p_values->>'effort',''),ARRAY(SELECT jsonb_array_elements_text(coalesce(p_values->'links','[]'))),coalesce((p_values->>'anonymous')::boolean,false));
 END IF;
 IF p_submit THEN
  v_status:=public.get_idea_summary(v_id)->>'status';
  IF v_status='Draft' THEN PERFORM public.submit_idea(v_id);
  ELSIF v_status='Needs More Info' THEN PERFORM public.transition_idea(v_id,'Submitted');
  ELSE RAISE EXCEPTION 'This idea cannot be submitted from its current status'; END IF;
 END IF;
 RETURN v_id;
END $$;
CREATE FUNCTION public.approve_evaluated_idea(p_idea_id uuid,p_impact integer,p_effort integer) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM public.evaluate_idea(p_idea_id,p_impact,p_effort);
 PERFORM public.transition_idea(p_idea_id,'Approved');
END $$;
CREATE FUNCTION public.complete_idea(p_idea_id uuid,p_path text DEFAULT NULL,p_url text DEFAULT NULL,p_outcome text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM public.save_idea_demo(p_idea_id,p_path,p_url,p_outcome);
 PERFORM public.transition_idea(p_idea_id,'Done');
END $$;
-- Visible owner directory for filters; anonymous authors cannot be discovered by ownership.
CREATE FUNCTION public.list_visible_owners(p_page integer DEFAULT 1,p_page_size integer DEFAULT 100) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF p_page<1 OR p_page_size NOT IN (10,25,50,100) THEN RAISE EXCEPTION 'Invalid pagination'; END IF;
 WITH visible AS (SELECT DISTINCT p.id,p.full_name FROM public.profiles p JOIN public.ideas i ON i.owner_id=p.id WHERE i.status<>'Draft' AND (public.is_admin() OR NOT i.is_anonymous OR NOT EXISTS(SELECT 1 FROM public.idea_private_details d WHERE d.idea_id=i.id AND d.submitter_id=p.id))), page AS (SELECT * FROM visible ORDER BY full_name,id LIMIT p_page_size OFFSET (p_page::bigint-1)*p_page_size)
 SELECT jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(p)) FROM page p),'[]'),'total',(SELECT count(*) FROM visible)) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_idea_form(jsonb,uuid,boolean),public.approve_evaluated_idea(uuid,integer,integer),public.complete_idea(uuid,text,text,text),public.list_visible_owners(integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_idea_form(jsonb,uuid,boolean),public.approve_evaluated_idea(uuid,integer,integer),public.complete_idea(uuid,text,text,text),public.list_visible_owners(integer,integer) TO authenticated;
