# Locked scope — Ideas & Innovation Board

Source: `/Users/navishthinv/Downloads/FRD_Ideas_And_Innovation_Board.pdf`,
eight pages, reviewed 2026-11-04. The text below preserves the FRD requirements;
the PDF remains the reference for original formatting and the workflow diagram.
The diagram was visually reviewed; its transitions are represented in Section 6.

## User clarification — 2026-11-04

- Employees may sign up using email/password. Signup is restricted to the exact
  `closefuture.io` email domain (`@closefuture.io` accounts).
- Implementation belongs in `/Users/navishthinv/Desktop/Ideontra`.
  This folder choice does not separately settle the product's display name.
- The Supabase project reference will be supplied later. Until then, the existing
  AGENTS.md prohibition on Supabase writes remains in force.
- Follow the FRD for other behavior. Earlier recommendations apply only where
  supported by the FRD; they are not additions to the locked scope.

## FRD text transcription

FRD: Ideas & Innovation Board




FRD: Ideas & Innovation Board

1. Overview
     Product: Internal web app for CloseFuture to capture, discuss, evaluate and track
     ideas from the team.
     Goal: No idea gets lost; every idea gets a visible decision; approved ideas get an owner
     and are tracked to completion with a demo of the outcome.
     Users: CloseFuture team, accessed via browser on desktop and mobile.


2. Scope
     In scope: Authentication with roles, idea submission, voting, comments, follow, status
     workflow, evaluation scoring, owner assignment, progress updates, demo video on
     completion, board and list views, status history, admin dashboard.


3. Tech Stack
The developer chooses the frontend framework from Next.js, Vue or Angular, in JavaScript
or TypeScript; the backend is Supabase, with all business rules enforced in the database.


  Layer                         Technology

  Frontend                      Developer's choice of Next.js, Vue or Angular, in
                                JavaScript or TypeScript

  Authentication                Supabase Auth (email and password)

  Database                      Supabase Postgres with foreign keys, unique
                                constraints and check constraints

  Permissions                   Row Level Security (RLS), enforced at the
                                database level

  Business logic                Postgres functions (RPC) or Supabase Edge
                                Functions for status transitions, voting and other
                                rules

  File storage                  Supabase Storage for demo video uploads

  Styling                       Tailwind CSS or CSS Modules

  Kanban drag-and-drop          dnd-kit or a framework equivalent (optional; status
                                buttons are acceptable)




FRD: Ideas & Innovation Board




  Layer                         Technology

  Version control               GitHub, single repository




4. User Roles & Permissions
There are two global roles, Member and Admin; Owner is assigned per idea.


  Action                                       Member       Owner             Admin

  Submit / edit own idea (while editable)      Yes          Yes               Yes

  Vote, comment, follow                        Yes          Yes               Yes

  Score Impact and Effort                      No           No                Yes

  Change status (evaluation decisions)         No           No                Yes

  Assign or reassign owner                     No           No                Yes

  Post progress updates, mark Done             No           Yes (own ideas)   Yes

  See anonymous submitter's identity           No           No                Yes




5. Functional Requirements

FR-1: Authentication
 1. FR-1.1 Users log in with email and password (Supabase Auth).
 2. FR-1.2 Each user has one role, Member or Admin, stored in a profiles table. Owner is per
    idea, not a global role.
 3. FR-1.3 Seed data: 1 admin and at least 3 members.


FR-2: Idea Submission
 1. FR-2.1 Fields: Title (required, max 100 characters), Category (required), Problem
    (required), Proposed Solution (required), Who Benefits (required), Expected Impact
     (required), Rough Effort (optional: Small, Medium, Large), Links (optional).
 2. FR-2.2 Categories: New Service Offering, Internal Tool, Process Improvement,
    Marketing/Content, Client Experience, Training.
 3. FR-2.3 Users can save an idea as a Draft; drafts are visible only to the author.





FRD: Ideas & Innovation Board




 4. FR-2.4 On submit, status becomes Submitted and the submission timestamp is
     recorded.
 5. FR-2.5 Optional Anonymous checkbox: the author's name is hidden from Members and
     visible to Admins.


FR-3: Editing Rules
 1. FR-3.1 The author can edit only when status is Draft, Submitted or Needs More Info.
 2. FR-3.2 Editing is locked from Under Evaluation onwards.
 3. FR-3.3 The author can delete only Drafts; submitted ideas can be withdrawn (status
     becomes Withdrawn), not deleted.


FR-4: Voting
 1. FR-4.1 One vote per user per idea; users can remove their vote.
 2. FR-4.2 Users cannot vote on their own idea.
 3. FR-4.3 Voting is allowed only in Submitted, Needs More Info and Under Evaluation.
 4. FR-4.4 Vote count is shown on cards and the detail page.


FR-5: Comments & Follow
 1. FR-5.1 Any user can comment on any non-draft idea, with one level of replies.
 2. FR-5.2 Users can edit or delete their own comments within 15 minutes of posting.
 3. FR-5.3 Users can follow or unfollow an idea.
 4. FR-5.4 Comment count is shown on cards.


FR-6: Status Workflow
 1. FR-6.1 Statuses: Draft, Submitted, Needs More Info, Under Evaluation, Approved, In
    Progress, Done, Rejected, Parked, Withdrawn.
 2. FR-6.2 Only the transitions in Section 6 are allowed; all others are rejected by the
     backend.
 3. FR-6.3 Moving to Rejected, Parked or Needs More Info requires a mandatory reason.
 4. FR-6.4 Every transition is logged: idea, from status, to status, changed by, timestamp
     and reason.
 5. FR-6.5 Status history is visible on the idea detail page.


FR-7: Evaluation
 1. FR-7.1 An Admin scores Impact (1–5) and Effort (1–5) while the idea is Under Evaluation.
 2. FR-7.2 Both scores are required before moving to Approved.




FRD: Ideas & Innovation Board




 3. FR-7.3 A quadrant is derived from the scores (a score of 3 or more counts as High):
     High Impact + Low Effort = Quick Win; High Impact + High Effort = Big Bet; Low Impact
     + Low Effort = Fill-in; Low Impact + High Effort = Not Worth It.


FR-8: Ownership & Execution
 1. FR-8.1 Approved to In Progress requires an Owner and a Target Date.
 2. FR-8.2 The Owner posts progress updates (text and timestamp).
 3. FR-8.3 Ideas In Progress past their target date are marked Overdue.
 4. FR-8.4 An Admin can reassign the Owner; previous owners are kept in history.
 5. FR-8.5 Moving to Done requires an Actual Outcome demo video, either uploaded (MP4,
     MOV or WebM, max 100 MB, stored in Supabase Storage) or provided as a link
     (YouTube, Loom or Google Drive), plus an optional short outcome summary.
 6. FR-8.6 The demo video can be played or opened from the idea detail page.


FR-9: Views & Navigation
 1. FR-9.1 Kanban board with one column per active status.
 2. FR-9.2 List view with sorting (most votes, newest, recently updated) and filters
     (status, category, owner, quadrant).
 3. FR-9.3 Search by title and text.
 4. FR-9.4 Idea detail page showing all fields, votes, comments, scores, owner, progress
     updates, demo video and status history.
 5. FR-9.5 My Ideas page with tabs: Drafts, My Submissions, Owned by me, Following.


FR-10: Admin Dashboard
 1. FR-10.1 Counts of ideas by status and by category.
 2. FR-10.2 Queue of ideas awaiting review, oldest first.
 3. FR-10.3 List of overdue ideas.


6. Status Transition Rules
Only these transitions are allowed, and only by the role listed; Rejected, Done and
Withdrawn are final.





FRD: Ideas & Innovation Board




idea status flow · 10 states, 3 final

The centre column is the main path; every arrow is an allowed move, and the table below
says who can make it.


  From                                  Allowed To                               Who

  Draft                                 Submitted                                Author

  Submitted                             Under Evaluation, Needs More Info,       Admin
                                        Rejected

  Submitted                             Withdrawn                                Author

  Needs More Info                       Submitted (after edit), Withdrawn        Author

  Under Evaluation                      Approved, Rejected, Parked, Needs More   Admin
                                        Info

  Approved                              In Progress                              Admin or
                                                                                 Owner




FRD: Ideas & Innovation Board




  From                                       Allowed To                                   Who

  In Progress                                Done, Parked                                 Owner or
                                                                                          Admin

  Parked                                     Under Evaluation                             Admin

  Rejected, Done,                            None (final)                                 —
  Withdrawn




7. Data Entities

  Entity                        Key fields                                  Constraint

  Profile                       id (linked to Supabase Auth user),          Role is Member or Admin
                                name, email, role

  Idea                          id, title, category, problem, solution,     Scores 1–5; status from the
                                beneficiaries, expected impact, effort      defined list
                                estimate, links, anonymous flag, author,
                                status, impact score, effort score,
                                owner, target date, demo video URL,
                                outcome summary, created at, updated
                                at, submitted at

  Vote                          user, idea, timestamp                       Unique on user + idea

  Comment                       id, idea, user, parent comment, text,       One level of replies
                                created at, updated at

  Follow                        user, idea                                  Unique on user + idea

  StatusHistory                 idea, from status, to status, changed by,   One row per transition
                                reason, timestamp

  ProgressUpdate                idea, user, text, timestamp                 Owner or Admin only

  OwnerHistory                  idea, owner, assigned by, assigned at       One row per assignment




8. Acceptance Criteria
 1. Login and roles work: users log in with Supabase Auth; Members never see or access
     admin-only screens and actions, even via direct URL.
 2. Idea submission is validated: required fields are enforced, drafts are visible only to
     their author, and anonymous ideas hide the author's name from Members.



FRD: Ideas & Innovation Board




 3. Editing is locked at the right time: authors can edit only in Draft, Submitted or Needs
     More Info; once Under Evaluation, the idea can't be edited. Only drafts can be deleted;
     submitted ideas can only be withdrawn.
 4. Voting rules hold: one vote per person per idea, no voting on your own idea, and voting
     closes once an idea moves past Under Evaluation.
 5. Comments work: users can comment and reply (one level), and can edit or delete only
     their own comments within 15 minutes.
 6. Only valid status changes are allowed: every transition follows the rules table, by the
     right role; invalid jumps (e.g., Submitted to Done) are blocked by the backend, and
     Rejected, Parked and Needs More Info require a reason.
 7. Every status change is recorded: status history shows who changed it, when, from
     what to what, and why.
 8. Evaluation gates approval: an idea can't be Approved without Impact and Effort
     scores (1–5), and the correct quadrant is shown.
 9. Execution is tracked to completion: In Progress requires an owner and target date,
     overdue ideas are flagged, and Done requires a demo video (upload or link).
10. Board, list and dashboard reflect live data: Kanban columns, filters, search, My Ideas
     and the Admin Dashboard counts always match the actual data, and rules are enforced
     with RLS, not just hidden in the UI.


9. Out of Scope
     Integrations with Slack or Jira
     Native mobile app
     Email & In-app notifications
     Analytics beyond the listed views


10. Deliverables & Submission

Deliverables
 1. GitHub repository containing the complete source code and all Supabase SQL (tables,
     constraints, RLS policies, Postgres functions or Edge Functions).
 2. Seed script that creates 1 Admin, at least 3 Members, and at least one sample idea in
     each status.
 3. README covering:
       a. Project overview and the framework chosen
      b. Setup steps and required environment variables




FRD: Ideas & Innovation Board




       c. How to apply the database schema and run the seed script
      d. Demo login credentials for Admin and Member
       e. Data model summary and how permissions are enforced (RLS and functions)
       f. Known limitations and anything not completed
 4. Walkthrough video (5–10 minutes) showing: login as Member and Admin, submitting
     an idea, voting and commenting, every status transition including a blocked invalid
     move, evaluation scoring, owner assignment, uploading a demo video to mark an idea
     Done, and the Admin Dashboard.


Submission
     Share the GitHub repository link and the walkthrough video link.
     The final commit on the main branch is treated as the submitted version; commits after
     the deadline are not reviewed..

## User clarification — 2026-11-05

Signup confirmation email is not required. Employees should sign up and enter the
app immediately, without an email link. Exact @closefuture.io domain restriction,
email/password credentials and Member/Admin authorization remain required.

## User clarification — 2026-11-06

Cards and table rows open details across their full area; card vote/comment counts
are read-only while detail Vote/Follow stay functional. Remove the Action column.
Every idea view and My Ideas tab supports Board/List/sort; Admin Overview remains
a summary. Boards show all public statuses, including Done/Rejected/Withdrawn;
My Ideas additionally shows author-private Drafts. Deleted comments and their
replies are hidden with matching visible counts, retaining database tombstones.
Review opens oldest-first by default and allows explicit alternative sorts.
These refinements supersede older active-only boards/deletion placeholders.
