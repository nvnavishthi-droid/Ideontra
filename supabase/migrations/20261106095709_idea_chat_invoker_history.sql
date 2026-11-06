-- idea_chat_invoker_history.sql — Read caller-only history without privilege elevation.
alter function public.get_idea_chat(uuid,timestamptz,uuid,integer) security invoker;
