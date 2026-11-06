-- idea-ai-chat.sql — Private permanent chat history and server-authorized RPC writes.
create table public.idea_chat_messages (
 id uuid primary key default gen_random_uuid(),
 idea_id uuid not null references public.ideas(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 role text not null check (role in ('user','assistant')),
 content text not null check (length(btrim(content)) > 0 and length(content) <= case when role='user' then 4000 else 16000 end),
 created_at timestamptz not null default clock_timestamp(),
 request_id uuid not null,
 reply_to uuid unique references public.idea_chat_messages(id) on delete cascade,
 state text not null default 'complete' check (state in ('pending','failed','complete')),
 lease_id uuid,
 lease_until timestamptz,
 attempts timestamptz[] not null default '{}',
 unique (user_id,idea_id,request_id,role),
 check ((role='user' and reply_to is null) or (role='assistant' and reply_to is not null and state='complete'))
);
alter table public.idea_chat_messages enable row level security;
alter table public.idea_chat_messages force row level security;
revoke all on public.idea_chat_messages from public, anon, authenticated;
grant select (id,idea_id,user_id,role,content,created_at,request_id,reply_to,state) on public.idea_chat_messages to authenticated;
create policy chat_own_visible_read on public.idea_chat_messages for select to authenticated
 using (user_id=(select auth.uid()) and (select public.can_see_idea(idea_id)));
create index chat_idea_user_time_idx on public.idea_chat_messages(idea_id,user_id,created_at desc,id desc);
create index chat_user_idx on public.idea_chat_messages(user_id);
-- Provision an encrypted secret without committing its value to source.
do $$ begin
 if not exists(select 1 from vault.secrets where name='idea_chat_server_secret') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'idea_chat_server_secret','Idea chat server-only RPC authorization');
 end if;
end $$;
-- Return only the caller's currently authorized keyset page, never private RPC metadata.
create function public.get_idea_chat(p_idea_id uuid,p_before_time timestamptz default null,p_before_id uuid default null,p_limit integer default 25)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.can_see_idea(p_idea_id) then raise exception 'Idea unavailable'; end if;
 if p_limit is null or p_limit<1 or p_limit>25 or (p_before_time is null)<>(p_before_id is null) then raise exception 'Invalid pagination'; end if;
 select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at,m.id),'[]') into result from
 (select id,role,content,created_at,request_id,state from public.idea_chat_messages
 where idea_id=p_idea_id and user_id=auth.uid()
 and (p_before_time is null or (created_at,id)<(p_before_time,p_before_id))
 order by created_at desc,id desc limit p_limit) m;
 return result;
end $$;
-- Reserve one idempotent question and bounded lease; only the application server can invoke writes.
create function public.begin_idea_chat(p_idea_id uuid,p_request_id uuid,p_content text,p_secret text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare q public.idea_chat_messages; token uuid:=gen_random_uuid(); usage_count integer;
begin
 if auth.uid() is null or p_secret is null or p_secret is distinct from
 (select decrypted_secret from vault.decrypted_secrets where name='idea_chat_server_secret') then raise exception 'Unauthorized'; end if;
 if not public.can_see_idea(p_idea_id) then raise exception 'Idea unavailable'; end if;
 if p_request_id is null or p_content is null or length(btrim(p_content))=0 or length(p_content)>4000 then raise exception 'Invalid question'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into q from public.idea_chat_messages where idea_id=p_idea_id and user_id=auth.uid() and request_id=p_request_id and role='user';
 if q.id is not null then
  if q.content<>btrim(p_content) then raise exception 'Request already used'; end if;
  if q.state='complete' then return jsonb_build_object('complete',true); end if;
 end if;
 if exists(select 1 from public.idea_chat_messages where user_id=auth.uid() and idea_id=p_idea_id and state='pending' and lease_until>clock_timestamp()) then raise exception 'A reply is already being generated. Try again shortly.'; end if;
 select count(*) into usage_count from public.idea_chat_messages m cross join lateral unnest(m.attempts) t(attempt)
 where m.user_id=auth.uid() and t.attempt>clock_timestamp()-interval '1 hour';
 if usage_count>=20 then raise exception 'Chat limit reached. Try again in an hour.'; end if;
 if q.id is null then
  insert into public.idea_chat_messages(idea_id,user_id,role,content,request_id,state,lease_id,lease_until,attempts)
  values(p_idea_id,auth.uid(),'user',btrim(p_content),p_request_id,'pending',token,clock_timestamp()+interval '2 minutes',array[clock_timestamp()]) returning * into q;
 else
  update public.idea_chat_messages set state='pending',lease_id=token,lease_until=clock_timestamp()+interval '2 minutes',
  attempts=array_append(attempts,clock_timestamp()) where id=q.id returning * into q;
 end if;
 return jsonb_build_object('complete',false,'question_id',q.id,'lease_id',token);
end $$;
-- Complete only the current caller's reserved question; stale/forged completions cannot write.
create function public.finish_idea_chat(p_question_id uuid,p_lease_id uuid,p_answer text,p_secret text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare q public.idea_chat_messages;
begin
 if auth.uid() is null or p_secret is null or p_secret is distinct from
 (select decrypted_secret from vault.decrypted_secrets where name='idea_chat_server_secret') then raise exception 'Unauthorized'; end if;
 select * into q from public.idea_chat_messages where id=p_question_id and user_id=auth.uid() and role='user' for update;
 if q.id is null or not public.can_see_idea(q.idea_id) then raise exception 'Idea unavailable'; end if;
 if q.state<>'pending' or q.lease_id is distinct from p_lease_id or q.lease_until<clock_timestamp() then raise exception 'Request expired. Please retry.'; end if;
 if p_answer is null then
  update public.idea_chat_messages set state='failed',lease_id=null,lease_until=null where id=q.id;
 else
  if length(btrim(p_answer))=0 or length(p_answer)>16000 then raise exception 'Invalid answer'; end if;
  insert into public.idea_chat_messages(idea_id,user_id,role,content,request_id,reply_to)
  values(q.idea_id,auth.uid(),'assistant',btrim(p_answer),q.request_id,q.id);
  update public.idea_chat_messages set state='complete',lease_id=null,lease_until=null where id=q.id;
 end if;
end $$;
revoke all on function public.get_idea_chat(uuid,timestamptz,uuid,integer) from public,anon;
revoke all on function public.begin_idea_chat(uuid,uuid,text,text) from public,anon;
revoke all on function public.finish_idea_chat(uuid,uuid,text,text) from public,anon;
grant execute on function public.get_idea_chat(uuid,timestamptz,uuid,integer) to authenticated;
grant execute on function public.begin_idea_chat(uuid,uuid,text,text) to authenticated;
grant execute on function public.finish_idea_chat(uuid,uuid,text,text) to authenticated;
