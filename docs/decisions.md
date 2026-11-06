# Decisions

## 2026-11-04 — Framework setup

- Interpret TanStack as Query for server state plus Table, as specified in AGENTS.md.
- Use a minimal placeholder home page and system fonts so setup needs no external assets.
- Use a browser-stable QueryClient and separate server instances to avoid sharing request data.
- Set query stale time to 60 seconds to avoid immediate refetch after server hydration.
- Alternatives: add product screens or copy the original app; neither is requested.
- These setup choices are reversible; product scope and design remain pending.
- Provisional neutral light/dark tokens are confined to globals.css for the
  placeholder; replace them with the approved design system before product UI.
- Enable partial prefetching alongside Cache Components as recommended by the
  installed Next.js guide; explicitly root Turbopack here to avoid parent lockfiles.
- Use the supported Webpack flag for dev/build because Turbopack's CSS worker
  cannot bind its internal port in this environment, including on elevated retry.
  This is reversible by removing --webpack from the npm scripts.

## 2026-11-04 — Codex skill conversion

- Store both skills in project-local `.agents/skills/` for repository discovery,
  rather than installing globally or keeping Claude-specific skill paths.
- Preserve source references and the supplied Supabase changelog for provenance.
- Adapt MCP setup guidance and prioritize the locked-project, MCP-only migration
  workflow over the generic upstream local-database workflow.
- Treat Tailwind examples as references subordinate to approved project tokens,
  dependency choices, and the shared Icon component.
- Reversible: edit or remove these project-local skill directories; the original
  IdeaForge files remain unchanged.


## 2026-11-04 — FRD review and user clarification

- User decision: employee self-service signup is restricted to `@closefuture.io`.
  Enforce the exact domain on the backend as well as in form validation; signup
  does not grant Admin privileges. Email/password authentication remains required.
- User decision: implementation stays in the Ideontra folder. No separate product
  display-name or design approval was supplied by that folder instruction.
- User decision: the Supabase ref will be provided later; do not connect to an
  inferred project or perform Supabase writes before it is locked.
- Remaining behavior follows the FRD. Recommendations from the review are not
  automatically requirements when the FRD is silent. In particular, incomplete
  draft validation, the exact active Kanban column set, reevaluation score reset,
  review-queue membership, and deleting parent comments with replies are not
  settled by the source and must not be presented as FRD mandates.
- Confirmed by FRD: drafts are author-only (FR-2.3); anonymous authors are hidden
  from Members and visible to Admins (FR-2.5); the project anonymity rule protects
  identity throughout returned data. Allowed workflow transitions remain exactly
  those in Section 6.
- Documentation choice: preserve the supplied FRD as a text transcription in
  docs/scope/scope-final.md rather than copying assumptions from the other repo.
  The original PDF is unchanged. This transcription can be regenerated; future
  scope changes must be explicitly recorded.


## 2026-11-04 — User-supplied design template adaptation

- User direction: use the supplied Orbit design system as the project's visual
  template. Preserve its supplied light palette, type scale, spacing, and radii.
- Adaptation: use src/app/globals.css and Next.js App Router, shared Icon,
  ButtonLoader/PageLoader, and Pagination instead of Orbit-specific paths.
  Reason: preserve the visual template within this repository's existing stack.
  Alternative: copy the Orbit router/files; rejected because they are absent and
  do not match the project. This documentation mapping is reversible.
- Use the source's restrained CSS motion direction without installing Framer
  Motion or tw-animate-css in this task. The stack listing is not an installation
  requirement; no existing dependency or configuration changed.
- Map the ten FRD status labels to supplied semantic badge tones for consistent
  presentation; this creates no workflow permissions. Mapping is reversible and
  subject to screen review. Overdue remains an indicator, not a status.
- Keep missing dark/sidebar/chart token values explicit rather than inventing
  them. No theme switch, notification bell, chart library, or Orbit-only feature
  is added. The FRD's functional scope remains unchanged.
- Keep AGENTS.md's file limit and aim for the template's stricter 200-line UI
  target. The standalone to-do test.pen remains separate from product designs.


## 2026-11-04 — Dashboard-first Pencil design

- User direction: at most two pages, dashboard as main page, other workflows in
  popups, and success/failure feedback in popup boxes instead of toasts.
- Design mapping: authentication is the second page; login/signup are states.
  Board/list/My Ideas/admin overview share the dashboard. Detail tabs and action
  dialogs preserve its context. Artboards are state examples, not extra pages.
- Use supplied light core tokens with top navigation to avoid inventing missing
  sidebar/dark/chart values. Sample content is illustrative. These compositions
  are reversible during review; no backend or product code is changed.


## 2026-11-04 — Pencil board alignment

- Align filters to the search input bottom and match its 42px height. Reserve an
  equal two-line title area in the six sample cards so columns and card metadata
  align despite different title lengths. This corrects the user-marked layout;
  the alternative of moving only In Progress would leave content rows uneven.
  Reversible by editing the Pencil layout properties.

- Follow-up: reuse the same alignment properties in every repeated search/filter
  and desktop Kanban instance, including popup backgrounds, rather than fixing
  only the originally marked artboard. Other paired fields retain their content.

- Admin Overview follow-up: match both lower panels to the taller panel height,
  keeping content top-aligned. This avoids stretching internal row spacing;
  reversible through the panel height properties in test.pen.

- Edit Idea backdrop: match background layer dimensions to the containing
  artboard rather than changing its color. The white strip came from shorter
  layers; this preserves the existing overlay token and is reversible.

- Discussion actions use the existing 12px control-gap token and content-sized
  labels to satisfy the requested compact spacing. Alternative: smaller fixed
  widths; content sizing adapts to labels. Reversible in the Pencil action row.

## 2026-11-04 — FRD design completion

- Interpret requested Admin Review page as a dashboard view and review popup,
  preserving the user's two-page limit. A separate route was considered and
  rejected because the user requires workflows within dashboard context.
- Show the review queue with an explicit Submitted filter for the sample; this
  does not settle the still-unconfirmed complete queue membership. Other pending
  business decisions (draft validation, score resets, comment-parent deletion,
  exact active columns) remain open, without inventing behavior in designs.
- Add representative responsive/interaction states, rather than a separate
  artboard for every Cartesian combination. All changes are editable/reversible
  Pencil compositions; no application/backend behavior is implemented.

- Validation field rows align at the top so a field-specific error adds height
  below its control without shifting its neighbor. This uses existing layout
  patterns and is reversible in Pencil.

## 2026-11-04 — Pencil frontend implementation

- User requested conversion of test.pen to code and approved the listed UI
  dependencies. Implement frontend preview only while Supabase remains TBD.
  Live features require the planned backend phase; no backend writes are made.
- Use / for dashboard and /auth for authentication; dashboard view/tab/filter
  state lives in URL parameters, while action dialogs use local component state.
- Sample filtering/pagination runs exclusively in a server-only fixture adapter,
  with TanStack Table in manual mode. This is a temporary visual-preview data
  source, not the production API contract. It can be replaced by RPCs later.
- Member/Admin switching is labeled as preview mode and never represents real
  authorization. Anonymous fixture identity is redacted on the server before
  props are sent. Sample drafts remain limited to the sample author.
- Preserve the supplied light palette; keep a light-only active interface until
  dark tokens/contrast revisions are approved. Do not silently alter brand tokens.
- Non-title limits in frontend preview are provisional UX limits documented in
  form-field-limits.md, not DB-approved constraints. Persist nothing in this pass.
- Browser plugin is not available; use temporary Playwright tooling for visual
  and interaction verification. No test tooling is added to project dependencies.
- These implementation choices are reversible before production backend wiring.

- Match the Pencil board card shape: overdue remains visible in detail/admin
  views, avoiding an extra wrapping card badge that shifts footer alignment.
  Modal focus returns to the control that opened it, including nested feedback.

- Board columns stretch to the tallest column so their outside edges remain
  level when a server result contains different numbers of cards. Browser tab
  initials reuse the approved brand colors. Both are reversible visual details.

## 2026-11-04 — Dashboard scroll boundaries

- User direction: remove content below the marked results/pagination boundary;
  stop page scrolling at the dashboard heading and scroll results internally.
- Retain mandatory pagination and move the single clear-filters action inside
  the empty results box. Remove duplicated messaging, board hint and bottom
  preview footer; the header still labels the preview clearly.
- Use one viewport-height workspace after the normal brand header/initial gap.
  On small screens the controls may scroll independently, preventing them from
  consuming all result space. This is reversible CSS/layout behavior.
- Pencil has clipped static viewport frames, not live HTML scroll containers;
  record the behavior alongside updated native canvas frames.

## 2026-11-04 — Compact pagination

- Interpret the requested size 32 as a 32px control height; retain label-fitting
  widths. A 32px width would clip “25 per page” and “Previous”.
- Keep a native keyboard-accessible select over a content-sized label/chevron
  presentation so the arrow gap stays exactly 8px across 10/25/50/100 values.
  This avoids browser-dependent native select arrow spacing without new packages.
  These presentation changes are reversible in shared Pagination and Pencil.

## 2026-11-04 — Admin lower-panel scrolling

- Use one shared scroller for the two lower panels shown together in the user
  reference; keep the status-count grid outside it. This preserves their alignment.
- Move the visibility note into that same scroller so all content stays reachable.
  Alternative: scroll the entire overview (previous behavior). Reversible layout only;
  no data or page-scroll changes.

## 2026-11-05 — Idea metadata alignment

- Treat “rough draft” in the request as the screenshot’s Rough effort field.
  Stack Owner below it with the existing 8px spacing token; bold labels only.
  This replaces the two-column layout and is a reversible presentation change.

## 2026-11-05 — Match overview section typography

User refinement supersedes inline bold metadata: reuse the existing medium
heading, muted paragraph, 8px internal gap and 16px section gap. No new pattern
or data behavior is introduced; this presentation remains reversible.

## 2026-11-05 — Execution metadata gap

Use the existing 16px spacing token between content-sized Owner and Target
date items, replacing equal columns. Allow wrapping at narrow widths.
This reversible layout choice implements the requested smaller gap.

## 2026-11-05 — Calendar selector arrow spacing

Reuse the accessible native-select overlay pattern from pagination to maintain
an exact 8px label/chevron gap. Calendar header controls use 4px between boxes
to fit long month names. Reversible presentation; date behavior is unchanged.

## 2026-11-05 — Function-security implementation staging

- Retain DEFINER for validated RPC writes and sanitized aggregate/identity reads;
  converting those without relaxing table grants would break required flows.
- Prepare INVOKER role/ownership predicates and paginated orchestration; activate
  the Auth hook before switching is_admin, avoiding an Admin access interruption.
- Review/board RPC filters stay explicit instead of inventing unresolved queue
  membership or active statuses. This is a reversible API-contract choice.
- New RLS review is pending; previous approval covered only table/email additions.

## 2026-11-05 — Identity-safe read execution

Inspection found that raw ideas.owner_id can expose an anonymous author when
they also own the idea. Revoke raw ideas SELECT and use explicitly visibility-
checked DEFINER list/detail projections. Ownership/visibility helpers remain
INVOKER wrappers over those projections. This replaces the draft INVOKER list
proposal, which required grants exposing raw identifiers. The API still masks
identity and enforces server-side pagination.

## 2026-11-05 — Authentication sessions

Use server actions and SSR cookies for email/password authentication, with
request-scoped getUser/getClaims verification and no shared session cache.
Confirmation redirects use the configured application URL. Existing idea preview
flows remain separate from authentication; replacing them is a later task.
This reversible implementation avoids exposing session tokens in component props
or trusting the preview role query parameter.

## 2026-11-05 — Approved integration rules

User approved incomplete drafts (mandatory fields checked on submit), Submitted-
only oldest-first review queues, deletion placeholders preserving replies within
15 minutes, and retaining previous scores during reevaluation until updated.
Use the existing six active board columns; final states remain available in list
view. All reads/mutations use authenticated RPCs and database ownership flags.

## 2026-11-05 — Integration details and verification data

Use atomic INVOKER RPC wrappers for multi-step form submission, scoring/approval
and demo/completion so a failure rolls back all database changes. Use random
idea-scoped Storage filenames and five-minute signed playback URLs; existing
anonymity-safe visibility checks remain authoritative. All-ideas excludes drafts;
My Ideas includes author-only drafts. Owner filters use a sanitized paginated
directory, and Unassigned maps to a reserved zero UUID handled by the list RPC.

Temporary QA accounts and records are created solely for live testing and removed
when checks finish; existing employee passwords are never changed. The reusable
seed script takes a caller-supplied password rather than shipping a fixed Admin
password. It does not reset existing demo account passwords. These implementation
choices are reversible and add no new product scope.

## 2026-11-05 — Fresh-install deliverable

The database predates migration tracking. Preserve incremental upgrade files and
provide a separate data-free current schema snapshot under supabase/schema for
fresh installs, rather than pretending incremental migrations can bootstrap an
empty project. No second Supabase project is created or accessed. Fresh-install
execution remains an explicit verification limitation.

## 2026-11-05 — URL pagination bounds

Normalize non-finite page numbers to page 1 and clamp a now-out-of-range page to
the last available server page after deletions/filter changes. The RPC is called
again for that page; no browser-side filtering/pagination is introduced. This
reversible defensive behavior prevents empty stale page views after mutations.

## 2026-11-05 — Runtime minimum

The approved installed Supabase SDK version declares Node >=22. Record Node 22+
in package engines and setup documentation, replacing the earlier framework-only
Node 20.9 minimum. No dependency version is changed by this metadata update.

## 2026-11-05 — No signup confirmation email

User explicitly removed signup email confirmation. Employee signup should issue
an authenticated session immediately; retain exact-domain validation and Member
roles. Remove confirmation links/callbacks and email instructions from the app.
Hosted Email provider Confirm Email must be disabled in the dashboard because
available MCP tools cannot update that setting. Do not bypass Auth with privileged
keys or database auto-confirm triggers. Existing unconfirmed accounts are not
silently modified. This supersedes the earlier email-confirmation acceptance item.

## 2026-11-05 — Isolated installation verification

User approved completion of the proposed temporary branch test. Scope the
exception to AGENTS.md §5 to the disposable branch of the locked project only.
Install the snapshot on empty application schemas, test seed/security, delete
the branch; never merge or reset main. Branch creation may incur usage charges.

## 2026-11-05 — Quiet Realtime recovery

User requested silent reconnects and one popup only for sustained unavailability.
Use a 30-second grace period across all private channels; report once per outage,
reset only when every channel recovers. Retain SDK reconnect behavior, retry failed
Auth setup after five seconds, and cancel timers/callbacks on cleanup. Reuse the
existing feedback dialog. Timing is a reversible implementation choice; immediate
per-channel popups were rejected because they interrupt forms during brief outages.

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

## 2026-11-06 — Fixed viewport dashboard

User approved a single-screen dashboard: keep brand header, title, navigation,
filters and pagination visible; scroll results internally. Replace the previous
sticky full-height workspace plus outer gap with a 100dvh flex shell. Use 16px
desktop/12px mobile workspace inset and 12px/8px gaps. Mobile view tabs use a
compact horizontal row; filters stay visible. At unusually short heights controls
remain reachable via a bounded control scroller. Pencil frames depict the fixed
viewport and result scroll boundary; canvas itself has no interactive scrolling.
This supersedes the earlier initial document-scroll design and is reversible.

## 2026-11-06 — Query-driven partial indexes

Add partial indexes for undeleted comment counts and In Progress target dates,
matching get_idea_summary/get_admin_dashboard predicates. Retain all existing FK,
search and ordering indexes; indexing every column would duplicate coverage.
Small current tables do not establish a measurable speedup; these support growing
counts with narrower indexes. Reversible by dropping only the two added indexes.
Supabase CLI is absent: save the MCP-assigned migration version after application
instead of inventing a timestamp or installing a new tool. No query/RLS changes.

## 2026-11-06 — Immediate dashboard control feedback

Use supported native History API navigation and a private GET data endpoint,
retaining existing server identity checks and database filtering. TanStack caches
normalized user/role/URL query keys for 60 seconds; preload only the next result
page, and invalidate after writes/Broadcast events. Uncached selections show a
skeleton rather than old rows under new filters. This avoids repeated RSC work
and serialized server actions while preserving deep links and manual tables.
Do not weaken authentication or optimistically confirm writes. Reversible through
the shared navigation/data layer; no dependencies or database changes required.

Pin Vercel Functions to bom1 for database proximity, rather than relying on the
platform default region. This is reversible in vercel.json and takes effect on
redeployment; no production latency improvement is claimed before that test.
Reference: https://vercel.com/docs/regions (bom1 maps to ap-south-1/Mumbai).
Disable Next.js development Server Function argument logging, which otherwise
prints authentication inputs during QA. Request timing logs remain available.

## 2026-11-06 — Skeleton loading coverage

Replace generic missing-data spinners with shared silhouettes matching each
existing surface. Initial dashboard uses the default board silhouette until URL
data resolves; auth uses a form silhouette. Owner loading replaces only the
40px control, preventing extra vertical space. Preserve cached data and mutation
button spinners. Use no timers or new animation dependencies; reversible shared
presentation changes. Existing workflow, RLS and request timing are unchanged.

## 2026-11-06 — Dashboard interaction corrections

User requests whole-card/row details, read-only card vote/comment counts, no table
Action column, board/list/sort for all idea views, all statuses and hidden deleted
threads including replies. Vote/Follow in details stay functional; Admin Overview
keeps its summary. Use a stretched native card button with an independent overflow
menu, and keyboard-focusable table rows. Show nine public columns and include Draft
in My Ideas; existing database author-only visibility still governs drafts. Preserve
server paging/filtering. Review defaults oldest-first but explicit sorts round-trip
to the RPC. Hide deleted branches in detail projections and summary counts, keeping
tombstones/audit records. These reversible presentation/read-contract choices avoid
hard deletion, client filtering and fake controls; supersede prior placeholders and
six active columns. Details: docs/dashboard-interactions.md.
