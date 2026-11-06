# Ideontra — CloseFuture Ideas & Innovation Board

Internal idea capture, discussion, evaluation and execution tracking. Built with
Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/Radix, TanStack Query/Table
and Supabase Auth/Postgres/Storage/private Realtime Broadcast.

## Live application

**[Open Ideontra](https://ideontra.vercel.app)** · [Sign in](https://ideontra.vercel.app/auth)

Hosted on Vercel from this repository's `main` branch, with Supabase providing
authentication, database, private video storage and live updates.

## Features

- Member/Admin roles and per-idea Owners; private drafts and anonymous submission.
- Idea submission, voting, comments with one reply level, and following.
- Validated status transitions, evaluation scores and derived quadrants.
- Owner assignment, target dates, overdue work, progress and completion demos.
- Board, list, My Ideas and Admin views with server-side search/filter/pagination.
- Single-screen dashboard with internal result scrolling and popup workflows.

## Run locally

Use Node.js 22+ and npm (the installed Supabase SDK requires Node 22 or newer). Copy .env.example to .env.local and set:

- NEXT_PUBLIC_SUPABASE_URL — the locked project's URL.
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — its enabled publishable key.
- NEXT_PUBLIC_SITE_URL — application origin, locally http://localhost:3000.

```sh
npm ci
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
The hook is enabled and Confirm Email is disabled on the current target.
For Vercel, configure the two public Supabase variables above and set
`NEXT_PUBLIC_SITE_URL=https://ideontra.vercel.app`. Local development uses
`http://localhost:3000` instead. Never add a service-role key or the local demo
password to the application deployment.

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
The twenty seeded demo ideas were removed at the user's request; all four demo
accounts remain. Running the seed again recreates its sample ideas. Passwords
are shared privately with authorized reviewers, never published in this repository.

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

Latest local checks passed: lint, TypeScript, all **20 unit tests**, and the
production build. Live database verification covers workflow rules, permissions,
anonymity, private uploads/playback and Broadcast authorization. Production smoke
checks passed Admin login/logout, dashboard loading and owner filters at desktop
and mobile sizes. Full production mutation/upload tests were not repeated.

## Known limitations and remaining handoff

- Fresh empty-database installation of the schema snapshot is **not runtime
  verified**; the paid isolated-branch test was declined. Existing-database SQL
  checks and seed execution/idempotency were verified separately.
- Hosted leaked-password protection remains disabled (plan-dependent).
- The interface uses the approved light theme. Status buttons implement workflow
  transitions; optional Kanban drag-and-drop is not implemented.
- A local UI overview is available at [docs/verification/walkthrough.webm](docs/verification/walkthrough.webm).
  Final FRD walkthrough coverage and a shareable submission link remain pending.
- Slack/Jira integrations, notifications and additional analytics are out of scope.

See [project state](docs/project.md), [locked FRD scope](docs/scope/scope-final.md)
and [design system](docs/design-system.md) for the detailed project record.

## Idea AI chat setup

Idea details include an **Ask AI** tab with permanent private history per user
and idea. History loads through the `get_idea_chat` RPC; questions go to the
Supabase Edge Function `idea-chat` (`supabase/functions/idea-chat/`), which
fetches authorized idea content, calls Gemini and saves the answer. Other users’
conversations and anonymous-author identifiers are excluded. Google may use
free-tier inputs and outputs to improve its products.

All chat keys are **Edge Function secrets** in the Supabase project
(`knmqlkhnfumeuxgnkuez` → Edge Functions → Secrets), never Vercel or `.env.local`:

| Secret | Value |
|---|---|
| `GEMINI_API_KEY` | AI Studio key from a Google project **with billing disabled** |
| `GEMINI_API_URL` | `https://generativelanguage.googleapis.com/v1beta` |
| `GEMINI_FREE_TIER_CONFIRMED` | `true`, only after checking billing is disabled |
| `IDEA_CHAT_SERVER_SECRET` | the Vault secret `idea_chat_server_secret` |

The model is pinned to `gemini-3.5-flash-lite`; quota errors stop the request
with no paid fallback. Secrets apply immediately without redeploying. The
function keeps JWT verification on and runs every RPC as the calling user —
never with a service-role or secret key. Unexpected errors appear in the
function's logs as `[idea-chat] unexpected error: …`.

The chat migration creates the random Vault secret `idea_chat_server_secret`.
To rotate, use Vault's `update_secret` through the locked project's MCP and
update the Edge Function secret together.

For a fresh installation, run the existing snapshot then the two chat migrations
`20261106095150_private_idea_ai_chat.sql` and
`20261106095709_idea_chat_invoker_history.sql` (Supabase Vault is required).
Chat checks: `npm test` and the rollback-only `supabase/tests/idea-chat.sql`.
