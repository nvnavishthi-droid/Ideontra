# FRD design completion handoff

Completed 2026-11-04 in [test.pen](../test.pen). The canvas now contains 79
editable state artboards within the same two application pages. These are static
designs, not working routes or a clickable prototype.

## Added content

| Artboards | Design coverage |
|---|---|
| 28–30 | Admin Review queue, full submitted review dialog, overdue list |
| 31–33 | My Submissions, Owned by me, Following |
| 34–38 | Private draft actions, own Submitted/Needs More Info, populated resubmission, withdrawal |
| 39 | Remove vote and Unfollow |
| 40–44 | Admin evaluation/start/execution/reassignment/resume and Owner start actions |
| 45–47 | Done/demo entry, Rejected and Withdrawn final details |
| 48–53 | Required-reason transitions and blocked approval without both scores |
| 54–57 | Reply, edit own comment, delete own reply, expired action examples |
| 58–62 | Category, sort, quadrant, status and owner option sets |
| 63–69 | Form/search validation, upload pending/invalid/ready, owner/date selection, loading list |
| 70–76 | Mobile authentication, list, detail, discussion, Admin Review queue and review dialog |
| 77–79 | Sign-in failure, account creation pending, submission pending |

## Existing corrections

- Discussion now gives Edit/Delete to the signed-in user’s own comment and shows
  two comments matching its two messages; associated count examples updated.
- List total now matches five visible rows.
- Progress date follows the start date; history has precise timestamps and two owners.
- Mobile column browsing says Next column. Existing edit form is populated.
- Admin Overview now has Review ideas and Overdue ideas entry buttons.

## Review constraints

Admin Review uses an explicit Submitted sample filter, not an inferred definition
of the entire review queue. Exact queue membership, active column set, incomplete
draft validation, reevaluation score reset and parent-comment deletion behavior
remain open scope decisions. The delete example covers a reply with no children.

Status/role controls are visual examples; enforcement still requires Supabase
implementation and tests. No Supabase writes or app code changes were performed.
Missing dark tokens and accessibility contrast resolution remain open. Keyboard
focus, animation, real uploads, Realtime and server pagination cannot be proven
from Pencil artwork. Final user review remains required.

All 79 artboards were checked through Pencil for clipping; no clipping was reported.
Desktop review queue/detail, My Submissions and mobile review detail were visually
inspected. The design remains editable and its state index follows canvas numbering.

## Dashboard scrolling correction — 2026-11-04

Updated 70 existing dashboard result instances with native clipped board/table
viewports and pagination outside the scrolling content. Removed the board hint
below results. Added artboard 80 (Empty filtered list): one no-results message
and clear-filter action inside the table, with no duplicated block/footer below.
Pencil metadata records the scroll contract; real scrolling is verified in code.
The design set now contains 80 states, still within two application pages.
