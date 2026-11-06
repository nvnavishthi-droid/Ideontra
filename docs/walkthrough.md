# FRD walkthrough — recording checklist (5–10 minutes)

Use dedicated demo accounts after approved seeding. Passwords belong in the local
ignored environment/password manager, not the recording. Do not expose tokens.

1. 0:00–0:45 — Sign in as Member, show dashboard, filters/search and list pagination.
2. 0:45–1:45 — Save an incomplete draft, complete its fields and submit anonymously.
3. 1:45–2:30 — Sign in as another Member; show masked identity, vote/remove vote,
   follow/unfollow, comment, one-level reply and comment edit/delete placeholder.
4. 2:30–3:15 — Sign in as Admin; show counts and oldest-first Submitted review queue.
5. 3:15–4:00 — Request more information with a reason; author updates/resubmits.
   Start evaluation; show invalid transition rejection and score/approval gate.
6. 4:00–4:45 — Score Impact/Effort, show quadrant, approve, assign Owner/target date
   and start work. Show reassignment history and an overdue item.
7. 4:45–5:45 — Owner posts progress, uploads MP4/MOV/WebM, completes work and plays
   the private demo. Open real status/owner history.
8. 5:45–6:30 — Demonstrate Parked → Under Evaluation, Rejected and Withdrawn final
   states with the corresponding seeded records. Show another browser updating
   through private Broadcast, then sign out.

Recording must show actual interactions and failures, not simulated successful
screens. The current automated verification evidence is recorded separately in
 docs/verification/live-integration.md. A published walkthrough link requires the
user's chosen publishing destination; no upload or Git push is performed here.

## Recorded local artifact

[walkthrough.webm](verification/walkthrough.webm) is a 357-second captioned recording
of actual Member/Admin screens and persisted draft creation. Credentials are
omitted. It is a UI overview; invalid RPC operations and Storage permission cases
are covered by the separate automated verification report. A final narrated
submission video can follow the checklist above before publishing.
