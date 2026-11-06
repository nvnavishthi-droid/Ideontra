# Ideontra — CloseFuture Ideas & Innovation Board

Internal idea capture, discussion, evaluation and execution tracking. Built with
Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/Radix, TanStack Query/Table
and Supabase Auth/Postgres/Storage/private Realtime Broadcast.

## Run locally

Use Node.js 22+ and npm (the installed Supabase SDK requires Node 22 or newer). Copy .env.example to .env.local and set:

- NEXT_PUBLIC_SUPABASE_URL — the locked project's URL.
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — its enabled publishable key.
- NEXT_PUBLIC_SITE_URL — application origin, locally http://localhost:3000.

```sh
npm install
npm run dev
```

Open http://localhost:3000/auth. Signup accepts only @closefuture.io accounts.
No confirmation email is required. New accounts are Members; Admin roles are set
by trusted database administration. The account menu shows the real employee
and supports sign-out. Authenticated dashboard: http://localhost:3000.

## Supabase configuration

The only authorized target is knmqlkhnfumeuxgnkuez (CloseFuture, ap-south-1).
In Auth → Sign In / Providers → Email, disable Confirm Email and save. New
signups must return a session immediately. Enable the Custom Access Token hook
public.custom_access_token_hook.
The hook is already enabled on the current target. Configure the production site URL before deployment. Never configure a service-role key in the app.

Current target migrations are already applied; do not reapply them manually.
Every applied change is saved under supabase/migrations. The project originally
had an existing schema, so those files are incremental upgrades, not a complete
empty-database bootstrap. A data-free current schema snapshot is provided under
supabase/schema; install.sql assembles it for a fresh empty Supabase database.
Do not run that snapshot over an existing installation. Any remote setup must
follow AGENTS.md's locked-target/MCP workflow and policy-review gates. The local
psql include file documents ordering; it does not authorize another project.

## Demo seed

supabase/seed.sql creates one demo Admin, three Members (including an Owner), and
two ideas per status. It uses the workflow RPCs, keeps drafts private, and is
idempotent by demo title/author. It does not reset existing account passwords.
Set app.seed_password before executing the script as a trusted migration owner;
use a strong demo password, at least 12 characters. Do not commit that password.

Demo login emails are demo-admin@closefuture.io, demo-member@closefuture.io,
demo-owner@closefuture.io and demo-colleague@closefuture.io. Their password is
the value supplied when first seeded. On this workstation, the approved demo
password is stored in ignored .env.local as IDEONTRA_DEMO_PASSWORD. Preconfirmed seed accounts do not send mail.
The current live project's employee credentials are not changed by this script.

## Data and permissions

Ten public tables cover profiles, ideas, private author identity, votes, comments,
follows, progress, status/owner histories and audits. All public tables force RLS.
User mutations go through validated RPCs; workflow/history DML is blocked even
for Admin clients. Author identity is masked in database projections for Members.
JWT claims control global roles; per-idea author/owner flags come from the DB.

Board/list/My Ideas/review/overdue queries use server pagination, search, filters
and sorting. Detail popups show real discussion, progress, histories and demos.
Private Realtime channels carry idea IDs and event types, then refetch authorized
data. Uploaded demos are private MP4/MOV/WebM files up to 100 MB; playback uses
short-lived signed URLs. YouTube, Loom and Google Drive HTTPS links are supported.

## Validation and handoff

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Rollback-only database checks live in supabase/tests. Current verification is
recorded in docs/verification/live-integration.md. Walkthrough steps are in
 docs/walkthrough.md. The complete current inventory is docs/project.md.

Signup without confirmation email passed live verification.
Known external checks: production hosting configuration needs verification. Leaked-password protection is
plan-dependent and remains disabled on the hosted project. The approved UI is
light; undefined dark-theme branding has not been invented. Status buttons
implement the optional drag-and-drop workflow. No Slack/Jira, notifications or
additional analytics are included. Git commit/push and publication await an
explicit user instruction.
