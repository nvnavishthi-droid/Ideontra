-- seed.sql — Idempotent demo accounts and two ideas per FRD status, using workflow RPCs.
-- Run as postgres after migrations, with app.seed_password set to a chosen demo password.
BEGIN;
DO $$
DECLARE password text:=current_setting('app.seed_password',true); actor uuid; admin_id uuid;
 member_id uuid; owner_id uuid; uid uuid; idea uuid; desired text; iteration integer; v_email text;
 name text; kind text; v_title text;
BEGIN
 IF password IS NULL OR char_length(password)<12 THEN RAISE EXCEPTION 'Set app.seed_password to a demo password of at least 12 characters before seeding'; END IF;
 FOREACH kind IN ARRAY ARRAY['admin','member','owner','colleague'] LOOP
  v_email:='demo-'||kind||'@closefuture.io';name:='Demo '||initcap(kind);
  SELECT id INTO uid FROM auth.users u WHERE lower(u.email)=v_email;
  IF uid IS NULL THEN
   uid:=gen_random_uuid();
   INSERT INTO auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
   VALUES('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',v_email,extensions.crypt(password,extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}',jsonb_build_object('full_name',name),now(),now(),'','','','');
   INSERT INTO auth.identities(user_id,provider_id,identity_data,provider,created_at,updated_at) VALUES(uid,uid::text,jsonb_build_object('sub',uid,'email',v_email,'email_verified',true),'email',now(),now());
  END IF;
  UPDATE public.profiles SET role=CASE WHEN kind='admin' THEN 'admin'::public.user_role ELSE 'member'::public.user_role END WHERE id=uid;
  IF kind='admin' THEN admin_id:=uid; ELSIF kind='member' THEN member_id:=uid; ELSIF kind='owner' THEN owner_id:=uid; END IF;
 END LOOP;
 FOREACH desired IN ARRAY ARRAY['Draft','Submitted','Needs More Info','Under Evaluation','Approved','In Progress','Done','Rejected','Parked','Withdrawn'] LOOP
  FOR iteration IN 1..2 LOOP
   v_title:='Demo · '||desired||' · '||iteration;
   IF EXISTS(SELECT 1 FROM public.ideas i JOIN public.idea_private_details d ON d.idea_id=i.id WHERE i.title=v_title AND d.submitter_id=member_id) THEN CONTINUE; END IF;
   PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated','app_metadata',jsonb_build_object('role','member'))::text,true);
   idea:=public.create_idea(v_title,'Internal Tool','Reduce repeated setup work.','Create a shared team checklist.','Employees and onboarding buddies.','Faster setup and fewer repeated questions.','Small',ARRAY[]::text[],iteration=2);
   IF desired='Draft' THEN CONTINUE; END IF;
   PERFORM public.submit_idea(idea);
   IF desired='Submitted' THEN CONTINUE; END IF;
   IF desired='Withdrawn' THEN PERFORM public.transition_idea(idea,'Withdrawn');CONTINUE;END IF;
   PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated','app_metadata',jsonb_build_object('role','admin'))::text,true);
   IF desired='Needs More Info' THEN PERFORM public.transition_idea(idea,desired,'Please clarify the expected benefit.');CONTINUE;END IF;
   IF desired='Rejected' THEN PERFORM public.transition_idea(idea,desired,'The proposed work duplicates an existing tool.');CONTINUE;END IF;
   PERFORM public.transition_idea(idea,'Under Evaluation');
   IF desired='Under Evaluation' THEN CONTINUE;END IF;
   PERFORM public.evaluate_idea(idea,4,2);
   IF desired='Parked' THEN PERFORM public.transition_idea(idea,'Parked','Revisit when capacity is available.');CONTINUE;END IF;
   PERFORM public.transition_idea(idea,'Approved');
   IF desired='Approved' THEN CONTINUE;END IF;
   PERFORM public.transition_idea(idea,'In Progress',NULL,owner_id,current_date+CASE WHEN iteration=1 THEN -2 ELSE 7 END);
   PERFORM public.add_idea_progress_update(idea,'Checklist structure is ready for review.');
   IF desired='Done' THEN PERFORM public.complete_idea(idea,NULL,'https://www.youtube.com/watch?v=aqz-KE-bpKQ','Sample video link for the demonstration dataset.');END IF;
  END LOOP;
 END LOOP;
END $$;
COMMIT;
