-- function-baseline SQL — Read-only snapshot before security remediation.
CREATE OR REPLACE FUNCTION public.add_idea_comment(p_idea_id uuid, p_content text, p_parent_comment_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid;
    v_status text;
    v_comment_id uuid;
    v_parent_idea_id uuid;
    v_parent_parent_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
        RAISE EXCEPTION 'Comment cannot be empty.';
    END IF;

    IF length(p_content) > 5000 THEN
        RAISE EXCEPTION 'Comment cannot exceed 5000 characters.';
    END IF;

    SELECT i.status INTO v_status
    FROM public.ideas i
    WHERE i.id = p_idea_id;

    IF NOT FOUND OR v_status = 'Draft' THEN
        RAISE EXCEPTION 'Comments are not allowed for this idea.';
    END IF;

    IF p_parent_comment_id IS NOT NULL THEN
        SELECT c.idea_id, c.parent_comment_id
        INTO v_parent_idea_id, v_parent_parent_id
        FROM public.idea_comments c
        WHERE c.id = p_parent_comment_id;

        IF NOT FOUND OR v_parent_idea_id <> p_idea_id THEN
            RAISE EXCEPTION 'Invalid parent comment.';
        END IF;

        IF v_parent_parent_id IS NOT NULL THEN
            RAISE EXCEPTION 'Replies can only be one level deep.';
        END IF;
    END IF;

    INSERT INTO public.idea_comments (
        idea_id, user_id, parent_comment_id, content
    )
    VALUES (
        p_idea_id, v_user_id, p_parent_comment_id, trim(p_content)
    )
    RETURNING id INTO v_comment_id;

    RETURN v_comment_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.edit_idea_comment(p_comment_id uuid, p_content text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    IF p_content IS NULL OR length(trim(p_content)) = 0
       OR length(p_content) > 5000 THEN
        RAISE EXCEPTION 'Comment must contain 1 to 5000 characters.';
    END IF;

    UPDATE public.idea_comments
    SET content = trim(p_content),
        updated_at = now()
    WHERE id = p_comment_id
      AND user_id = v_user_id
      AND created_at >= now() - interval '15 minutes';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comment not found or the 15-minute edit period has expired.';
    END IF;

    RETURN p_comment_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.delete_idea_comment(p_comment_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    DELETE FROM public.idea_comments
    WHERE id = p_comment_id
      AND user_id = v_user_id
      AND created_at >= now() - interval '15 minutes';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comment not found or the 15-minute delete period has expired.';
    END IF;

    RETURN p_comment_id;
END;
$function$

