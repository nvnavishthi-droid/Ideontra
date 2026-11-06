# Project Development Plan

Develop the Ideas & Innovation Board in the Ideontra folder, following
[the FRD scope](docs/scope/scope-final.md) and [project rules](AGENTS.md).

## 1. Design

- Design template received; project adaptation is in `docs/design-system.md`.
- Use that template to design the project screens and components in Pencil.
- Cover the FRD workflows for Members, Admins, and per-idea Owners, including
  desktop and mobile layouts.
- Document design tokens and reusable patterns in `docs/design-system.md`.
- Review and finalize the design with the user before implementing product UI.

**Deliverable:** Finalized designs and a documented design system.

## 2. Supabase Backend

- Receive and lock the Supabase project reference before making backend changes.
- Document the data model, API contracts, and business rules before implementation.
- Set up authentication and profiles, including employee signup restricted to
  `@closefuture.io` email addresses and Member/Admin permissions.
- Create the required tables, relationships, constraints, indexes, RPC functions,
  and any necessary Edge Functions, Storage, Realtime, or scheduled jobs.
- Enforce the FRD rules in the database, including status transitions, voting,
  editing permissions, comment limits, anonymity, evaluation, and completion gates.
- Draft RLS policies for user review before applying them.
- Apply changes through Supabase MCP against the locked project only, preserve
  SQL migrations in the repository, and verify each change.
- Prepare the required seed data and keep `docs/project.md` current.

**Deliverable:** A documented and verified backend supporting the FRD workflows.

## 3. Implement the Complete FRD Flow

- Build the approved design using Next.js, Tailwind CSS, and TanStack Query.
- Connect the frontend to the documented backend through the shared API layer.
- Implement authentication, role-based navigation, and protected screens.
- Implement idea submission, drafts, anonymity, editing, deletion, and withdrawal.
- Implement voting, comments and replies, and following.
- Implement all permitted status transitions, required reasons, and history.
- Implement evaluation scores and quadrants, owner assignment and history,
  target dates, progress updates, and overdue indicators.
- Implement demo video upload or supported links and the requirements for Done.
- Implement Kanban, list/search/filter/sort, idea details, My Ideas, and the
  Admin Dashboard with live data and server-side list controls.
- Include consistent validation, loading, empty, and error states.
- Track requirements against the FRD and update project documentation as work
  progresses. Resolve missing requirements without adding out-of-scope features.

**Deliverable:** The complete FRD application integrated with Supabase.

## 4. Testing

- Run lint, TypeScript checks, and the production build.
- Test utilities and API helpers, and verify database business rules with SQL checks.
- Test Member, Admin, author, and Owner permissions, including direct URLs and
  unauthorized API/database operations.
- Test valid and invalid transitions, final states, voting restrictions, the
  15-minute comment window, anonymity, and draft privacy.
- Test evaluation and execution gates, overdue behavior, demo uploads and links,
  and Storage permissions.
- Verify search, filtering, sorting, pagination, Realtime updates, and dashboard
  counts against the underlying data.
- Verify the UI on desktop and mobile and complete the FRD acceptance checklist.
- Fix defects and repeat the affected checks.
- Complete the setup README, seed instructions, known limitations, and required
  5–10 minute walkthrough video for handoff. Commit, push, and share submission
  links only when requested by the user.

**Deliverable:** Tested application, validation results, and FRD handoff materials.

## Current Status — 2026-11-05

The approved design is implemented and connected to Supabase Auth, RPC reads and
writes, Storage and private Realtime. Demo seeding was approved and applied.
Core database/workflow checks, desktop/mobile browser checks, lint, typecheck,
unit tests and production build have passed. Current evidence and remaining
external acceptance checks are in docs/verification/live-integration.md.

Before public launch: confirm actual email delivery, choose hosting and redirect
URLs, review the local walkthrough, and explicitly authorize Git/publication.
The current authoritative implementation inventory is docs/project.md.

Signup acceptance update (2026-11-05): the user removed confirmation email.
Earlier email-delivery/link test requirements are superseded; immediate signup
session verification passed after hosted Confirm Email was disabled (2026-11-05).
