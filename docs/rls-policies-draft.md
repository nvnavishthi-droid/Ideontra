# Missing database structure — policy review

Target: CloseFuture, `knmqlkhnfumeuxgnkuez`. Proposed SQL:
[missing-structure.sql](database/missing-structure.sql). Not applied.

- `audit_log`: authenticated Admin SELECT only through `(SELECT public.is_admin())`.
  Members/anonymous users cannot read it. No client INSERT/UPDATE/DELETE, including
  Admins; workflow RPCs will append events when audited in the backend phase.
  RLS enabled and forced. No identity/content should be copied into JSON details
  unnecessarily. Idea IDs persist after deletion; actor FK indexed.
- `profiles.email`: backfill from Auth, populate on signup, sync Auth email updates.
  Retain current self/Admin SELECT visibility; no new exposure of other profiles.
  Auth remains authoritative; direct authenticated updates are restricted to full_name.
  Email stays nullable to accommodate Auth users without email; max 320 characters.
- Trigger-only SECURITY DEFINER functions have no client EXECUTE permission and use
  a pinned search path. They use trusted trigger rows, not caller-supplied identities.

Existing `is_admin()` currently queries profiles as SECURITY DEFINER; it is not the
project-required JWT predicate. Replacing it requires coordinated Auth-hook work
and is outside this missing-table/field addition. Existing table FORCE RLS and
other policies are likewise separate remediation; do not blindly enable it across
legacy functions without testing their execution privileges.

This adds audit structure, not complete workflow event coverage. No events are
fabricated or backfilled. No new UI/auth integration is included.

Required review: approve the policy set above before applying its migration,
per AGENTS.md §5 rule 9.

## Approval and application

Approved by user and applied 2026-11-05 as migration 20261105063446.
Post-apply structure, Auth email backfill, trigger and privilege checks passed.

## Function-security remediation — NEW review pending

The earlier approval covered audit_log/profile email only. Review these additional
changes before applying [proposed policy SQL](database/function-security-policies.sql)
and [function security map](database/function-security-audit.md).

- Ideas: non-draft visible to authenticated users; drafts author-only, including Admins.
- Private author mappings: raw access author-only; narrowly scoped DEFINER reads mask
  identity for Members and return it to Admins only for visible non-drafts.
- Profiles: self/Admin read; remove direct name-update permission (RPC-only writes).
- Followers: users read only their own rows. Votes: aggregate RPC only.
- Comments/status history/owner history/progress: no raw client read; masked detail
  RPC returns visible-idea collections. No client writes, including Admins.
- Audit: retain approved Admin-only read. Workflow/history/audit write guards accept
  trusted postgres-owned RPC execution; client-set variables cannot bypass guards.
- Enable and force RLS on all public tables. No relaxed member write policies.
- Existing Auth signup/email-sync triggers remain elevated and not client-callable.
- JWT predicates need the custom access token hook enabled before conversion.

2026-11-05: User approved applying project-required RLS/JWT/security remediation.
Raw ideas reads are also revoked to prevent owner_id identifying an anonymous
submitter who owns the same idea; protected read RPCs supply masked projections.
Storage policies use protected permission predicates rather than raw table grants.

## Applied security remediation

Applied through 20261105070945 following user approval. User confirmed Auth hook
activation; JWT predicate cutover completed and transactional SQL suites passed.
Protected DEFINER read APIs enforce visibility and anonymity; INVOKER predicates/
guards have no elevated table access. See docs/project.md for remaining limits.

## Live integration — private Broadcast review (2026-11-05)

Proposed SQL: docs/database/live-integration-rls.sql. Authenticated employees can
receive ID/event-only changes on ideas:public, their own user:<uid> channel,
and Admins additionally on admin:ideas. Draft events go only to their author.
No client Broadcast sends or raw database writes are granted. Existing table and
Storage policies remain enforced. This new policy awaits user review.

Implementation correction: is_member() denotes only the Member role; the approved
employee receive condition therefore uses is_member() OR is_admin(). Admin-only
channels retain their additional is_admin() check. This implements the approved
policy scope without granting any new client writes.

## Temporary QA Storage cleanup — review requested

The production bucket intentionally grants no DELETE policy. One test WebM is
therefore protected from ordinary client removal. Proposed temporary policy in
docs/database/qa-storage-cleanup-policy.sql allows only Admin deletion of that
single exact QA path, then is immediately dropped. No real employee upload is
included. This is cleanup only, not a permanent product permission change.
