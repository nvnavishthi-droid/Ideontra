-- idea-chat.sql — Rollback-only privacy, server-write authorization and retry regression checks.
begin;
do $$
declare a uuid; b uuid; idea uuid; msg uuid; secret text; reserved jsonb; token uuid; question uuid; result jsonb; request_id uuid; page jsonb; cursor_row jsonb; i integer;
begin
 select id into a from public.profiles where role='member' order by id limit 1;
 select id into b from public.profiles where id<>a order by id limit 1;
 if a is null or b is null then raise exception 'Test requires two existing users'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','app_metadata',jsonb_build_object('role','member'))::text,true);
 idea:=public.create_idea('Chat rollback test','Internal Tool','Test problem','Test solution','Team','Test impact',null,'{}',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated','app_metadata',jsonb_build_object('role','member'))::text,true);
 begin
  perform public.get_idea_chat(idea);
  raise exception 'Private draft unexpectedly readable';
 exception when raise_exception then if sqlerrm<>'Idea unavailable' then raise; end if; end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','app_metadata',jsonb_build_object('role','member'))::text,true);
 perform public.submit_idea(idea);
 select decrypted_secret into secret from vault.decrypted_secrets where name='idea_chat_server_secret';
 insert into public.idea_chat_messages(idea_id,user_id,role,content,request_id) values(idea,b,'user','Private test question',gen_random_uuid()) returning id into msg;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','app_metadata',jsonb_build_object('role','admin'))::text,true);
 execute 'set local role authenticated';
 if exists(select 1 from public.idea_chat_messages where id=msg) then raise exception 'Admin saw another user chat'; end if;
 if public.get_idea_chat(idea)::text like '%Private test question%' then raise exception 'RPC leaked another user chat'; end if;
 begin
  insert into public.idea_chat_messages(idea_id,user_id,role,content,request_id) values(idea,a,'user','Forbidden',gen_random_uuid());
  raise exception 'Direct write unexpectedly succeeded';
 exception when insufficient_privilege then null; end;
 begin
  perform public.begin_idea_chat(idea,gen_random_uuid(),'Forged request','wrong');
  raise exception 'Invalid server secret unexpectedly accepted';
 exception when raise_exception then if sqlerrm<>'Unauthorized' then raise; end if; end;
 reserved:=public.begin_idea_chat(idea,gen_random_uuid(),'Authorized test question',secret);
 question:=(reserved->>'question_id')::uuid; token:=(reserved->>'lease_id')::uuid;
 begin
  perform public.begin_idea_chat(idea,gen_random_uuid(),'Parallel question',secret);
  raise exception 'Concurrent request unexpectedly accepted';
 exception when raise_exception then if sqlerrm not like 'A reply is already%' then raise; end if; end;
 begin
  perform public.finish_idea_chat(question,gen_random_uuid(),'Forged answer',secret);
  raise exception 'Forged lease unexpectedly accepted';
 exception when raise_exception then if sqlerrm not like 'Request expired%' then raise; end if; end;
 perform public.finish_idea_chat(question,token,'Authorized answer',secret);
 result:=public.get_idea_chat(idea);
 if not exists(select 1 from jsonb_array_elements(result) m where m->>'content'='Authorized answer') then raise exception 'Completed answer missing'; end if;
 select m.request_id into request_id from public.idea_chat_messages m where id=question;
 reserved:=public.begin_idea_chat(idea,request_id,'Authorized test question',secret);
 if not (reserved->>'complete')::boolean then raise exception 'Completed request was duplicated'; end if;
 request_id:=gen_random_uuid();
 for i in 1..19 loop
  reserved:=public.begin_idea_chat(idea,request_id,'Retry test question',secret);
  perform public.finish_idea_chat((reserved->>'question_id')::uuid,(reserved->>'lease_id')::uuid,null,secret);
 end loop;
 begin
  perform public.begin_idea_chat(idea,request_id,'Retry test question',secret);
  raise exception 'Rate limit unexpectedly bypassed';
 exception when raise_exception then if sqlerrm not like 'Chat limit reached%' then raise; end if; end;
 execute 'reset role';
 insert into public.idea_chat_messages(idea_id,user_id,role,content,request_id)
 select idea,a,'user','Pagination test '||n,gen_random_uuid() from generate_series(1,30) n;
 execute 'set local role authenticated';
 page:=public.get_idea_chat(idea);
 if jsonb_array_length(page)<>25 then raise exception 'History page size incorrect'; end if;
 cursor_row:=page->0;
 result:=public.get_idea_chat(idea,(cursor_row->>'created_at')::timestamptz,(cursor_row->>'id')::uuid);
 if jsonb_array_length(result)=0 then raise exception 'Older page missing'; end if;
 if exists(select 1 from jsonb_array_elements(page) x join jsonb_array_elements(result) y on x->>'id'=y->>'id') then raise exception 'History pagination overlapped'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated','app_metadata',jsonb_build_object('role','admin'))::text,true);
 if exists(select 1 from public.idea_chat_messages where id=question) then raise exception 'Other user saw question'; end if;
 begin
  perform public.finish_idea_chat(question,token,'Cross-user answer',secret);
  raise exception 'Cross-user write unexpectedly accepted';
 exception when raise_exception then if sqlerrm<>'Idea unavailable' then raise; end if; end;
 perform set_config('request.jwt.claims','{}',true);
 begin
  perform public.get_idea_chat(idea);
  raise exception 'Missing identity unexpectedly accepted';
 exception when raise_exception then if sqlerrm<>'Idea unavailable' then raise; end if; end;
 execute 'reset role';
 raise notice 'Idea chat security checks passed; all test data rolled back';
end $$;
rollback;
