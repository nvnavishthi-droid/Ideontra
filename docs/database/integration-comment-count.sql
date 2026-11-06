-- integration-comment-count.sql — Exclude deleted placeholders from active counts.
CREATE OR REPLACE FUNCTION public.get_idea_summary(p_idea_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE i public.ideas; a uuid; v_admin boolean; v_row jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO i FROM public.ideas WHERE id=p_idea_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT submitter_id INTO a FROM public.idea_private_details WHERE idea_id=i.id;
  IF i.status='Draft' AND a IS DISTINCT FROM auth.uid() THEN RETURN NULL; END IF;
  v_admin:=public.is_admin();
  v_row:=to_jsonb(i);
  IF i.is_anonymous AND NOT v_admin AND i.owner_id=a THEN
    v_row:=v_row || jsonb_build_object('owner_id',NULL);
  END IF;
  RETURN v_row || jsonb_build_object(
    'author_name',CASE WHEN i.is_anonymous AND NOT v_admin THEN NULL ELSE
      (SELECT full_name FROM public.profiles WHERE id=a) END,
    'owner_name',CASE WHEN i.is_anonymous AND NOT v_admin AND i.owner_id=a THEN NULL ELSE
      (SELECT full_name FROM public.profiles WHERE id=i.owner_id) END,
    'is_author',COALESCE(a=auth.uid(),false), 'is_owner',COALESCE(i.owner_id=auth.uid(),false),
    'vote_count',(SELECT count(*) FROM public.idea_votes WHERE idea_id=i.id),
    'comment_count',(SELECT count(*) FROM public.idea_comments WHERE idea_id=i.id AND deleted_at IS NULL),
    'has_voted',EXISTS(SELECT 1 FROM public.idea_votes WHERE idea_id=i.id AND user_id=auth.uid()),
    'is_following',EXISTS(SELECT 1 FROM public.idea_followers WHERE idea_id=i.id AND user_id=auth.uid()),
    'is_overdue',i.status='In Progress' AND i.target_date<current_date);
END;
$function$;
