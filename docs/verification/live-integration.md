# Live integration verification — 2026-11-05

Target: knmqlkhnfumeuxgnkuez only. Browser plugin is unavailable; verification
uses temporary Playwright scripts with the installed Microsoft Edge browser.
Test accounts/records are disposable; original employee passwords are unchanged.

## Passed

- Production build, ESLint, TypeScript and 17 unit tests.
- Four rollback-only SQL suites: function-security, identity-and-workflow-security,
  auth-and-grant-security and live-integration.
- Real Member, Admin and Owner sign-in; Auth-issued JWT role hook output.
- Browser sign-in, persisted incomplete draft, My Ideas and sign-out.
- Anonymous redirects and signed-in Member rejection of forged Admin URL state.
- Admin overview/review queue and mobile submission dialog at 390×844 without
  document overflow. Screenshots: admin-review.png and mobile-submit.png.
- Incomplete draft saving, submit completeness gate, Admin rejection of another
  author's draft, author editing and submission/resubmission.
- Anonymous author identifiers absent from a Member detail response.
- Own-vote/duplicate-vote denial, vote removal and following persistence.
- Comment depth limit, replies retained beneath deleted placeholders, deleted
  comment edits rejected, ownership/time-window rules covered by SQL regression.
- Required reasons, review restrictions, approval score gates, quadrant values,
  owner/date assignment, progress updates, final-state transition denial.
- Actual private WebM upload, unassigned Member upload denial, atomic completion,
  authorized signed download and byte-length verification.
- Supported external video URL completion and paginated database search.
- Private Broadcast author event received; Member cannot join Admin or another
  user's channel. Payload contains only idea ID/event plus Supabase transport ID.
- Seed script dry-run rolled back, then applied with explicit user approval.
  Four dedicated demo accounts and two ideas per status verified. Demo Admin and
  Member passwords verified through real Auth without printing credentials.

## Corrected during verification

- Legacy vote-summary SELECT FOR UPDATE broke STABLE read-only list execution;
  replaced with a non-locking, visibility-checked aggregate.
- Realtime employee policy now explicitly includes Member and Admin roles.
- All-ideas excludes private drafts; Unassigned owner filtering is database-side.
- Supported demo URL regex and active comment counts corrected.
- Server clients explicitly await connection(); browser directory queries wait
  for browser hydration to avoid session initialization during prerendering.

## External/manual acceptance remaining

- Signup confirmation email was removed by user direction. Fresh signup without
  an email link passed; no email-delivery acceptance remains.
- Fresh empty-database snapshot installation has not been exercised on another
  database: only the locked shared project is authorized. Snapshot is data-free
  and generated from verified current catalogs; seed was tested transactionally.
- Production hosting, final public URL/redirects, Git publication and walkthrough
  publication require the user's chosen destinations and explicit publish action.
- Hosted leaked-password protection remains disabled (plan-dependent).

The local walkthrough is an actual UI overview; the SQL/API evidence above also
covers forbidden operations that are intentionally unavailable as UI buttons.

QA cleanup completed: one test Storage object, all disposable QA ideas/audits,
sessions and three test accounts removed. The temporary cleanup policy was dropped.
The four explicitly approved demo accounts and their sample ideas are retained.

All nine non-draft status lists and four My Ideas tabs render against real data.
The seed's second run was tested in a rollback transaction and produced no
additional seeded records. Temporary credential/session files were removed.

A final rendered sweep verified every non-draft status list, all My Ideas tabs
and the seeded Done execution/detail view. No legacy null-link crash remains.

Local captioned UI walkthrough: walkthrough.webm, 357 seconds. It records actual
rendered screens and persisted draft creation, with sign-in credentials omitted.

Final full UI flow passed through real forms: complete submission → start
evaluation → Impact/Effort → atomic approval → Owner/date assignment → In Progress
→ Owner progress update → supported demo link/outcome → Done → persisted Member
execution view. Duplicate owner IDs discovered during this test were corrected.
Real demo Admin/Member token refresh also passes. Disposable UI-flow ideas and
walkthrough-created drafts were removed; the original twenty seeded ideas remain.
Recorded walkthrough WebM decodes successfully and has a checked poster frame.

## Advisor context

RPC-only tables intentionally deny raw access without policies; protected
DEFINER RPCs are required to perform validated writes and sanitized reads.
These expected advisor notices are documented, rather than disabling RLS or
exposing raw rows to silence them. See [RPC privilege guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
and [deny-all RLS guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

A pre-existing duplicate follower index remains; it does not block behavior.
[Duplicate index guidance](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index).
Unused-index notices are expected on this small dataset; required FK/filter/order
indexes are retained. [Index guidance](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Final inventory confirms ten public tables with forced RLS, four approved demo
accounts, zero temporary QA users and zero temporary cleanup policies.

Hosted leaked-password protection remains disabled. See [Supabase password
protection settings](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Final production build, lint, typecheck and all 17 unit tests pass after the owner
control fix. No Git commit, push, deployment or external video upload was made.

Signup acceptance update (2026-11-05): the user removed confirmation email.
Earlier email-delivery/link test requirements are superseded; immediate signup
session verification passed after hosted Confirm Email was disabled (2026-11-05).

No-confirmation signup verification (2026-11-05): hosted mailer_autoconfirm=true;
fresh browser signup entered the dashboard immediately, issued Member access,
and passed sign-out and password sign-in. Database confirmed automatic email
confirmation and member profile. Disposable account removed. Typecheck, all 17
unit tests and production build passed; obsolete confirmation routes are absent.
