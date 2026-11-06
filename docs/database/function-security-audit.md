# Function coverage and security review — 2026-11-05

Target: CloseFuture (`knmqlkhnfumeuxgnkuez`). Approved remediation SQL has been applied through 20261105070103, except the
is_admin JWT cutover pending Auth hook activation. Original audit found 23
public functions, all DEFINER.
Original definitions are saved in function-baseline-1.sql through -8.sql.

## Existing coverage

| Flow | Existing functions | Proposed security |
| --- | --- | --- |
| Create/edit/draft deletion | create_idea, update_idea, delete_draft | DEFINER: validated writes through denied table DML |
| Submit/resubmit/withdraw/status changes/Done | submit_idea, transition_idea | DEFINER: role/status checks and atomic history writes |
| Score | evaluate_idea | DEFINER: privileged workflow columns; restrict to Under Evaluation |
| Assign/reassign | transition_idea, reassign_idea_owner | DEFINER: workflow/history writes |
| Vote | vote_for_idea, unvote_for_idea | DEFINER: no raw vote writes/identity exposure |
| Comment/reply/edit/delete | add_idea_comment, edit_idea_comment, delete_idea_comment | DEFINER: one-level/author/time rules |
| Follow | follow_idea, unfollow_idea | DEFINER: no direct user DML |
| Progress | add_idea_progress_update | DEFINER: owner/Admin-only insert |
| Demo reference | save_idea_demo | DEFINER: owner/Admin write, validate uploaded object/type/size |
| Vote/follow counts | get_idea_vote_summary, get_idea_follow_summary | DEFINER: aggregate hidden rows; explicit draft visibility |
| Display names | get_profile_names, get_idea_submitter_name | DEFINER: narrow read across protected identities; masking required |
| Role predicate | is_admin | INVOKER after role hook activation; legacy predicate temporarily retained |
| Auth profile lifecycle | handle_new_user, sync_profile_email | DEFINER, trigger-only, no client execute |

## Missing functions proposed

- `is_member`, `is_idea_author`, `is_idea_owner`, `can_see_idea`: STABLE INVOKER.
- `custom_access_token_hook`: STABLE DEFINER, executable only by supabase_auth_admin;
  trusted Auth event instead of auth.uid because it runs before user login.
- `list_ideas`: STABLE DEFINER (identity-masking projection requires revoked raw reads). Server filtering/sorting, page sizes 10/25/50/100,
  search minimum 3, `{rows,total}`; all/My Ideas/review/overdue share it.
- `get_idea_summary`, `get_idea_detail`: STABLE DEFINER for sanitized projections
  of restricted identities, votes, comments, progress and history.
- `get_admin_dashboard`: STABLE DEFINER aggregate without private drafts.
- `list_idea_owners`: STABLE DEFINER, paginated Admin-only directory, no email.
- `guard_workflow_write`, `audit_idea_write`, `audit_comment_delete`: INVOKER triggers; trusted RPC owner
  permissions suffice. No client execute and no spoofable GUC bypass.

- `enforce_employee_email`: INVOKER Auth trigger enforces the exact closefuture.io
  domain for future signup/email changes; existing users are not modified.

All functions pin search_path public,pg_temp; public/anonymous execute is revoked.
Client-callable elevated functions validate authentication and relevant business rules.
Mutation functions remain DEFINER deliberately: converting them would require
loosening direct table writes, contrary to the repository security model.

## Concrete findings and fixes

- Follow summary currently reveals aggregate presence for another author's draft.
- Submitter-name/vote-summary read paths allow Admin access to others' drafts.
- Current ideas policy also permits Admin draft reads; proposed policy removes it.
- Scoring currently accepts Submitted, contrary to FR-7.1.
- Raw comments/history/progress can reveal anonymous actor IDs; revoke their raw
  client SELECT and return masked collections from detail RPC.
- Existing functions lack audit events. Add transaction-local audit triggers for
  create/update/status/scores/owner/demo/deletion without copying idea content.
- `save_idea_demo` checks the path prefix but not uploaded-object existence/type/size.
- Legacy RLS is not forced; proposed policies force it and add FK/filter/order indexes.
- `is_admin` currently exposes a DEFINER DB role lookup to anon. JWT conversion and
  scoped EXECUTE remove that route without introducing a user-editable role source.

## Application order and unresolved choices

1. Approve the expanded policy set in docs/rls-policies-draft.md.
2. Install only custom_access_token_hook from function-security-helpers.sql first.
3. Enable it in Supabase Authentication > Hooks and obtain a fresh Admin session.
   Current MCP tools cannot configure hosted Auth hooks. Do not switch is_admin
   before this activation/claim check. Existing tokens need refresh/re-login.
4. Apply remaining helpers, existing-function files 1–7, read APIs and policies
   atomically; snapshot/save as versioned migrations, run rollback SQL checks.
5. Recheck advisors and Member/Admin/anonymous cases before declaring completion.

Review-queue membership and exact active board statuses remain unspecified by FRD;
list_ideas requires explicit review status and accepts explicit active statuses,
so this implementation does not silently choose those business rules.
Existing incomplete-draft requirements and parent-comment cascade behavior remain
unchanged, not newly endorsed. Field-limit consistency needs a later contract pass.
This review does not connect the frontend or implement Realtime subscriptions.

Tests: supabase/tests/function-security.sql is prepared, not executed (migration
has not been applied). Additional anonymity/comment-window/concurrency tests are
required before the final security result is accepted. No remote changes yet.

## Verification — applied stages

RLS is enabled and forced on all ten public tables. No public functions allow
anonymous execution. Transactional workflow and anonymity tests passed and
rolled back: draft privacy (including Admin), raw-identity denial, masked
comments, role escalation denial, scoring stage, vote rules, comment window,
one-level replies, demo validation, completion gates and audit events.
Auth hook executes only as Auth admin and overwrites roles from profiles;
external-domain signup is rejected. Original 14 ideas and 5 profiles remain.

Advisor findings: no-policy INFO on five deliberately RPC-only tables is expected
deny-all behavior, not a missing access path. Authenticated DEFINER warnings are
intentional for reviewed validated/masking RPCs. Leaked-password protection is
still disabled in hosted Auth settings. Duplicate follower index is pre-existing;
unused-index INFO is expected on new indexes. JWT cutover remains pending.

Vote removal was additionally gated to voting statuses in migration
20261105070721. Hosted hook activation remains required; see jwt-role-cutover.sql.
Hook function output was tested as the migration owner, and its Auth-admin grant
was checked in catalogs. MCP cannot impersonate supabase_auth_admin, so actual
Auth-issued JWT verification still requires hook activation and login.

## JWT final state

User confirmed hosted hook enabled; migration 20261105070945 converted is_admin
to INVOKER JWT app_metadata.role. All three rollback SQL suites passed again
after cutover. End-to-end login and hosted leaked-password setting remain
unverified/not enabled respectively; frontend still uses preview fixtures.
