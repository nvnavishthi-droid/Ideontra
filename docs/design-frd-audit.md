# FRD coverage audit of the Pencil design

Reviewed 2026-11-04. Sources: the eight-page supplied FRD, locked scope,
project decisions, design system, and all 27 artboards in [test.pen](../test.pen).
This is a content/flow audit of a static design, not functional acceptance testing.
The design is **partially complete**. Every main feature area has a representation,
but several required actions, alternate states, and content details need completion.
No Pencil designs or application code were changed during this audit.

## Completion follow-up

The table below records the original pre-completion audit, not the current canvas.
Missing design states were subsequently added in artboards 28–79. See
[design-completion.md](design-completion.md) for the current coverage mapping,
corrections, validation, and unresolved scope/implementation limitations.

## Coverage by requirement

“Shown” means the relevant content exists visually; it does not prove behavior.
“Partial” means a base screen exists but required content/state coverage is missing.
“Implementation” means the requirement cannot be verified from a static design.
Artboard numbers match the canvas names.

| FRD reference | Coverage | Evidence and remaining work |
|---|---|---|
| FR-1.1 email/password login | Shown | 01 has email, password, sign-in action. Auth errors/pending states are not drawn. |
| FR-1.2 Member/Admin; Owner per idea | Partial | 03/06 show Member/Admin; 11 shows per-idea Owner. Complete role-specific detail/action variants are absent. Role storage is implementation work. |
| FR-1.3 seed users | Implementation | Database seed, not screen content. |
| FR-2.1 submission fields | Shown | 07/08 include title, category, problem, proposed solution, benefits, impact, optional effort and links; 24 includes mobile equivalents. Title max 100 is stated on desktop. Required-field errors/limit states are not drawn. |
| FR-2.2 six categories | Partial | All six appear on the board/admin counts, but the category selector's option list is not designed. |
| FR-2.3 save Draft; author-only | Partial | 07/24 Save draft; 05 private Drafts list. A saved-draft detail with Submit/Delete entry points is absent. Privacy enforcement is implementation work. |
| FR-2.4 Submitted and timestamp | Shown | 20 submission success; 09 Submitted badge and submitted date. Persistence is implementation work. |
| FR-2.5 anonymity | Partial | Checkbox in 07/08/24; Member overview says Anonymous. Admin-only display of the anonymous author's real identity is not drawn. |
| FR-3.1 editable statuses | Partial | 08 edit form; 05 Edit draft entry. Edit actions on own Submitted/Needs More Info details and their status-specific variants are missing. |
| FR-3.2 editing locked | Partial | Rule exists in scope; no visible locked detail/action variant from Under Evaluation onward. |
| FR-3.3 delete Draft/withdraw submitted | Partial | 19 Delete draft and 27 withdrawal confirmations exist. Their detail/list entry actions are missing; Needs More Info withdrawal variant is not shown. |
| FR-4.1 one vote, remove vote | Partial | 09 Vote count/action; selected/voted and remove-vote state missing. Uniqueness is implementation work. |
| FR-4.2 no own-idea voting | Partial | Own-idea disabled/hidden voting state not drawn. |
| FR-4.3 vote only in three statuses | Partial | No clearly closed voting state for later statuses. Card counts may remain visible; counts alone do not authorize voting. |
| FR-4.4 vote counts | Shown | Board/list and 09 detail include counts. |
| FR-5.1 comments and one reply level | Partial | 10 has comment, nested reply, Reply link and new-comment composer. Reply composer state and prohibition of deeper replies are not represented. |
| FR-5.2 edit/delete own within 15 min | Partial | 10 has Edit/Delete and 15-minute guidance. Current example incorrectly shows those actions on Rahul's comment while the shell account is PS/Priya. Edit composer, delete action outcome, and expired-action state are missing. |
| FR-5.3 follow/unfollow | Partial | 09 Follow; 05 Following tab label. Followed/Unfollow state missing. |
| FR-5.4 comment counts | Shown | Board cards and detail show counts; sample discussion count needs correction below. |
| FR-6.1 ten statuses | Shown | 06 names all ten. Draft/Done/Rejected/Withdrawn detail variants are not all present. |
| FR-6.2 valid transitions only | Partial | Some transition dialogs exist; several source-state entry points and transitions are not represented. See workflow table. 22 shows a blocked Submitted-to-Done move. |
| FR-6.3 mandatory reasons | Partial | 14 has required reason for Needs More Info and notes Parked/Rejected. Actual Parked/Rejected confirmation variants and required-reason errors are absent. |
| FR-6.4 transition audit data | Partial | 12 shows from/to, date, generic actor and reason. Use identifiable authorized actors and precise timestamps; dates and role labels alone are insufficient handoff examples. Backend logging cannot be verified here. |
| FR-6.5 visible history | Shown | 12 includes status and owner history in a detail tab. |
| FR-7.1 scores 1-5, Admin, Under Evaluation | Shown | 13 explicitly shows role/status, two scores and range guidance. |
| FR-7.2 approval needs both scores | Partial | 13 states rule but Approve is only shown with valid populated scores. Missing-score/disabled/error state absent. |
| FR-7.3 quadrants | Partial | Quick Win shown in 11/13; Big Bet, Fill-in and Not Worth It not demonstrated in evaluation/filter options. Threshold guidance exists. |
| FR-8.1 owner/date before In Progress | Shown | 15 required Owner/Target Date, transition and action. Selector/calendar open states not drawn. |
| FR-8.2 progress text and timestamp | Shown | 16 input; 11 update with author/date. Precise time example can be improved. |
| FR-8.3 overdue | Shown | 11 and 06 show overdue indicator and target date. Date calculation is implementation work. |
| FR-8.4 reassignment/history | Partial | 26 form and 12 owner history exist. Admin detail entry point for reassignment and a history example retaining multiple owners are missing. |
| FR-8.5 demo and optional summary | Shown | 17 includes upload/link, MP4/MOV/WebM, 100 MB, supported hosts, optional summary and Done action. Selected-file/uploading/invalid-file and missing-demo states not drawn. Storage enforcement is implementation work. |
| FR-8.6 play/open demo | Shown | 18 viewer and Open original video. Explicit navigation from a Done idea's detail to this viewer is not shown. |
| FR-9.1 active-status board | Partial | 03 has six active columns. Exact active-status set remains an unresolved scope interpretation in decisions.md; do not call it settled by the mockup. Mobile shows one column and Next status, which needs a clearer browse-column label. |
| FR-9.2 list sorts/filters | Partial | 04 has Status/Category/Owner/Quadrant and Newest, but no opened menus showing all options, Most votes or Recently updated. Pagination exists; sample total is inconsistent. |
| FR-9.3 title/text search | Shown | 03/04 and mobile search with 3+ character hint. Results and short-query validation states not drawn. |
| FR-9.4 full idea details | Partial | 09-12 plus 18 cover the principal fields in separate examples. A populated scored/Done detail, author-specific controls and Admin anonymity variant are absent; generic placeholder notes do not replace those states. |
| FR-9.5 My Ideas tabs | Partial | 05 shows all four labels but only Drafts content. My Submissions, Owned by me and Following contents/actions are not designed. |
| FR-10.1 status/category counts | Shown | 06 covers all statuses and six categories. Draft count is Private per author-only project policy. |
| FR-10.2 oldest review queue | Partial | 06 contains one dated review row and Oldest first label. Full queue with multiple rows, usable review actions and paging per project rules is not drawn. Exact queue membership remains unresolved. |
| FR-10.3 overdue list | Partial | 06 has one overdue row. Full list with multiple rows/pagination per project rules is not drawn. |

## Status transition coverage

A standalone dialog does not establish how the user reaches it. The missing
items below can be additional states/dialogs on the existing dashboard; no extra
application pages are required.

| Transition / role from FRD | Design coverage |
|---|---|
| Draft → Submitted / author | Save/submit form exists; saved-draft Submit entry/state missing. |
| Submitted → Under Evaluation / Admin | No explicit Start evaluation action/transition state. |
| Submitted → Needs More Info or Rejected / Admin | No Submitted review variant; 14 demonstrates an Under Evaluation source. |
| Submitted → Withdrawn / author | 27 confirmation exists; source-detail Withdraw action missing. |
| Needs More Info → Submitted after edit / author | Edit form exists; explicit edit-and-resubmit state/action missing. |
| Needs More Info → Withdrawn / author | Source-state action/confirmation variant missing. |
| Under Evaluation → Approved / Admin | 13 Approve exists; approval with missing scores not drawn. |
| Under Evaluation → Rejected/Parked/Needs More Info / Admin | 13 buttons; 14 illustrates reason only for Needs More Info. |
| Approved → In Progress / Admin or Owner | 15 dialog exists; source-detail Start execution entry not shown. |
| In Progress → Done/Parked / Owner or Admin | 11 actions, 17 completion; Park reason variant not drawn. |
| Parked → Under Evaluation / Admin | Resume evaluation action/state missing. |
| Done/Rejected/Withdrawn are final | Text describes finality in some dialogs; final-state detail controls need explicit examples. |

## Content inconsistencies to correct

1. 10 shows Edit/Delete on Rahul's comment while the active account is PS/Priya.
   Show those controls only on the current user's own comment within 15 minutes.
2. 04 displays five table rows but says “Showing 12 of 12”; its nearby sample
   count says six active ideas. Use one coherent illustrative dataset and totals.
3. 10 says “Comments · 3” but only two comment/reply messages are displayed.
   Add the third message or correct the count.
4. 11 places a progress update on 30 Oct while 12 starts In Progress on 31 Oct.
   Align the example timeline before using it to demonstrate workflow rules.
5. Mobile “Next status” is ambiguous: it appears to browse columns but sounds
   like a workflow action. Use a clear column-navigation label during refinement.
6. 08 is an edit dialog but contains empty placeholders; show a populated example
   so prefilled data and save behavior can be reviewed.

## Additional project design requirements

These are from AGENTS.md/design-system/user instructions, not extra FRD features:

- Two-page/popup architecture is represented. All new states must preserve it.
- Success/failure, invalid transition, empty results and destructive confirmations
  exist; inline validation, pending/loading and keyboard/focus states are not drawn.
- Admin queue/overdue lists do not show shared pagination/search/filter controls.
- Dark theme values and some token contrast questions remain unresolved.
- Mobile examples cover dashboard and submit only. Mobile authentication, list,
  detail, discussion and admin layouts have not been visually demonstrated.
- Removing the auth domain helper text was intentional. The signup domain rule
  remains required; the removed sentence is not a missing-content defect.

## What static designs cannot prove

FRD acceptance criteria also require working Auth/roles, author-only drafts,
identity protection, voting/comment/transition enforcement, scoring/owner/demo
gates, live data and RLS. These require implementation and tests, not more labels.
Database entities/constraints, SQL migrations, seed users/ideas, repository/README,
and walkthrough video are separate deliverables, not missing Pencil pages.
Supabase target is still TBD; this audit performs no database operations.

## Recommended completion order

1. Correct the six example-content inconsistencies.
2. Complete author/Admin/Owner detail actions and every allowed workflow entry.
3. Add My Ideas tab contents, sort/filter menus, and voted/followed/locked states.
4. Complete comment reply/edit/delete states and admin identity/history examples.
5. Add validation/pending/upload states and remaining responsive examples.

The audit does not approve unprovided behavior: exact active columns, review-queue
membership, incomplete draft validation, score reset on reevaluation and parent
comment deletion behavior remain recorded questions for implementation/design
completion. No new feature or library is recommended outside the FRD.
