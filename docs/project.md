# Ideontra — project state

## Idea AI chat — implemented, activation pending 2026-11-06

Setup-message clarification: missing credentials or free-tier confirmation shows
a neutral free Google AI Studio setup message. The popup does not mean billing
must be enabled. Local inspection found GEMINI_API_KEY and the free-tier
confirmation missing; no credentials or billing configuration were changed.

User approved an Ask AI surface within idea details and sending idea content to
Google, with permanent history private to each user and idea. Contract and
proposed access policies: [idea-ai-chat.md](idea-ai-chat.md). RLS review was approved on 2026-11-06. Schema and runtime implementation are
complete; live Google activation awaits credentials and billing confirmation.

Authoritative current record, updated 2026-11-06. Historical entries are archived
in docs/archive/project-history-1.md and project-history-2.md; their old pending
statements are superseded by this file. Scope: docs/scope/scope-final.md.

## Product and design

CloseFuture Ideas & Innovation Board, with Member/Admin global roles and per-idea
Owner permissions. Two page routes: dashboard / and authentication /auth.
All other workflows use dialogs. Design source: test.pen and docs/design-system.md.
The Next.js/Tailwind implementation preserves the approved light design, aligned
controls, bounded result scrolling, compact pagination and popup feedback.

## Backend identity and security

Only Supabase project knmqlkhnfumeuxgnkuez (CloseFuture, ap-south-1) is allowed.
MCP is the only schema/write administration path. All changes are saved in
supabase/migrations. No service-role key is used by the running app.

All eleven public tables enable and force RLS. Raw workflow/history writes are
blocked, including for Admins. User writes go through validated RPCs. Anonymous
author identity is stripped by database read projections before reaching Members.
JWT app_metadata.role comes from the enabled custom_access_token_hook; role
predicates are INVOKER/STABLE. Profile role/email cannot be changed by clients.
See docs/rls-policies-draft.md and docs/database/function-security-audit.md for
review history. Those audit snapshots precede the current integration fixes.

## Tables and Storage

- profiles: Auth-linked employee name, exact-domain email and stored global role.
- idea_chat_messages: permanent private per-user/idea chat, server-authorized replies.
- ideas: content, status, scores/quadrant, owner/date, private demo path/link/outcome.
- idea_private_details: protected submitter identity.
- idea_votes and idea_followers: unique user/idea engagement.
- idea_comments: one-level replies, author-only 15-minute edits/deletes; deleted_at
  tombstones preserve records; deleted comments and their replies are hidden.
- idea_status_history: every transition with actor, time and required reason.
- idea_owner_history: all assignments/reassignments.
- idea_progress_updates: Owner/Admin progress text and timestamp.
- audit_log: protected mutation audit trail; Admin-only reads.
- idea-demos: private Storage bucket, MP4/MOV/WebM, 100 MB maximum. Uploaded names
  contain only idea UUID/random filename. Playback uses five-minute signed URLs.

Persisted caps and matching DB checks: docs/form-field-limits.md. FK/filter/order
indexes are present; indexed text search uses pg_trgm. Generated database types
are split under src/types/database*.ts to keep every file under 400 lines.

## Auth integration

Supabase SSR cookies, employee signup/sign-in/sign-out, session refresh and immediate signup
sessions are implemented; confirmation callback routes have been removed. Server rendering validates Auth
identity and JWT role; URL role spoofing cannot grant Admin access. No persona
switch remains. Details: docs/authentication.md.

Real Member/Admin/Owner login and hook-issued roles have passed live checks.
Browser login, draft saving/My Ideas/sign-out and protected redirects pass.
Fresh signup without confirmation email, immediate dashboard access, sign-out and
password sign-in passed live verification on 2026-11-05.

## Read contracts

- list_ideas: server-side page/pageSize/search/status/category/owner/quadrant/sort;
  rows plus total. Modes all/drafts/submissions/owned/following/review/overdue.
- get_idea_summary/get_idea_detail: sanitized content and real comments, progress,
  status history and owner history. Author/owner flags come from the database.
- get_admin_dashboard: non-draft status/category counts and overdue count.
- list_idea_owners: Admin-only paginated assignment directory.
- list_visible_owners: paginated owner filter directory that protects anonymity.
- get_idea_vote_summary/get_idea_follow_summary: authorized aggregate engagement.
- get_idea_submitter_name/get_profile_names: existing protected naming helpers.

All lists use URL state and manual TanStack Table; none filter loaded browser
arrays. Search requires three trimmed characters. Board grouping only partitions
an already server-filtered page into the requested status columns; see the latest
dashboard corrections in docs/dashboard-interactions.md.

## Write contracts

- create_idea/update_idea/submit_idea/delete_draft: author content and private drafts.
- save_idea_form: atomic INVOKER composition of save and optional submit/resubmit.
- vote_for_idea/unvote_for_idea, follow_idea/unfollow_idea: persisted engagement.
- add_idea_comment/edit_idea_comment/delete_idea_comment: discussion with enforced
  depth, authorship and 15-minute windows; deletion preserves a tombstone.
- evaluate_idea: Admin scoring only while Under Evaluation.
- approve_evaluated_idea: atomic INVOKER scoring plus approval.
- transition_idea: only FRD transitions, required reasons, assignment/date/Done gates.
- reassign_idea_owner: Admin assignment with owner history.
- add_idea_progress_update: assigned Owner/Admin only.
- save_idea_demo: allowed private object or supported HTTPS external video link.
- complete_idea: atomic INVOKER demo metadata plus Done transition.

Mutating inner RPCs retain documented DEFINER elevation because clients have no
raw DML grants. Every one validates Auth, ownership/role and business rules.
Atomic wrappers are INVOKER and reuse those checks. Workflow guards, audit/link
validation/Auth sync/domain triggers are restricted internal functions.

## Realtime

Approved receive-only policy ideontra_receive_broadcast on realtime.messages:
Member/Admin receive ideas:public, their own user:<uid>; Admin additionally receives
admin:ideas. No client send/write policy. Draft events go only to the author.
broadcast_idea_event emits idea_id/event only; Supabase may add a transport event
ID. Frontend coalesces events and invalidates queries/refetches the current route.
Live subscription authorization/delivery testing is in progress.

## Approved workflow details

Incomplete private drafts are allowed; mandatory fields are required on submit.
All ideas excludes drafts; My Ideas drafts are author-only. Admin review includes
Submitted only, oldest first by default. Deleted threads are hidden. Previous
scores remain during reevaluation until the Admin changes them. User approved all
four behaviors on 2026-11-05; comment presentation was superseded on 2026-11-06.
Decisions: docs/decisions.md.

## Verification and remaining work

Build/lint/typecheck and unit tests pass at the first integration checkpoint.
Live RPC tests passed draft privacy, submission, anonymity, voting, following,
comment depth/tombstones, review permissions, reasons/resubmission, scoring,
ownership/progress, demo gates, completion/final states and paginated search.
A real WebM upload, unauthorized upload rejection and private playback passed.

Before declaring completion: finish Realtime verification, broader rendered
workflow/mobile tests, SQL regression checks, baseline/seed reproducibility,
cleanup of disposable QA users/records, setup README and walkthrough handoff.
Leaked-password protection remains disabled in hosted Auth (plan-dependent).
Git commit/push/publication require a separate explicit user request.

Seed dry-run passed transactionally (rolled back). Applying the idempotent demo
seed now creates four dedicated demo accounts and two ideas per status; existing
employee passwords/data remain untouched. The generated demo password is stored
only in ignored .env.local as IDEONTRA_DEMO_PASSWORD for local handoff.

Demo seed was explicitly approved and applied after the required review.
Four rollback SQL suites pass and 17 unit tests pass. Realtime authorization
and delivery tests pass with renewed sessions.


Final runtime check found a Supabase background session initializer touching time
while Next.js was prerendering. Explicitly bind server clients to connection()
and disable browser directory queries during server rendering; browser hydration
then fetches that directory normally. No authorization behavior changes.

Demo seed approved and applied: four demo accounts and exactly two seeded ideas
per FRD status, without resetting existing employees. Password remains only in
ignored .env.local. Active comment counts exclude deleted placeholders, while
threads retain them. Data-free schema snapshot and idempotent seed instructions
are available; seed execution was verified with rollback first.

Approved single-object QA Storage cleanup completed and verified; temporary
DELETE policy immediately removed in migration 20261105094913. Existing employee
uploads were untouched. Final Admin/mobile browser checks pass and the rebuilt
server no longer reports the prerender-time session initialization warning.

Full-list verification found nullable legacy links on older Done records; the
mapper now normalizes missing links/content to empty display values rather than
rejecting an otherwise authorized database result. New writes retain validation.

Disposable QA video, ideas, audit rows, sessions and three QA accounts have been
removed after verification; original employees and approved demo accounts remain.

Internal functions: is_admin/is_member/is_idea_author/is_idea_owner/can_see_idea/
can_access_idea_demo are restricted visibility/role predicates; handle_new_user,
sync_profile_email and enforce_employee_email maintain Auth profiles/domain;
guard_workflow_write, audit_idea_write, audit_comment_delete, validate_idea_links
and broadcast_idea_event are trigger-only functions. No anonymous execute grants.

Local walkthrough recorded: docs/verification/walkthrough.webm (357 seconds),
showing actual Member/Admin screens and persisted data with credentials omitted.
Detailed acceptance evidence is docs/verification/live-integration.md.

Full UI workflow testing found duplicate owner control IDs between the background
filter and assignment popup. Give the filter its own owner-filter ID and explicit
accessible label so assignment labels/focus target the popup's actual control.

## Integration completion checkpoint

Core FRD frontend/backend flows are connected and verified, including the full
submission-to-Done browser path and real session refresh. Lint/typecheck/build,
17 unit tests and four rollback SQL suites pass. Private Broadcast and actual
video upload/playback pass. Disposable test records are cleaned up; approved demo
accounts/twenty seeded ideas remain. Local six-minute UI overview is recorded and
playback-verified. No production preview adapter remains under src/.

Remaining external acceptance: clean
installation of the snapshot on an authorized empty database; hosted deployment
and final redirects; Git/public walkthrough publication. A final narrated FRD
submission recording can follow docs/walkthrough.md. No claim of complete public
launch is made. Full evidence: docs/verification/live-integration.md.

## Signup confirmation removed — verified 2026-11-05

User removed the email confirmation requirement. Removed app confirmation callback
handlers, signup redirect options and email-confirmation UI. Signup requires a
session. User disabled Confirm Email; the public Auth settings endpoint confirmed
autoconfirm enabled. A fresh UI signup reached the dashboard, received Member
permissions, and passed sign-out/password sign-in. Temporary QA account removed.
Email-delivery/link testing is superseded by immediate-signup session testing.

Signup acceptance update (2026-11-05): the user removed confirmation email.
Earlier email-delivery/link test requirements are superseded; immediate signup
session verification passed after hosted Confirm Email was disabled (2026-11-05).

## Fresh installation test — preparation 2026-11-05

Requested fresh installation testing. Static preflight verified all nine included
SQL parts exist and all ten application tables enable and force RLS. Runtime
installation must use an isolated empty Supabase database; the populated locked
project must not be reset. No Docker, psql or Supabase CLI is available on PATH.
AGENTS.md §5 restricts all MCP calls to the locked project; testing a temporary
branch requires explicit permission for that branch reference before creation.
Test sequence: install snapshot, run seed and all SQL rule suites, verify schema
and security contracts, then remove the disposable branch. Runtime test pending.

Fresh-install authorization (2026-11-05): user instructed completion of the
isolated branch test after the branch/cost/cleanup proposal. Temporary branch
access is authorized solely for this test; main remains unchanged.

## Demo idea cleanup — requested 2026-11-05

User authorized removal of only the twenty seed-generated ideas. Match exact seed
titles and the demo-member submitter together; preserve four demo accounts and
all other ideas. Remove dependent seed history/progress/audit records only for
those IDs. Abort if count differs or uploaded demo objects are present.

Cleanup completed: twenty seeded ideas and their dependent seed records removed
transactionally through MCP. Verified zero seed ideas, fourteen other ideas
unchanged (full-row snapshot comparison), and all four demo accounts retained.
Seed script remains available as the FRD setup deliverable; it was not rerun.
Fresh-install branch was declined by the user after the price quote; none created.

## 2026-11-05 — Quiet Realtime recovery

User requested silent reconnects and one popup only for sustained unavailability.
Use a 30-second grace period across all private channels; report once per outage,
reset only when every channel recovers. Retain SDK reconnect behavior, retry failed
Auth setup after five seconds, and cancel timers/callbacks on cleanup. Reuse the
existing feedback dialog. Timing is a reversible implementation choice; immediate
per-channel popups were rejected because they interrupt forms during brief outages.

Quiet reconnect handling implemented in src/lib/api/realtime.ts. Three deterministic
API tests pass for transient recovery, one sustained warning across channels,
recovery/new outage and cleanup. All twenty unit tests, lint and typecheck pass.
No database, JWT or RLS changes were needed.

## 2026-11-05 — Brand text alignment

Align CloseFuture and Ideas & Innovation Board on a shared text baseline within
the centered header. Preserve existing typography, colors, mobile subtitle hiding
and spacing. Apply to the shared code header and all matching Pencil headers.
Pencil has no baseline alignment control available here: offset the smaller
subtitle using a four-pixel top inset in its centered frame (two-pixel net shift).
This reversible presentation adjustment replaces independent vertical centering.

## 2026-11-05 — Owner filter typography

Match the owner filter text to the other dashboard filter buttons using the
existing text-sm/font-medium tokens. Apply the weight only in filter mode;
assignment form selects retain their existing typography. Reversible styling,
with no owner options, pagination or filtering behavior changes.

Owner filter arrow refinement (2026-11-05): use a leading foreground chevron
with existing 12px inset and 8px text gap, matching the other filter buttons.
Shared Select gains an optional filter presentation; form selects keep the
trailing muted arrow. Reversible styling only; keyboard-native selection stays.

## Final requested checks — 2026-11-06

Production build, lint, TypeScript and all twenty unit tests passed. Installed
Edge/Playwright checked http://localhost:3001 at 1440x1000 and 390x844 because
Browser plugin was unavailable. Shared header uses text baseline alignment;
mobile intentionally hides subtitle. Owner and Status computed text match at
14px/500; owner chevron leads text; no document horizontal overflow. Owner
Unassigned selection and clearing update URL on both viewports. Page identity,
meaningful content, screenshots and no page/console errors verified. No idea
records changed. Pencil rendering and other browser engines were not tested.

## 2026-11-06 — Fixed viewport dashboard

User approved a single-screen dashboard: keep brand header, title, navigation,
filters and pagination visible; scroll results internally. Replace the previous
sticky full-height workspace plus outer gap with a 100dvh flex shell. Use 16px
desktop/12px mobile workspace inset and 12px/8px gaps. Mobile view tabs use a
compact horizontal row; filters stay visible. At unusually short heights controls
remain reachable via a bounded control scroller. Pencil frames depict the fixed
viewport and result scroll boundary; canvas itself has no interactive scrolling.
This supersedes the earlier initial document-scroll design and is reversible.

Viewport change verified: desktop 1440x900 and mobile 390x844, board and list.
Document height equals viewport, window scroll remains zero, results scrollTop
advances, pagination stays visible (desktop bottom 875/mobile 831). No horizontal
document overflow or runtime/console errors. Owner selection/clear still works.
Lint, TypeScript, production build and all twenty tests pass. Pencil updated via
MCP: 76 content containers and 14 standalone viewport frames; desktop list/mobile
board screenshots reviewed. No database content or permissions changed.

## GitHub publication — requested 2026-11-06

User authorized Git commit/push. Initialize repository on main and include source,
SQL, docs, Pencil design and lockfile. Existing ignore rules exclude .env.local,
dependencies and build artifacts. Repository URL and commit author are required
because no Git repository/remote or author configuration exists here.

Git publication preparation: repository initialized on main; user selected public
remote https://github.com/nvnavishthi-droid/Ideontra.git and supplied commit author.
Staged files passed secret scan; only blank .env.example tracked, no .env.local,
node_modules or .next. Push verification follows the initial commit.

## Production deployment verified — 2026-11-06

User deployed GitHub main on Vercel at https://ideontra.vercel.app. Browser
verification passed actual demo Admin login, dashboard identity/content, desktop
1440x1000/mobile 390x844 header/filter typography, owner filtering/clearing via
URL, and no runtime/console errors. No idea records modified. Final sign-out
returns to /auth. Expected NEXT_PUBLIC_SITE_URL is https://ideontra.vercel.app;
Vercel/Supabase hosted configuration values were not directly inspected.
Production upload/workflow mutations and long-duration Realtime outage testing
were not rerun in this smoke check. Local full-flow evidence remains documented.

README publication update (2026-11-06): user requested GitHub README correction
and live link. Document deployed Vercel URL, current verification, removed demo
ideas, retained accounts and remaining fresh-install/walkthrough limitations.
Publish no credentials. Commit README and current project verification record.

## Query index audit — 2026-11-06 (verified)

User requested indexes based on query functions across all tables. Saved schema
review covers all ten public tables; existing indexes cover every foreign key,
idea search/filter fields and detail-history lookups. Two partial index candidates
are prepared in docs/database/query-indexes-draft.sql; rationale and coverage are
in docs/database/query-index-audit.md. MCP connection restored and locked project
identity verified. All foreign keys have index coverage and all ten tables retain
forced RLS. Applied query_driven_partial_indexes via MCP; saved server-assigned
migration 20261106071758 and updated snapshot. Both indexes valid/ready. Overdue
count uses the new index-only scan; tiny comment table still uses a sequential
scan. No speedup claimed. Existing duplicate followers index and informational
unused-index findings retained for separate review. RPCs, RLS and data unchanged.

## Responsive dashboard interactions — 2026-11-06 (verified locally)

Replace per-click full RSC navigation with URL history plus user-scoped TanStack
dashboard queries. A private GET /api/dashboard reads URL params on the server
through existing verified identity and RPC contracts. Initial rendering retains
server data. Controls highlight immediately; content skeletons cover uncached
results. Cache visited results for 60 seconds, preload the next page, cancel
obsolete browser fetches and preserve Back/Forward/deep links. Realtime/mutation
invalidation refresh queries without duplicate router.refresh calls. Confirm saves
after RPC success, refetch in the background. Admin reads run concurrently and
omit the unused all-ideas request. No database or authorization changes.

Deployment latency: configure the next Vercel build for Mumbai (bom1), colocated
with Supabase ap-south-1; current deployed function region is not inspected.
During QA disable development Server Function argument logging to keep login
credentials out of terminal output. These require no new packages.

QA: production build at http://127.0.0.1:3002, Edge/Playwright (Browser plugin
unavailable), desktop 1440x900/mobile 390x844. Selection 34ms, fresh result 391ms,
cached view 46ms, prefetched Next 51ms with no extra request on click. Verified
real 10-row server pages, Prev/Next, Back/Forward, rapid changes, delayed responses,
retry after an injected 503, visible pagination while loading, no viewport overflow,
unauthenticated 401 and Member role-spoof rejection. No app/runtime errors; one
expected 503 console entry in the injected failure test. No content writes tested
or performed. Build/TypeScript/lint and 25 unit tests pass; saved-write callback
timing tested with a pending-refetch unit stub. No commit, push or deploy performed;
live-site latency and Mumbai region remain unverified until redeployment.

## Shared skeleton loading — 2026-11-06

Extend the existing Skeleton primitive to match board cards, list rows, Admin
counts/panels, initial dashboard/authentication screens, idea details, owner
directories and private video lookup. Show skeletons only for missing initial
data; preserve content during cached/background refreshes and keep shared button
spinners for saves. Use existing tokens, bounded scroll areas, one accessible
loading region per surface and reduced-motion support. No artificial delay,
dependencies or backend changes. Position each loading region relatively so its
screen-reader announcement stays within the bounded scroll container on mobile.

QA: local development app on port 3001, Edge/Playwright (Browser plugin unavailable),
1440x900 desktop and 390x844 mobile. Delayed real reads verified board/list/Admin,
idea detail and owner skeletons; cached returns retain content. Verified visible
controls/pagination, no document overflow, reduced-motion animation disabled,
one accessible status per surface and no runtime/console errors. Initial route,
auth and video skeletons also rendered in isolation with the app stylesheet;
video reserves 16:9. No content writes or video uploads performed. Production
build, lint, TypeScript and all 25 unit tests pass. Not pushed or redeployed.

## Dashboard interaction corrections — 2026-11-06 (verified locally)

User approved whole-card/row opening, read-only card counts, removing the table
Action column, board/list/sort in every idea view, and all status columns. Admin
Overview stays a summary. Deleted parents and their replies are hidden with
matching database counts; no stored records are removed. Read RPC migration
20261106082337 applied to the locked project; existing grants/RLS unchanged. Specification and QA:
docs/dashboard-interactions.md. Supersedes older six-column/placeholder decisions.

## Release and Pencil sync — 2026-11-06
User authorized test.pen synchronization, GitHub push and Vercel production
redeployment completed. Live QA and release record: docs/release-2026-11-06.md.

## Idea AI chat — implementation 2026-11-06

Applied migration 20261106095150_private_idea_ai_chat via MCP to locked project
knmqlkhnfumeuxgnkuez. idea_chat_messages has forced RLS, caller-only reads gated
by current idea visibility and no direct writes. get_idea_chat uses keyset pages;
begin_idea_chat/finish_idea_chat validate session, visibility and a Vault-held
server secret. Writes are idempotent with per-user rate limits and leased retries.
Ask AI is implemented in idea details with private persisted history. Google
Flash-Lite is pinned with no fallback; activation requires an AI Studio API key
and explicit confirmation that its project has billing disabled. No Google key
was present during initial implementation. Verification is in progress.

Chat verification: build/lint/typecheck and 34 unit tests pass. Expanded rollback
SQL passes draft privacy, Admin cross-user isolation, direct-write denial, invalid
server secret, forged lease, concurrent requests, idempotent completion, failed
retry/hourly cap, older-page cursor isolation and missing identity. History now
uses INVOKER in migration 20261106095709_idea_chat_invoker_history.
Real desktop/mobile login and private-history GET passed. Browser reply/reopen
states used mocked provider responses; screenshots inspected at 1440x1000 and
390x844, with no page errors/overflow. Browser plugin unavailable, so existing
Playwright/Edge used. Temporary QA draft deleted; rollback SQL retained no data.
No live Google response was tested: GEMINI_API_KEY and free-tier confirmation
are absent. Configure hosting variables and redeploy before hosted availability.
No commit, push or deployment performed.
