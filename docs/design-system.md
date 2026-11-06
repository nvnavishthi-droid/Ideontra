# Ideas & Innovation Board — Design System

Adapted on 2026-11-04 from the user-supplied
`/Users/navishthinv/Downloads/DESIGN_SYSTEM.md` (Orbit Design System & UI Rules).
This is the visual reference for the project in the Ideontra folder.
Functional requirements remain in [scope-final.md](scope/scope-final.md).
This document specifies the design; it does not claim components are implemented.

## 1. Visual direction

- Use white working surfaces, readable near-black green text, fresh green primary
  actions, thin borders, compact controls, and generous separation between sections.
- Keep the interface quiet. Avoid decorative gradients, large shadows, excessive
  rounding, unrelated illustrations, and unnecessary nested cards.
- Use semantic design tokens for every color. No palette classes such as
  `bg-green-500`, or raw hex/HSL values in component styles.
- Use one dominant green action per view. Keep secondary actions visually quieter.
- Preserve the template's visual language across desktop and mobile.

## 2. Theme location and tokens

The implementation source will be `src/app/globals.css`, using Tailwind v4
CSS-first configuration. Do not create `tailwind.config.ts` or `src/index.css`.
The existing neutral starter theme is provisional and does not implement this palette.

Store HSL channel values in CSS variables and expose semantic Tailwind colors:

```css
/* Example registration; the complete theme is implemented during UI setup. */
:root {
  --primary: 93 54% 40%;
}
@theme inline {
  --color-primary: hsl(var(--primary));
}
```

### Supplied light-theme palette

| Token | HSL channels | Purpose |
|---|---|---|
| background | 0 0% 100% | Page background |
| foreground | 91 100% 6% | Default text |
| card | 0 0% 100% | Panels, cards, tables, header |
| card-foreground | 210 25% 8% | Text on cards |
| popover | 0 0% 100% | Floating menus |
| popover-foreground | 83 17% 31% | Text in menus |
| primary | 93 54% 40% | Main action and selected state |
| primary-foreground | 87 69% 95% | Text on the primary action |
| secondary | 87 69% 95% | Secondary action surface |
| secondary-foreground | 93 54% 40% | Text on secondary surface |
| muted | 87 69% 95% | Quiet fills and disabled regions |
| muted-foreground | 83 10% 43% | Supporting text and timestamps |
| accent | 87 69% 95% | Ghost/outline hover surface |
| accent-foreground | 91 100% 6% | Text on accent surface |
| destructive | 356 91% 54% | Destructive actions and errors |
| border | 88 48% 90% | Surface boundaries |
| input | 88 38% 85% | Input boundaries |
| ring | 88 86% 64% | Focus indication |
| success / success-foreground | 142 71% 45% / 0 0% 100% | Success feedback |
| warning / warning-foreground | 45 93% 47% / 0 0% 100% | Attention state |
| link / link-hover | 217 91% 60% / 217 91% 50% | Inline hyperlinks |

Use opacity tints from existing tokens: `bg-primary/10`, `bg-destructive/10`,
`bg-warning/15`, `bg-link/15`, and `border-primary/30`.

The source names neutral sidebar tokens and a green `chart-1` through `chart-5`
ramp but does not supply their exact values. Do not invent or claim those values
are approved. Document their values before implementing those surfaces.
Orbit whiteboard `board-*` tokens and user-defined ticket tag colors are unrelated
to this application's Kanban and categories and are not imported.

The source describes light-only product presentation with dark tokens prepared.
AGENTS.md also requires light/dark tokens. Retain that theme capability, but do not
invent the missing dark palette or add a theme switch as a feature. Obtain the
missing values before finalizing dark-mode design. Prefer semantic tokens over
per-component `dark:` overrides.

## 3. Typography

| Role | Font or utility |
|---|---|
| Default UI | Inter, `font-sans`, `text-sm` |
| Codes and IDs when needed | Space Mono, `font-mono` |
| Page title | `text-2xl font-semibold` |
| Shell, section, and dialog headings | `text-lg font-semibold` |
| Dashboard count | `text-xl font-semibold` |
| Badges, timestamps, metadata | `text-xs` |
| Labels and primary table text | `font-medium` |
| Supporting copy | `text-muted-foreground` |

Do not use Lora for application UI or bold body text. Explicitly size CardTitle
with `text-lg`; inspect the installed primitive instead of assuming its default.
Fonts are design requirements; their loading is configured during implementation.

## 4. Layout, spacing, shape, and motion

- Use a 4px spacing scale. Section spacing: 24px (`space-y-6`).
- Panel padding: 16px or 24px. Control gaps: 8px or 12px. Card grid gaps: 12px or 16px.
- Base radius: 6px. Register radius tokens so `rounded-lg` is 6px,
  `rounded-md` is 4px, and `rounded-sm` is 2px. Use full rounding for pills/avatars.
- Avoid `rounded-xl` and `rounded-2xl` on product surfaces.
- Separate surfaces with `border border-border bg-card`. Keep shadows minimal;
  reserve larger shadows for floating overlays.
- Container maximum width: 1400px; desktop horizontal padding: 32px.
  Reduce padding on small screens to preserve usable content width.
- Content area: `flex-1 p-6 bg-background`, adapted for small screens.
- Page header: wrapping title/subtitle group and action, using
  `flex flex-wrap items-start justify-between gap-3`.
- Use 64px admin headers and 56px member headers as supplied shell proportions.
  Share shell components; individual pages must not duplicate navigation chrome.
- Stack forms and detail sections on mobile. Keep controls usable without page-wide
  overflow; tables/boards may use their own intentional horizontal scrolling.
- Dialog widths: `sm:max-w-md` for confirms, `sm:max-w-lg` or `sm:max-w-2xl`
  for richer forms, and up to `max-w-4xl` for large viewers.
- Use subtle 150–200ms transitions. The source prefers CSS/shadcn animation and
  says not to add a JS animation library. Use that motion style; the existing
  AGENTS.md stack listing Framer Motion does not require installing it for this task.
- Respect reduced-motion preferences, including shared invalid-field animation.

## 5. Shared component patterns

Use shadcn primitives for Button, Badge, Dialog, Table, Tabs, Select, Input,
Textarea, Popover, Calendar, and Skeleton. These are planned components, not
existing files to assume are available. Add them during implementation as needed.
Do not change a shared primitive solely to satisfy one feature; prefer its props.

| Component | Project pattern |
|---|---|
| Button | Green default for main action; outline/ghost/secondary for others; destructive for delete/reject confirmation |
| Button dimensions | Default 40px high, small 36px high, icon button 40px square |
| Icons | Lucide through the shared `src/components/icons/Icon.tsx` only; 16px normally, 20px in headers, up to 32px in empty states |
| Pending action | Shared ButtonLoader in a disabled button; preserve width and an accessible action label |
| Status | Shared StatusBadge with positive, warning, negative, info, neutral, and empty tones |
| Table | Bordered card surface, readable text alignment, centered short counts/status, empty state inside the table |
| Pagination | Shared Pagination component; URL-driven server pagination/filter/sort and manual TanStack Table mode |
| Stat card | Thin border, compact padding, muted label, semibold count; responsive grid |
| Tabs | Tabs on left, related actions on right, wrapping on mobile; content separated by 16px |
| Dialog | Title and description, body, then Cancel outline action before the main action |
| Date field | Shared Calendar/Popover field, dates formatted with date-fns |
| Error/success | Shared feedback popup dialogs through central helpers; no toast messages |

The source's TablePager, StatusBadge, ConfirmDialog, and helper paths belong to
Orbit. Create project equivalents and reuse them; do not import nonexistent files.
No new dependency installation is part of this documentation task.

### Status tone mapping for the FRD

This mapping is a visual adaptation of the supplied tone vocabulary, not a new
workflow rule. Labels must always accompany color.

| Tone | Status labels |
|---|---|
| neutral | Draft, Withdrawn |
| warning | Submitted, Needs More Info, Parked |
| info | Under Evaluation, In Progress |
| positive | Approved, Done |
| negative | Rejected |

Overdue is an additional warning indicator on qualifying In Progress ideas;
it is not an eleventh status. Quadrant labels remain Quick Win, Big Bet, Fill-in,
and Not Worth It; color must not imply that a quadrant approves/rejects an idea.

## 6. Forms and feedback

- Use React Hook Form and Zod for UX; database rules remain authoritative.
- Place labels above fields and shared inline errors below their fields. Scroll
  and focus the first invalid field on submission; use shared invalid animation.
- Use the shared input filters where applicable. Email fields must permit valid
  email characters; the signup domain is exactly `closefuture.io`.
- Title maximum: 100 characters. Other persisted field limits must be documented
  in `docs/form-field-limits.md`, shared in code, and matched by DB constraints;
  the template does not supply those remaining limits.
- Reset dialog form state on close. Prevent closing during an active save and
  provide visible pending feedback.
- Use a confirm dialog for destructive actions. Rejected, Parked, and Needs More
  Info transitions require a reason field; confirmation cannot bypass FRD rules.
- Use shared PageLoader for route loading and content-shaped Skeletons for lists,
  cards, tables, and Kanban columns. Avoid page-specific spinners.
- Empty states use one concise message and a relevant permitted action if useful.
- Preserve entered data on failure. Show actionable feedback without raw backend
  details, and never silently swallow errors.
- Verify keyboard navigation, visible focus, labels, accessible names, and actual
  foreground/background contrast. Some supplied bright token pairs need contrast
  validation before use for small text; do not silently substitute brand colors.

## 7. Screen mapping to the FRD

| Screen or surface | Apply the template to |
|---|---|
| Login and employee signup | Focused form, clear labels/errors, domain guidance, one main action |
| Ideas board/list | Shared shell, page header, submit action, board/list control, search and FRD filters |
| Kanban | Quiet columns, restrained idea cards, title/category/status and vote/comment counts; authorized transitions only |
| List | Bordered table, server sort/filter/page controls, meaningful empty/loading states |
| Create/edit idea | Required FRD fields, optional rough effort/links/anonymity, clear draft and submit actions |
| Idea detail | Readable content sections, votes/follow, comments/replies, scores/quadrant, ownership, updates, demo, and history |
| My Ideas | Drafts, My Submissions, Owned by me, Following tabs using the same list patterns |
| Evaluation actions | Admin-only scoring fields and authorized transition dialogs |
| Execution actions | Owner/target-date controls, progress form, demo upload/link and optional outcome summary |
| Admin Dashboard | Status/category counts, oldest-first review queue, overdue list; no additional analytics |

The Next.js App Router defines routes in `src/app/`; the source's App.tsx router
instructions do not apply. Route names and detailed compositions are finalized
in the screen design pass, not implied by Orbit's existing route prefixes.
Do not copy its notification bell, leave/salary/daily-update screens, tickets,
whiteboard tools, or other features absent from the FRD. In-app notifications
are explicitly out of scope.

## 8. Design handoff and review

The supplied template is the approved visual direction. Product screen designs
still need to be created and reviewed in Pencil before frontend implementation.
`test.pen` holds the project design states for review; separate artboards show
dialogs and view states, not additional application pages. Orbit's referenced .pen file and reference screens were not
included with the template and must not be treated as inspected assets.

Use AGENTS.md's under-400-line file limit; aim for the template's tighter
under-200-line target for new UI files. Preserve file headers and function comments.

Before approving a screen, check:

- Semantic colors, source typography, spacing, and radius match this document.
- Main action is obvious; navigation and controls work on desktop and mobile.
- Status labels, role-visible actions, and field coverage match the FRD.
- Loading, empty, invalid, failure, success, and disabled states are accounted for.
- Anonymous identity never leaks through avatars, tooltips, history, or media paths.
- Tables have shared pagination and server controls; search follows the project
  minimum of three trimmed characters before querying.
- Text contrast, focus visibility, keyboard operation, and reduced motion are checked.
- Missing sidebar/dark/chart values are explicitly resolved before dependent work.


## 9. Dashboard and popup architecture — user direction

- Maximum two application pages: authentication and the main dashboard.
- Login and employee signup share the authentication page as alternate states.
- Board, list, My Ideas, and Admin Overview are dashboard view states, not routes.
- Submit/edit idea, idea details, evaluation, transitions, assignment, progress,
  completion, and confirmations open as dialogs over the dashboard.
- Success and failure feedback use popup boxes, replacing the template's toasts.
  Field errors remain inline as well; feedback does not erase entered values.
- Detail dialogs use internal tabs for discussion, execution, and history.
- On mobile, dialogs occupy the available screen with a close/back control and
  retained dashboard context. Keyboard focus is trapped and returned on dismissal.
- Design artboards represent page states and overlays. They do not count as new
  application pages. No admin metrics appear in Member dashboard states.
- Light-theme designs use supplied core tokens and top navigation, avoiding
  undefined sidebar/chart/dark values. Dashboard counts use text cards, not charts.
- Ideas, counts and authentication use live Supabase;
  the account menu shows the signed-in employee and Sign out. Preview role
  switching is removed. Signup enters the dashboard immediately without a confirmation email. Authentication errors use popups.

## 10. Review and alternate-state compositions

Admin Review and Overdue are dashboard view states with shared search, filters,
tables and pagination. Review opens an Admin-only detail dialog with stage-valid
actions; reasons use the existing required-reason dialog. Author/Owner variants
reuse the same detail tabs. Menu options, inline validation, pending and locked
states reuse existing tokens and dimensions. Mobile lists stack rows into cards;
mobile detail dialogs retain a close control. These introduce no extra routes.

Calendar picker: show a seven-column month grid, weekday headings, month and
year dropdowns, previous/next month icon controls, a selected-day highlight using
primary tokens, and a formatted selection summary. Keep owner/date groups
top-aligned. Use the existing compact border/radius and button dimensions.

## 11. Bounded dashboard scrolling — user correction

- The brand header can scroll out of view; page scrolling ends when the dashboard
  heading reaches the top. The remaining workspace fills one viewport.
- Table/board results scroll within a bounded region; table headers remain sticky.
  Pagination stays outside the row scroller and remains reachable.
- Show no duplicate empty-state block or preview footer below results/pagination.
  Keep the clear-filter action with the single empty state inside the results box.
- On short/mobile screens, the navigation/filter group can scroll independently
  to preserve space for results; the heading and results remain reachable.
- Pencil depicts clipped result viewports; scrolling behavior is implemented in
  code and documented rather than pretending the static canvas is interactive.

## 12. Compact pagination — user correction

Page-size selector, Previous and Next are 32px high. Use compact horizontal
padding and an 8px gap between the selected page-size text and its chevron.
Size each control to its label; 32px specifies height, not a width that clips text.
Apply through shared Pagination so all dashboard tables/boards match.

## 13. Admin overview scroll boundary

Keep status cards above the scroller. Only the lower group containing Ideas by
category and Awaiting review/Overdue ideas scrolls within the available height.
Preserve the existing dashboard heading and document scrolling behavior.

## 14. Idea overview metadata

Match the other overview sections: Rough effort and Owner each use a
medium-weight heading with the muted value on the next line (8px gap).
Separate these sections with the existing 16px overview gap.

Execution metadata uses content-sized Owner and Target date items with a 16px
horizontal gap; wrap when needed instead of stretching into equal columns.

Execution metadata labels use semibold weight (600); values remain regular.

Calendar month/year controls fit their selected label with an 8px chevron gap.

Score summaries show Impact: and Effort: on one line, then Quadrant: with its
value on the next line (8px gap). Score labels use medium weight (500); values remain regular.

## Live data states — 2026-11-05

Reuse the approved popups for all persisted operations, success and failure.
Incomplete draft fields may remain blank; show Untitled draft where no title is
provided. Comments deleted within the allowed window show a Comment deleted
placeholder while retaining replies. Owner controls load paginated authorized
options. Private uploaded demos use a native video player in the existing demo
popup; supported external links open separately. Realtime failures use the shared
feedback popup and never expose tokens, raw rows or author identity.

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

## 2026-11-06 — Immediate interaction feedback

Dashboard selections change immediately with the URL. Keep the shell interactive
while uncached results load using shared content-shaped skeletons. Cached views
render immediately and background refreshes show the existing Updating indicator.
Save buttons stop waiting once the database accepts the write; normal success
popups appear while background queries refresh. Reuse existing tokens and loaders.

## 2026-11-06 — Content skeletons

Use the shared Skeleton primitive with the existing accent fill, control radii
and spacing. Loading silhouettes match six board columns/cards, list headers and
rows, Admin count cards/lower panels, auth fields, detail sections, owner controls
and video aspect ratio. Hide decorative blocks from assistive technology; announce
one named loading status per surface. Disable pulsing for reduced motion. Keep
controls/pagination available and retain real content during background refetches.
No artificial minimum display time; shared ButtonLoader remains for mutations.

## 2026-11-06 — Card, row and view interaction corrections

Whole cards open details via a stretched native button with visible focus. The
overflow menu stays independently actionable; vote/comment counts are plain text.
Rows open on click or Enter/Space with visible focus; remove the Action column.
Use Board/List/sort on every idea view and My Ideas tab; Admin Overview retains
its count panels. Preserve the selected layout between views. Show nine non-draft
status columns, adding Draft in My Ideas; horizontal result scrolling preserves
the existing 200px desktop/280px mobile column widths. Skeletons match the column
count and four table columns (five for review/overdue). Deleted comments and their
replies have no visible placeholder, metadata or actions. Detail Vote/Follow keep
their existing behavior. These supersede prior six-column/placeholder patterns.
