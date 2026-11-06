-- function-security-vote-removal.sql — Keep vote removal within FRD voting statuses.
-- Remove only the caller's vote after locking and checking the idea's status.
CREATE OR REPLACE FUNCTION public.unvote_for_idea(p_idea_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_status text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT status INTO v_status FROM public.ideas WHERE id=p_idea_id FOR UPDATE;
 IF NOT FOUND OR v_status NOT IN ('Submitted','Needs More Info','Under Evaluation') THEN
   RAISE EXCEPTION 'Voting is closed for this idea';
 END IF;
 DELETE FROM public.idea_votes WHERE idea_id=p_idea_id AND user_id=auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.unvote_for_idea(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.unvote_for_idea(uuid) TO authenticated;
