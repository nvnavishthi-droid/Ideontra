# Historical project log — superseded by docs/project.md

# Project state

## Framework setup

Requested: Next.js 16 App Router with strict TypeScript and Cache Components,
Tailwind CSS v4 via PostCSS, and TanStack Query v5 through a shared provider.
Use npm. Include TanStack Table for future server-controlled tables.
No backend or product features are included in this setup.

The supplied FRD is now recorded in docs/scope/scope-final.md. The user-supplied design template is adapted in docs/design-system.md.
Product screen compositions still require the Pencil design/review phase. Agent
role definitions have not been supplied here.

Implemented: root layout, placeholder home route, global Tailwind import,
light/dark neutral tokens, QueryProvider, isolated query-client factory,
strict TypeScript, ESLint, and npm development/build/check scripts.

Validation: production build, ESLint, and TypeScript checks pass. Generated CSS
contains the home page's Tailwind utilities. Dev/build use Webpack because this
environment blocks Turbopack worker ports. npm audit reports 16 moderate
advisories in the development lint dependency chain (minimatch); no forced
major-version downgrades were applied.

## Project-local Codex skills

Requested: adapt the supplied Supabase and Tailwind design-system skills into
`.agents/skills/`, preserve their supporting references, add Codex UI metadata,
and update AGENTS.md to use those paths. This installs instructions only;
it does not connect Supabase or authorize database changes.

Installed both adapted skills with Codex UI metadata; AGENTS.md now references
the project-local paths. Both pass the skill-creator validator, their UI YAML
parses correctly, and all local Markdown links resolve. Source files are unchanged.


## FRD scope — reviewed 2026-11-04

The eight-page FRD and workflow diagram have been reviewed. Functional product
features are not implemented yet. Required areas are authentication and roles,
idea submission/drafts/anonymity, editing and withdrawal, voting, comments and
following, controlled status transitions/history, admin evaluation, ownership and
progress updates, overdue status, demo video completion, board/list/detail/My Ideas,
and the admin dashboard. SQL migrations, seed data, a complete README, and a
walkthrough video are required deliverables.

Employee self-service signup must accept only `@closefuture.io` addresses.
The project stays in Ideontra. Supabase ref is pending; no database changes are
authorized until that target is locked. Notifications, Slack/Jira, native mobile
apps, and analytics beyond the listed views remain out of scope.

See docs/scope/scope-final.md for the FRD transcription and user clarifications,
and docs/decisions.md for the distinction between confirmed requirements and
recommendations the FRD does not settle. No product implementation was performed
as part of this scope review.


## Design template — reviewed 2026-11-04

Adapted the supplied Orbit DESIGN_SYSTEM.md into docs/design-system.md for the
FRD application: white/green semantic palette, Inter typography, compact shadcn
controls, thin borders, shared status tones, forms, feedback, and responsive
screen patterns. Source-specific router and component paths were translated to
Next.js and the project's shared Icon/loader/pagination conventions.

This is documentation only. Product screens and theme code are not implemented.
The supplied file omits exact dark/sidebar/chart values and its referenced
mockups/screens; those are not represented as available or approved assets.


## Pencil product design — planned 2026-11-04

Create the FRD product design in test.pen using the supplied white/green system.
Represent authentication, dashboard variants, role-specific workflows, details,
forms, feedback popups, and mobile states. Two application pages only; all other
artboards are dashboard states/dialogs. Designs remain pending user review.


Pencil design completed for review: test.pen contains 27 editable design states
covering the two-page architecture, dashboard views, FRD dialogs, feedback, and
mobile layouts. See docs/design-handoff.md for the canvas index, interaction
contract, verification, and remaining review items. Pencil reported zero clipped
nodes; primary desktop, admin, and mobile form states were visually inspected.
The designs are static and pending user approval; no app/backend implementation
was included.


## Pencil alignment correction — 2026-11-04

Correct the Member dashboard board in test.pen: align search and filter control
edges and keep all six column/card edges level, including the shorter In Progress
title. Preserve the existing content, tokens, and two-page architecture.

Alignment follow-up: apply the same correction throughout all 27 Pencil states,
including List and dialog dashboard backgrounds; inspect other box rows as well.

Completed the alignment follow-up across 23 search/filter rows and 20 desktop
boards. Admin panels now align at the top; paired form fields and status cards
already have matching edges. Geometry verification and clipping checks passed.

Admin Overview correction: match the category and review/overdue panel heights
so both top and bottom borders form straight lines. Preserve interior content.

Rechecked every repeated desktop dashboard, including popup backgrounds: all
21 horizontal search/filter rows and 20 Kanban boards use the corrected layout.
Both mobile dashboards retain stacked filter rows. No alignment/clipping issues
were reported by the geometry check.

Edit Idea backdrop correction: extend its dashboard surface and existing dimmed
backdrop to the full artboard height to remove the exposed bottom white strip.

Discussion action spacing: group Reply, Edit, and Delete at the left with a
12px gap and content-sized labels instead of equal-width stretched text boxes.

Mobile dashboard cleanup: remove the user-marked sample-count text beside
Board/List/Newest in both mobile dashboard instances; retain the view controls.

Authentication copy correction: remove the email-domain guidance sentence from
both sign-in and employee signup Pencil states, as requested. The exact
closefuture.io signup restriction remains a functional requirement.

## FRD design coverage audit — 2026-11-04

Audited all 27 Pencil artboards against the original eight-page FRD and locked
scope. Main feature areas are represented, but design coverage is partial;
missing states/actions and content inconsistencies are recorded in
[design-frd-audit.md](design-frd-audit.md). No design, application, or database
changes were made during the audit. This supersedes any interpretation that
the earlier design handoff established full FRD completeness.

## FRD design completion — planned 2026-11-04

Extend test.pen with Admin Review queue/detail, overdue list, author/role/status
actions, remaining My Ideas tabs, engagement/comment states, filters/sorts,
validation/upload/loading examples and mobile equivalents. Correct audit sample
inconsistencies first. Remain within authentication + dashboard pages.

FRD design completion delivered: 52 additional states (79 total), including Admin
Review queue/detail and mobile variants. Existing sample copy was corrected.
See [design-completion.md](design-completion.md) for the coverage/index and
remaining scope, accessibility and implementation limitations. No app/backend
implementation was included.

Approval-blocked alignment correction: top-align the Impact/Effort field groups
so inline Effort validation does not offset the two input boxes.

Calendar design correction: replace artboard 68’s abbreviated date preview with
a complete month grid, month/year selectors, previous/next month controls and
a selected-day summary. This remains a static Pencil control design.

## Pencil-to-code frontend — planned 2026-11-04

Implement the approved light Pencil compositions as a responsive frontend in
src/: dashboard board/list/My Ideas/Admin Overview/Review/Overdue and popup
submission, details, comments, evaluation, ownership, progress, completion,
confirmation and feedback. Authentication is the second route (/auth).

This is an explicitly labeled design preview using server-only sample records.
No database schema exists and the Supabase target is TBD. No Auth sessions,
Supabase writes, real uploads, persistence or Realtime are implemented here.
Mutation submissions retain input and explain the backend dependency; they must
not claim a real successful save. Local engagement toggles demonstrate selected
states only. Filters/sorts/pagination run on the server using URL parameters;
replace the fixture adapter with paginated RPCs in the backend phase.

User approved installing the approved UI packages. Use Radix-based shadcn
primitives, shared Icon, RHF/Zod forms and date-fns. No Redux, extra pages,
notifications or other off-scope features.

### Implemented frontend conversion

The Pencil design is now represented in reusable components under src/components
and two routes: dashboard / and authentication /auth. Member and Admin preview
views include board/list/My Ideas/Admin Overview/Review/Overdue. Forms/dialogs
cover idea fields, details/discussion/history/execution, evaluation and reasons,
assignment, month/year/day calendar, progress, demo selection, confirmations and
feedback. The account menu exposes clearly labeled preview personas.

Tokens match the supplied light design; Inter fonts are served locally with their
license. UI libraries were installed with user approval; generated primitives
were adapted to the shared Icon and project dimensions. No live Supabase
integration was attempted and test.pen remains unchanged by code conversion.

URL-driven lists are rendered through a server-only sample adapter and manual
TanStack Table. This preview-only adapter is the documented exception while the
project ref is pending; production must replace it with paginated Supabase RPCs.
Client engagement toggles demonstrate visual states only. Mutations/auth/upload
never claim success and preserve form values behind backend-dependency feedback.
All such actions require the subsequent Supabase phase.

Verification: lint, TypeScript/production build and eight utility/API-adapter unit
tests pass. Browser validation uses temporary Playwright with installed Edge
because the Browser plugin is unavailable and downloadable Chromium does not
support this macOS version. Desktop 1440×960 and mobile 390×844 flows were checked;
see the latest task summary for the completed browser result. No database/security
acceptance tests apply to this frontend-only pass. Scope questions and dark-token/
contrast decisions listed in design-completion.md remain open before production.

Final production browser run: all 15 interaction/visual checks passed, with no
console warnings/errors. This includes calendar month/year/day selection,
Member/Admin views, server filtering, retained form data and mobile scrolling.
Anonymous sample-author masking also applies to the Member discussion reply.

An additional focused browser check passed for anonymous discussion-author
masking and keyboard focus returning to the card that opened the dialog.

## Dashboard scroll correction — planned 2026-11-04

Remove the duplicate no-results block and preview footer below pagination.
Keep a single empty message and clear-filter action inside the results box.
The page may scroll past the brand header and initial spacing only; stop when
the dashboard heading reaches the viewport top. Keep heading/navigation/filters
and pagination visible while table rows or board content scroll internally.
Use the same bounded results layout for My Ideas, Review and Overdue. Apply
corresponding clipped content viewports to Pencil dashboard instances.

Dashboard scroll correction implemented: shared bounded results for board, list,
My Ideas, Review and Overdue; sticky table headings and persistent pagination.
Document scrolling ends at the dashboard heading. Removed the redundant bottom
empty-state block, board hint and preview footer. One clear-filter action remains
inside an empty results box. Updated 70 Pencil dashboard instances and added
artboard 80 for the matching empty list. No backend/data-model changes.

Scroll correction verification passed at 1440×900, 390×844 and 390×568:
heading stops at y=0, document scroll cannot continue, result scrollTop changes,
and pagination stays in view. Empty results show one message; Clear filters resets
the URL and search field. Popups still scroll/close correctly; no browser runtime
errors. Production build, lint and the eight existing unit tests pass. Pencil
viewports and pagination order were visually checked; static clipping verification
reported no unintended clipping.

Pagination refinement — 2026-11-04: reduce the shared page-size/Previous/Next
controls to 32px high and keep the selector chevron 8px from its text. Mirror
this in every Pencil pagination instance. No paging/query behavior changes.

Compact pagination completed across the shared code component and 74 Pencil
instances. Browser checks confirm all three controls are 32px high, the arrow
gap is 8px, page-size URL navigation works, and the controls fit mobile widths.
Lint and TypeScript checks pass; no browser runtime errors were observed.

Admin overview scroll refinement — 2026-11-04: keep status count cards fixed;
only the lower category and review/overdue panel group scrolls within remaining
workspace height. Preserve the existing document scroll boundary.

Implemented and verified at desktop heights 800px and 650px. When lower panels
overflow, their scroll position changes while the status grid and document scroll
position remain fixed. ESLint and TypeScript checks pass; no runtime errors.
Browser plugin unavailable; verified with temporary Playwright/Edge tooling.

Idea overview metadata correction — 2026-11-05: stack Owner directly below
Rough effort, using an 8px gap and bold labels with regular-weight values.
Apply in the shared idea overview and matching Pencil detail states.

Metadata correction completed in shared IdeaDetail and desktop/mobile Pencil
overview attributes. Browser checks confirm bold labels, matching left edges and
an 8px gap at desktop/mobile widths; no runtime errors. Lint, TypeScript and
Pencil layout checks pass.

2026-11-05 refinement: render Rough effort and Owner using the same heading/
muted-value sections as Problem and Expected impact, in code and Pencil.
This supersedes the compact inline bold-label presentation above.

Refinement verified: all six overview sections share the same heading weight,
muted value color and 8px internal gap. Pencil desktop/mobile layout checks and
TypeScript pass; browser reported no runtime errors.

2026-11-05 wording correction: rename “Edit and resubmit” to “Update and
resubmit” throughout code and Pencil. Workflow behavior is unchanged.

2026-11-05 Execution spacing correction: replace equal-width metadata columns
with content-sized Owner and Target date items separated by 16px, wrapping on
narrow screens. Mirror the spacing in Pencil.

2026-11-05 capitalization: use “Update and Resubmit” in code and Pencil.

2026-11-05 Execution labels: use semibold Owner and Target date labels with
regular values; retain the compact 16px gap in code and Pencil.

2026-11-05 Calendar refinement: content-sized month/year selectors with an
8px text-to-chevron gap, preserving native select keyboard interaction.

2026-11-05 Score display refinement: semibold Impact: and Effort: labels on
one line, with semibold Quadrant: and its value on the next line. Apply to
both overview and execution score summaries.

2026-11-05 Score label refinement: use medium weight (500) instead of
semibold for Impact, Effort and Quadrant labels in both detail tabs.

## Supabase inventory — 2026-11-05

User supplied target URL: https://knmqlkhnfumeuxgnkuez.supabase.co/rest/v1/.
MCP verified project CloseFuture, ref knmqlkhnfumeuxgnkuez, ap-south-1,
ACTIVE_HEALTHY, PostgreSQL 17. AGENTS.md target identity is now recorded.
Read-only inspection found nine public tables, all with RLS enabled:
profiles (5 rows), ideas (14), idea_private_details (14), idea_votes (3),
idea_comments (1), idea_followers (3), idea_status_history (33),
idea_owner_history (3), idea_progress_updates (1). Counts are inspection snapshots.

22 public functions exist, including create/update/submit/delete-draft,
transition/evaluate/reassign, voting, comments, following, progress and demo RPCs.
The remote migration list is empty. This is an inventory, not a security or
