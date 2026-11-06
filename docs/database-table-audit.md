# Database table coverage — 2026-11-05

Read-only inspection of CloseFuture (`knmqlkhnfumeuxgnkuez`), compared with
FRD Section 7 and AGENTS.md. No database changes made.

| FRD entity | Existing table | Coverage |
| --- | --- | --- |
| Profile | public.profiles | ID linked to auth.users, full_name, role; email absent from profiles |
| Idea | public.ideas + public.idea_private_details | All listed data fields represented; submitter_id stored separately |
| Vote | public.idea_votes | User, idea, timestamp and unique pair |
| Comment | public.idea_comments | User, idea, parent, text, created/updated timestamps |
| Follow | public.idea_followers | User, idea and unique pair |
| StatusHistory | public.idea_status_history | Idea, from/to status, actor, reason, timestamp |
| ProgressUpdate | public.idea_progress_updates | Idea, user, text, timestamp |
| OwnerHistory | public.idea_owner_history | Idea, owner, assigned by, assigned at |

All eight FRD entities have corresponding tables. The extra private-details table
separates submitter identity; table existence alone does not prove anonymity.

## Missing project-required table

`public.audit_log` is absent. AGENTS.md requires application audit logging for
status changes, scoring, assignments, completion and deletes. Supabase's
`auth.audit_log_entries` exists but is Auth-specific and does not replace it.
This is a project-rule requirement, not a ninth entity explicitly listed in FRD.

## Column and configuration gaps

- FRD lists email on Profile. `profiles.email` is absent; `auth.users.email`
  exists. Decide on a protected profile field or secure API mapping when wiring
  profiles; do not expose auth.users directly to clients.
- RLS is enabled on all nine public tables, but FORCE RLS is false on all nine,
  contrary to AGENTS.md. Policies and workflow enforcement need a separate audit.
- Private `idea-demos` bucket exists with 104857600-byte limit and MP4/QuickTime/
  WebM MIME types. Demo references and optional summary exist on ideas.
- Status/category/rough-effort/score checks and vote/follow uniqueness exist.
- No separate category, score, dashboard-count, overdue or demo metadata table
  is required: current columns, relations and queries can represent those needs.

This checks structural coverage, not full RPC/RLS correctness, indexes, auth
configuration, realtime authorization, existing data validity or frontend wiring.
The local frontend still uses sample data rather than this database.

## Follow-up — 2026-11-05

Approved migration 20261105063446 resolved audit_log absence and added profiles.email
with Auth synchronization. audit_log has forced RLS. The nine legacy tables still
need separate FORCE RLS review. Workflow audit-event wiring remains outstanding.

## Security follow-up

Migrations through 20261105070945 now force RLS on all ten public tables,
restrict raw identity reads and use JWT role predicates with the user-enabled
Auth hook. Workflow audit triggers are installed; SQL rollback tests pass.
