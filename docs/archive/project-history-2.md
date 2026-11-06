# Historical project log — superseded by docs/project.md

FRD-compliance audit; policies/function bodies have not been validated.
No remote changes were made. Local Next.js still uses preview fixtures and
has no Supabase runtime client/configuration. Tool access and app integration
are separate. Earlier TBD references above are historical.

## Database table coverage audit — 2026-11-05

Read-only structural audit: all eight FRD entities are represented by nine public
tables (author identity is split into idea_private_details). Missing project-rule
table: public.audit_log. profiles lacks the FRD-listed email field, although
auth.users.email exists. All public tables enable RLS but none force it. Private
idea-demos bucket exists with the requested size/MIME configuration.
See docs/database-table-audit.md for mappings and audit limits. No remote changes.

Missing-structure addition prepared: docs/database/missing-structure.sql and
docs/rls-policies-draft.md contain the audit table, protected Auth-synced profile
email and policies. Awaiting mandatory RLS policy review before remote migration.
No database writes performed.

## Missing structure applied — 2026-11-05

User approved the policy draft. Migration 20261105063446_add_audit_log_and_profile_email
applied successfully to knmqlkhnfumeuxgnkuez and saved under supabase/migrations/.
public.audit_log now exists with forced/enabled RLS, Admin-only SELECT policy,
no authenticated client writes, and actor/idea/time indexes. profiles.email was
backfilled for five profiles with zero mismatches against Auth. Signup population
and an Auth email-update synchronization trigger are installed. Direct role/email
updates are denied; existing name update privilege remains. Verification queries
confirmed those grants, policy and trigger. Existing workflow RPC audit event
writes and legacy FORCE RLS/JWT-policy remediation remain separate work.

Post-migration security advisor returned no findings on the new audit_log or
email-sync trigger functions. Existing findings remain: no policies on votes/
owner history; anon-executable is_admin; 21 authenticated SECURITY DEFINER
functions needing review; leaked-password protection disabled. These were not
changed by this approved structural migration.

## Function security remediation — planned 2026-11-05

Audit existing definitions and ACLs, normalize security paths/execute grants,
fix draft visibility and scoring-stage checks, and add workflow audit logging.
Mutation RPCs retain narrowly justified DEFINER privileges because callers have
no table-write grants. Prepare missing sanitized/paginated reads and JWT helpers.
RLS changes require a fresh policy review; prior approval covered only audit_log
and profiles.email. JWT is_admin conversion requires token-hook activation first.

Function audit/proposed remediation completed for review: see
docs/database/function-security-audit.md and function-security-*.sql.
Prepared JWT/visibility predicates, safe paginated reads, masked details, Admin
aggregates/owner directory, audit/write guards and exact-domain Auth validation;
existing RPC definitions are snapshotted and proposed hardening is saved.
No remote function/policy changes applied in this pass. New policies await review;
hosted token-hook activation is required before JWT role-predicate cutover.
Rollback SQL tests are prepared, not run against the unmodified database.

Security remediation approved by user 2026-11-05. Installed Auth-only
custom_access_token_hook in migration 20261105065417; activation requested.
Proceeding with independent RLS/function hardening while retaining the existing
Admin predicate until the hook is enabled. No JWT claim fallback is introduced.

Applied protected read APIs, visibility predicates, seven existing-function
hardening migrations, and identity-safe RLS/workflow/storage/Auth-domain guards
through 20261105070103. All source SQL saved in supabase/migrations/.
is_admin remains the restricted legacy predicate pending hosted-hook activation;
JWT cutover has not been applied. Verification in progress.

Applied-stage tests pass: workflow permissions, draft privacy including Admin,
anonymous actor masking, comment time/depth, score/approval/Done gates, fake-upload
rejection and transactional audit events. Tests rolled back and original counts
remain 14 ideas/5 profiles. Auth-admin hook claim tests, external-domain rejection
and anonymous grant checks pass. Awaiting hosted-hook activation for JWT cutover.

Vote-removal check: enforce FR-4.3 allowed statuses on unvote as well as vote,
locking the idea before the change to serialize with workflow transitions.

Vote-removal status gate applied in migration 20261105070721. JWT cutover SQL is
ready in docs/database/jwt-role-cutover.sql, not applied. Auth hook output tests
ran as the migration owner with Auth-admin execute grants separately checked;
MCP cannot impersonate supabase_auth_admin. Real login/token issuance remains
unverified until the hosted hook is enabled.

## JWT cutover — 2026-11-05

User confirmed hosted Custom Access Token hook enabled. Migration
20261105070945 switched is_admin to STABLE SECURITY INVOKER using
auth.jwt().app_metadata.role. No profiles lookup or user_metadata fallback.
Existing sessions require refresh/re-login. Function-security, identity/workflow
and Auth/grant rollback suites pass after cutover. All ten public tables have
forced RLS; anonymous function execution is revoked. Real browser sign-in remains
unverified because frontend Auth integration is not built.

## Authentication integration — 2026-11-05

Implementing real employee signup/sign-in/sign-out with Supabase SSR cookies,
confirmation callbacks, session refresh and server-verified dashboard access.
JWT app_metadata.role controls Member/Admin navigation; URL role switches are
removed. Existing idea data/actions remain explicitly labeled sample previews.
No service-role key or new RLS policy is needed. See docs/authentication.md.

Auth integration implemented: approved pinned Supabase packages, centralized env
and clients, server actions, verified session identity, confirmation handlers,
protected dashboard and real employee account menu. Build/lint/typecheck and 12
unit tests pass; browser guards/validation/confirmation checks pass. Successful
employee sign-in/email delivery still need account-based end-to-end verification.

## Live integration — planned 2026-11-05

Replace preview reads/actions with authenticated RPCs, real ownership, persisted
engagement/discussion/history/execution, private video uploads/playback and private
ID-only Broadcast invalidation. Preserve two routes and existing popup design.
Complete validation limits, types, seed/setup documentation and acceptance checks.
User approved incomplete drafts, Submitted-only oldest-first review, deleted
comment placeholders retaining replies, and retaining scores on reevaluation.
New Realtime RLS policies will be drafted for review before application.

Integration backend contract: add atomic INVOKER save/submit, approve and complete
wrappers around existing validated RPCs, soft-deleted comment timestamps, safe
paginated owner filter directory, matching persisted field-length CHECKs and
supporting-link validation. Fix supported demo-link matching. No new user DML
policy is required; existing RLS remains forced. Realtime policy is separate.

Applied integration_structure/functions/atomic migrations through 20261105083704
against the locked project. New receive-only Realtime policy approved by user.
Atomic wrappers preserve existing role checks; incomplete drafts and submission
constraints are now enforced in PostgreSQL. Verification continues with live UI.

Live verification found a legacy read RPC locking idea rows, which makes the
STABLE list RPC fail under PostgREST read-only execution. Replace that read-only
vote summary with a STABLE, non-locking visibility-checked version. Add explicit
non-draft filtering to All ideas and an indexed text-search expression.

Live checks passed with disposable accounts: Member/Admin/Owner login and issued
JWT roles; browser draft persistence/My Ideas/sign-out/guards; voting, following,
comment nesting and deletion placeholders; reasons/resubmission/scoring/ownership/
progress/final-state gates; supported external demo completion; real WebM upload,
unauthorized upload denial and private signed playback. Realtime subscription
verification is still in progress; do not mark the overall project complete.
