# Pencil design handoff

Design file: [test.pen](../test.pen). Prepared 2026-11-04 for user review.
Visual rules: [design-system.md](design-system.md).
Requirements: [scope-final.md](scope/scope-final.md).

## Application structure

There are two application pages: authentication and dashboard. The 27 canvas
artboards show alternate states, dialogs, and mobile layouts, not 27 pages.
Login/signup share the authentication page. Board/list/My Ideas/Admin Overview
share the dashboard. Admin controls are role-specific.

## Canvas index

| Artboards | Contents |
|---|---|
| 01–02 | Sign in and employee signup (domain helper copy removed on request) |
| 03–06 | Board, list, My Ideas, and Admin Overview dashboard states |
| 07–08 | Submit and edit idea dialogs with FRD submission fields |
| 09–12 | Idea details: overview, discussion, execution, status/owner history |
| 13–16 | Evaluation, transition reason, owner/target date, progress update |
| 17–18 | Demo upload/link completion and completed outcome viewer |
| 19–22 | Delete confirmation, success, failure, invalid-transition popups |
| 23–24 | Mobile dashboard and submission popup |
| 25–27 | No-results feedback, owner reassignment, withdrawal confirmation |

## Interaction contract for implementation

- Selecting a card/row opens its detail dialog without leaving the dashboard.
- Submit/edit and workflow controls open dialogs; dismissing restores dashboard
  context and keyboard focus. Detail tabs change dialog content only.
- My Ideas tabs remain Drafts, My Submissions, Owned by me, and Following.
- Search/filter/sort/pagination affect the dashboard's server-backed result set.
- All success/failure messages use popup boxes. Keep field validation inline too.
- Confirm deletion/withdrawal; preserve form values after failed submissions.
- Actual action visibility depends on role, ownership, status, and backend checks.
- Anonymous cards show Anonymous; returned Member data must never include the
  protected author's identity. Drafts remain author-only, including for Admins.
- Owner/target date, evaluation scores, mandatory reasons, and demo requirements
  are enforced by the backend when implementation begins.

## Review performed

Pencil rendered the main board, submission popup, mobile submission layout, and
Admin Overview for visual inspection. Its structural bounds check reported no
clipped nodes across the document after refinement. All objects are native,
editable Pencil layers; sample data does not come from a live system.

## Remaining handoff items

- This is a static visual design set, not a wired clickable prototype or app.
- User review is pending. Confirm compositions before frontend implementation.
- Light tokens follow the supplied template. Exact dark/sidebar/chart values
  remain unspecified; these designs use light core tokens and top navigation.
- Supplied bright foreground/background combinations require accessibility
  contrast resolution before implementation; preserve the brand direction and
  obtain agreement on any necessary token changes.
- Detailed transient loading, invalid-field, and every filter/tab variant reuse
  the documented shared patterns; not every permutation has a separate artboard.
- The Supabase project ref remains pending. No backend or app code changed.

## FRD completeness audit

The full content review found partial coverage, not full FRD completeness.
See [design-frd-audit.md](design-frd-audit.md) for requirement-level evidence,
missing actions/states, content inconsistencies and next design tasks.

## Expanded design set

The initial 27-state set now has 79 states. See
[design-completion.md](design-completion.md) for Admin Review and the completed
alternate-state index. The original audit is retained as historical evidence.
