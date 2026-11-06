-- 01-tables.sql — Data-free verified Supabase schema snapshot, 2026-11-05.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE TYPE public.user_role AS ENUM ('member','admin');
CREATE TABLE public.idea_comments (
id uuid DEFAULT gen_random_uuid() NOT NULL,
idea_id uuid NOT NULL,
user_id uuid NOT NULL,
parent_comment_id uuid,
content text NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL,
deleted_at timestamp with time zone
);
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.idea_comments FROM PUBLIC,anon,authenticated;
CREATE TABLE public.idea_followers (
id uuid DEFAULT gen_random_uuid() NOT NULL,
idea_id uuid NOT NULL,
user_id uuid NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.idea_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_followers FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.idea_followers FROM PUBLIC,anon,authenticated;
CREATE TABLE public.idea_votes (
id uuid DEFAULT gen_random_uuid() NOT NULL,
idea_id uuid NOT NULL,
user_id uuid NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_votes FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.idea_votes FROM PUBLIC,anon,authenticated;
CREATE TABLE public.idea_status_history (
id uuid DEFAULT gen_random_uuid() NOT NULL,
idea_id uuid NOT NULL,
from_status text,
to_status text NOT NULL,
changed_by uuid NOT NULL,
reason text,
changed_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.idea_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_status_history FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.idea_status_history FROM PUBLIC,anon,authenticated;
CREATE TABLE public.idea_private_details (
idea_id uuid NOT NULL,
submitter_id uuid NOT NULL
);
ALTER TABLE public.idea_private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_private_details FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.idea_private_details FROM PUBLIC,anon,authenticated;
CREATE TABLE public.idea_owner_history (
id uuid DEFAULT gen_random_uuid() NOT NULL,
idea_id uuid NOT NULL,
owner_id uuid NOT NULL,
assigned_by uuid NOT NULL,
assigned_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.idea_owner_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_owner_history FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.idea_owner_history FROM PUBLIC,anon,authenticated;
CREATE TABLE public.audit_log (
id uuid DEFAULT gen_random_uuid() NOT NULL,
actor_id uuid,
idea_id uuid,
action text NOT NULL,
occurred_at timestamp with time zone DEFAULT now() NOT NULL,
details jsonb DEFAULT '{}'::jsonb NOT NULL
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log FROM PUBLIC,anon,authenticated;
CREATE TABLE public.ideas (
id uuid DEFAULT gen_random_uuid() NOT NULL,
title character varying(100) NOT NULL,
category text NOT NULL,
problem text NOT NULL,
proposed_solution text NOT NULL,
who_benefits text NOT NULL,
expected_impact text NOT NULL,
rough_effort text,
links text[] DEFAULT '{}'::text[],
is_anonymous boolean DEFAULT false NOT NULL,
status text DEFAULT 'Draft'::text NOT NULL,
submitted_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL,
impact_score smallint,
effort_score smallint,
owner_id uuid,
target_date date,
demo_video_path text,
demo_video_url text,
outcome_summary text,
evaluation_quadrant text GENERATED ALWAYS AS (
CASE
    WHEN ((impact_score IS NULL) OR (effort_score IS NULL)) THEN NULL::text
    WHEN ((impact_score >= 3) AND (effort_score < 3)) THEN 'Quick Win'::text
    WHEN ((impact_score >= 3) AND (effort_score >= 3)) THEN 'Big Bet'::text
    WHEN ((impact_score < 3) AND (effort_score < 3)) THEN 'Fill-in'::text
    ELSE 'Not Worth It'::text
END) STORED
);
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.ideas FROM PUBLIC,anon,authenticated;
CREATE TABLE public.idea_progress_updates (
id uuid DEFAULT gen_random_uuid() NOT NULL,
idea_id uuid NOT NULL,
user_id uuid NOT NULL,
update_text text NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.idea_progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_progress_updates FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.idea_progress_updates FROM PUBLIC,anon,authenticated;
CREATE TABLE public.profiles (
id uuid NOT NULL,
full_name text,
role user_role DEFAULT 'member'::user_role NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL,
email text
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM PUBLIC,anon,authenticated;
