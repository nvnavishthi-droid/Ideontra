# AGENTS.md — Project Rules & Agent Protocol (IdeaForge)

This file provides project instructions for Codex and other agents working in this repository. It is the **rulebook** the lead and all subagents must follow. The full project state lives in [docs/project.md](docs/project.md).

IdeaForge = CloseFuture **Ideas & Innovation Board** (internal app: capture, discuss, evaluate and track ideas). Roles: **Member**, **Admin** (global); **Owner** (per idea).

---

## 1. Tech Stack (locked)

- **Framework**: Next.js 16 (App Router, `src/` dir, Cache Components on). `proxy.ts` replaces `middleware.ts`. Read the matching guide in `node_modules/next/dist/docs/` before writing Next.js code.
- **Package Manager**: npm
- **Server State**: TanStack Query (no Redux in this project). TanStack Table for rendering tables (manual/server-side mode only — see §4 rule 10).
- **Styling**: Tailwind CSS v4 (design tokens in `src/app/globals.css`, light + dark)
- **UI**: shadcn/ui + Lucide icons (only through the shared `<Icon />` component — §4 Frontend rule 3) + Framer Motion
- **Forms**: react-hook-form + zod (client-side UX only; the database is the authority)
- **Kanban**: dnd-kit
- **Dates**: date-fns
- **Backend**: Supabase (DB, Auth, RPC, Storage, Realtime, Edge Functions, Cron) — accessed via Supabase MCP
- **Design Source**: design tokens + patterns in [docs/design-system.md](docs/design-system.md). There is **no Figma** for IdeaForge; if one is shared later, the Figma rules in §4 apply to it.
- **Language**: TypeScript everywhere (strict)

Do not introduce new libraries without explicit approval.

---

## 2. The Single Source of Truth

[docs/project.md](docs/project.md) is the authoritative record of every feature, table, RPC, edge function, cron job, and RLS policy in the project.

**Doc-first rule:** the doc is updated **before** code is written. If the doc and code disagree, the doc wins and the code is fixed.

---

## 3. The Scope Gate (run before ANY build)

Before writing a single line of code for a new feature, the lead must verify in this order:

0. **Scope read (MANDATORY).** Read these three docs first — none of them are auto-loaded into the chat, so the lead must read them explicitly at the start of every new feature, every audit, and every "is this in scope?" question. Skipping this step is the #1 cause of off-scope work:
   - [docs/scope/scope-final.md](docs/scope/scope-final.md) — locked scope (transcription of the FRD: what each feature is supposed to do).
   - [docs/project.md](docs/project.md) — current state of every feature/table/RPC/RLS policy.
   - [docs/decisions.md](docs/decisions.md) — past decisions that override or refine scope.
   - For UI features, ALSO re-read the relevant FR section in scope-final.md and [docs/design-system.md](docs/design-system.md) per §4 Frontend rule 5.
   - If the user's request contradicts scope, STOP and ask before building. A symptom report ("this field doesn't save") is **not** authorization to build — it may be something scope deliberately excludes (e.g. notifications, Slack/Jira, analytics are out of scope).
1. **Doc check** — is this feature already in [docs/project.md](docs/project.md)?
   - If yes → update the entry.
   - If no → add the entry first.
2. **Design check** — does [docs/design-system.md](docs/design-system.md) cover the components/patterns needed? If a new pattern is needed, add it there first (or ask the user if it changes the look and feel). If a Figma design exists for the feature, it overrides.
3. **Database check** — are required tables, columns, and RLS policies present?
   - If missing → backend agent creates them via Supabase MCP, doc-keeper records them.
4. **Implement** — only after 0, 1, 2, 3 are green.

If any step is unclear, the lead must batch ALL questions and ask the user in one round before proceeding.

---

## 4. Code Standards (enforced by every agent)

### File & Structure
- Files **under 400 lines**. Split when approaching the limit.
- **Component-first** architecture: build reusable pieces first, assemble pages last.
- API calls live in `src/lib/api/` only. Never inline in components or pages.

### Naming
- Components: `PascalCase.tsx` (`IdeaCard.tsx`). Exception: shadcn/ui generated files in `src/components/ui/` keep their kebab-case names (`button.tsx`).
- Other files/folders: `kebab-case` (`query-client.ts`, `form-field-limits.ts`)
- Next.js special files keep framework names (`page.tsx`, `layout.tsx`, `proxy.ts`, ...).
- API utilities grouped under `src/lib/api/` (`src/lib/api/ideas.ts`)
- Env vars: `NEXT_PUBLIC_` prefix for client-side, no prefix for server-only

### Comments (mandatory, simple)
- **Every file** starts with a short header: file name, purpose, brief description.
- **Every function** has a one-line comment explaining what it does.
- Keep them concise. No essays.

### TypeScript
- Explicit types/interfaces for props, API responses, Supabase rows (generated types in `src/types/database.ts`).
- Avoid `any`. Use `unknown` + narrowing if you must.

### Environment & Secrets
- Never hardcode URLs, keys, or headers.
- All secrets in `.env.local` (never committed). `.env.example` lists every variable without values.
- Supabase clients are centralized in `src/lib/supabase/` (`client.ts` browser, `server.ts` server, `proxy.ts` session refresh); env vars are read only in `src/lib/env.ts`. Components never read `process.env` directly.
- The service-role key is never used by the app at runtime (seed/admin scripts only).

### Error Handling
- Global error boundary in the React tree (`global-error.tsx` + route `error.tsx`).
- Toast notifications for user-facing errors.
- All Supabase errors handled in `src/lib/api/*` and returned in a consistent shape.
- Never silently swallow errors.

### Testing
- Unit tests for utilities and API helpers.
- Component/page tests only when explicitly requested or when the feature is critical.
- Database rules (transitions, voting, 15-minute comment window, anonymity) get SQL checks in `supabase/tests/`.

### Frontend / Design Rules (strict)
1. **Build to the design source, never improvise.** IdeaForge has no Figma: use the tokens and patterns in [docs/design-system.md](docs/design-system.md) — no ad-hoc colors, sizes, spacing or typography. If a Figma design is shared later, never develop from screenshots: pull `get_design_context` and build to those exact values.
2. **Only use design tokens.** Colors come from the CSS variables / Tailwind theme in `globals.css` (`bg-surface`, `text-muted-foreground`, ...). No raw hex values or arbitrary Tailwind color classes in components.
3. **Icons: use only the project `<Icon />` component** (`src/components/icons/Icon.tsx`). It wraps `lucide-react` behind a typed name map. **Never import `lucide-react` (or any icon library) anywhere else.** If a needed icon is not in the map, add it to the map — do not import it directly.
4. **Use consistent loading patterns** across the app — one shared `PageLoader` and one shared `ButtonLoader` component. No ad-hoc spinners.
5. **Scope-vs-design check before building.** Read [docs/scope/scope-final.md](docs/scope/scope-final.md) for every UI feature you build. If the design-system patterns are missing something scope requires, or scope mentions behaviour the design doesn't cover — **stop and ask the user to clarify before implementing**. Never silently improvise to bridge the gap; never silently drop a scoped item.
6. **Form input filtering is required.** Name-like fields must not accept numbers, and numeric fields must not accept letters. Apply this to every new or edited form field, not only final validation. Reuse `src/lib/form-input-filters.ts` so filtering behavior stays consistent.
7. **Form validation UI must be consistent.** Use shared inline field errors on `Input`/`Select`/`Textarea`, the shared invalid-field animation, and scroll/focus the first invalid field on submit. Do not add page-specific generic red error text unless the error is truly form-level and cannot belong to one field.
8. **Form field length limits are required.** Every new or edited persisted form field must set a maximum length from `src/lib/form-field-limits.ts` and follow [docs/form-field-limits.md](docs/form-field-limits.md). Limits must match the DB CHECK constraints. Do not hardcode field-specific max lengths in page components.
9. **Search inputs require a minimum of 3 characters before firing a query.** Live/debounced search inputs (ideas list, admin lists, etc.) must NOT push `?q=` to the URL or refetch the RPC until the trimmed input length is `>= 3` (or empty — empty clears the filter). Reasons: avoids `ILIKE '%a%'` full-table scans, prevents server thrash on every keystroke, and keeps the URL clean. If the user explicitly submits (Enter) with 1–2 chars, show a "type at least 3 characters" hint and do nothing. Apply this everywhere a search field exists.
10. **Tables: server-side pagination + filtering only — never client-side.** Every list/table screen (Ideas list, My Ideas tabs, Admin review queue, Admin overdue list) must:
    - Drive pagination via URL search params (`?page=`, `?pageSize=`) read on the server. Default page size is 25; selectable values are 10 / 25 / 50 / 100.
    - Drive search/filter via URL search params (`?q=`, `?status=`, `?category=`, `?owner=`, `?quadrant=`) read on the server. Every filter change re-fetches from Supabase — **never filter or sort an already-loaded array in the browser** to "narrow" results.
    - Use a paginated RPC that returns `{ rows: TRow[], total: bigint }` so the page can render Prev/Next + page-size selector + total count.
    - Render the shared `<Pagination />` component at the bottom of the table — includes page-size selector, Prev/Next, "Page X of Y", and "Showing N of T" total. No ad-hoc inline pagination.
    - Only sort-on-load arrays (rendering the data the RPC already returned in its given order) is allowed client-side; user-applied sorts must round-trip to the RPC via a `?sort=` param (`votes` | `newest` | `updated`).
    - TanStack Table is used in manual mode (`manualPagination`, `manualSorting`, `manualFiltering`) — it renders, it never filters.
    - **Why:** keeps Supabase as the single source of truth, scales beyond the page-load size, lets every filter combination be deep-linkable/refreshable, and prevents stale or partial views.

### Loading & performance
- Use loaders only where they improve UX, not everywhere.
- Use the shared `ButtonLoader` for button pending states.
- Use page-level loaders (`PageLoader` / `loading.tsx`) for route/data loading.
- Use skeletons for cards/tables/lists where content shape is predictable (Kanban columns, idea cards, list rows).
- Keep interactions fast by avoiding unnecessary client fetches, unnecessary re-renders, and repeated queries.
- For every new Supabase query/RPC/flow, check indexes on filter/join/order columns before calling it done.

---

## 5. Supabase Workflow

### Locked target project (HARD RULE)

- **Only ONE Supabase project is allowed for this codebase: `knmqlkhnfumeuxgnkuez`**
  - **Project name:** CloseFuture
  - **Project ref:** `knmqlkhnfumeuxgnkuez`
  - **Region:** `ap-south-1`
- **Until the user fills in the project ref above, NO Supabase MCP write is allowed** (`apply_migration`, `execute_sql` writes, `deploy_edge_function`, branch/project operations). SQL is written as files in `supabase/migrations/` and waits.
- Once set: **every Supabase MCP call must target that ref.** No exceptions. The lead, every subagent, and the user must verify the project ref before any destructive op (`apply_migration`, `execute_sql`, `delete_branch`, `pause_project`, `restore_project`, `deploy_edge_function`, etc.).
- **Never call** `list_projects` to "find" a target — the target is fixed in this rule.
- **Never apply changes to any other project on this account.**
- **If a tool result shows a different project ref than the locked one,** stop immediately and surface to the user — do not proceed.

### Workflow rules

- **All Supabase changes go through Supabase MCP** (tables, RPC, edge functions, cron, RLS, storage). Every change is also saved as a migration file in `supabase/migrations/` so the repo holds all SQL (FRD deliverable 1).
- Agents are authorized to make Supabase changes via MCP **only against the locked project ref**.
- The user does not change Supabase directly either — keeps the doc in sync.
- After any Supabase change, doc-keeper updates [docs/project.md](docs/project.md) immediately.
- Backend-dev MUST load the **`supabase` skill** (`.agents/skills/supabase/`) before any Supabase task and follow it (check the changelog for breaking changes, verify every change with a test query).

### Security model (HARD RULES)

These rules apply to every table, RPC function, and edge function in the project. No exceptions.

1. **RLS is mandatory on every `public.*` table.** Enable (and force) RLS in the same migration that creates the table. Backend may add policies; never disable RLS.
2. **Admin-only writes by default.** For every important table, the RLS policy set is:
   - `SELECT` — gated by visibility (draft = author only, non-draft = all authenticated) / ownership / admin.
   - `INSERT` / `UPDATE` / `DELETE` — **admin only via `public.is_admin()` predicate.** Non-admin users CANNOT directly mutate rows.
   - **Workflow exception (stricter):** on `ideas` workflow columns (status, scores, owner, target date, demo fields) and on history tables (`status_history`, `owner_history`, `audit_log`), **no role — admin included — may write directly.** These change only through RPCs, because the FRD requires every transition to pass the transition rules and be logged. A guard trigger enforces this.
3. **User-facing writes go through RPC functions, not direct DML.** When a user (non-admin) needs to insert / update / delete rows (create/edit/delete idea, submit, withdraw, vote, comment, follow, progress update, mark done), the backend exposes a function the user calls. The function validates auth, business rules, and (optionally) a server-side secret before performing the write.
4. **Prefer `SECURITY INVOKER` for RPC functions.** A function should run with the caller's privileges (and thus respect their RLS) unless there is a documented reason to elevate. Only use `SECURITY DEFINER` when the function MUST bypass RLS — e.g. writing an idea row on a Member's behalf after passing all in-function validation, or writing history rows.
5. **Every `SECURITY DEFINER` function MUST:**
   - Pin `SET search_path = public, pg_temp` (prevents schema-search-path attacks).
   - Validate `auth.uid()` inside the function — never trust the caller.
   - Enforce business rules in PL/pgSQL (e.g. "the caller is the author", "status is editable", "the transition is allowed for this role", "the comment is < 15 minutes old").
   - For sensitive server-only operations, **require a server-side secret** passed as an argument: `IF p_secret IS DISTINCT FROM current_setting('app.<feature>_secret') THEN RAISE EXCEPTION 'unauthorized'; END IF;`. The secret lives in app config, never in source. (No IdeaForge feature currently needs one — record it in decisions.md if one is added.)
   - Be `REVOKE ALL ... FROM PUBLIC` and `GRANT EXECUTE ... TO authenticated` (or `anon` only when truly intended — nothing in IdeaForge is anon).
   - Log to `audit_log` if the action is auditable (status changes, scoring, owner assignment, mark done, deletes).
6. **No raw SQL writes from the client.** Frontend calls TanStack Query → `src/lib/api/*` → Supabase JS → RPC function. Direct `.from('table').insert(...)` / `.update(...)` / `.delete(...)` from the client is forbidden.
7. **Role-based access uses JWT claims, not DB lookups.** A Postgres-backed **Custom Access Token Hook** (`public.custom_access_token_hook`) reads `profiles.role` and injects `app_metadata.role ∈ {admin, member}` into every JWT issued by Supabase Auth. Role-check predicates (`is_admin()`, `is_member()`) read from `auth.jwt() -> 'app_metadata' ->> 'role'` — constant-time, no DB hit per policy check. Role changes require re-login (acceptable for an admin-rare event). `profiles.role` remains the stored value (FRD-1.2).
8. **Helper predicates live in `public.*`** with `SET search_path = public, pg_temp`: e.g. `public.is_admin()`, `public.is_member()`, `public.is_idea_author(uuid)`, `public.is_idea_owner(uuid)`, `public.can_see_idea(uuid)`. Mark them `STABLE` and `SECURITY INVOKER` (the Custom Access Token Hook itself is the only SECURITY DEFINER helper — required by Supabase). **Always wrap helper calls inside RLS policies with `(SELECT helper())`** — this makes the planner evaluate the helper once per query instead of per row (5–100× faster).
9. **RLS policies are reviewed in a doc BEFORE being applied.** Backend writes the policy set to [docs/rls-policies-draft.md](docs/rls-policies-draft.md) (or per-feature equivalent); user reviews; then backend applies via `apply_migration`.
10. **Anonymity is a security rule, not a UI rule.** The anonymous author's identity must never reach a Member's browser — not in idea rows, comments, status history, votes/follows, realtime payloads, or storage paths. Masking happens in the database (views / RPC return shapes / column grants).
11. **Index every FK column** and every column used in filters, joins and `ORDER BY` of list RPCs.

> **Mental model:** RLS is the lockdown floor (deny everything except admin). RPC functions are the keyed doors users walk through — each one self-validates before granting access. SECURITY INVOKER is the default door; SECURITY DEFINER is the master-key door, reserved for narrow cases. Workflow columns have no door except the RPCs — not even for admins.

### Realtime

- Realtime updates default to **Supabase Broadcast**.
- Use normal Supabase queries (via `src/lib/api/*`) for initial page load, then subscribe to **private, authorized** Broadcast channels for live updates.
- Use Broadcast for: Kanban board moves, vote counts, comment threads, status changes on the detail page, progress updates, Admin dashboard counts, review queue and overdue list.
- Broadcast payloads carry **IDs and event types only** (e.g. `{ idea_id, event: 'status_changed' }`); the client then invalidates the matching TanStack Query keys and refetches through RLS. Never put author names or idea content in payloads (protects anonymity, §5 rule 10).
- Only use Postgres Changes when there is a documented reason Broadcast is not suitable (record it in decisions.md).
- All Broadcast channels must be private and authorized with RLS on `realtime.messages`; **never expose admin channels (`admin:*`) to Members.**
- Before implementing Realtime, verify current Supabase docs (via the `supabase` skill) and pick the right tool.

---

## 6. Workflow Rules

- **Do only what is asked.** No bonus features, refactors, or installs.
- **Ask all questions upfront** in a single batch — never one at a time.
- **Documentation-first**: doc → code, always.
- **No scope creep**: if the task seems incomplete, ask before expanding.
- **Decision logging (no silent decisions).** When building a feature, any choice that isn't already settled by scope/design/the doc must be handled one of two ways — never silently:
  1. **High-impact / hard-to-reverse / ambiguous** (changes scope, UX, data model, security, or has no obvious default) → **ASK the user first**, batched, before building.
  2. **Smaller implementation decision you can reasonably make yourself** → make it, then **record it in [docs/decisions.md](docs/decisions.md)** with: date, feature, the decision, the reason, alternatives considered, and a reversibility note — and **surface it to the user** in your end-of-task summary.
  - When unsure which bucket a choice falls in, prefer to ask.
  - Every autonomous decision must be visible to the user via `docs/decisions.md` — the user must never be left unaware of a decision that shaped the build.
- **Git:** commit or push only when the user asks.

---

## 7. Agent Roster (single chat, lead orchestrates)

The role definitions below remain in `.claude/agents/` as shared project resources. Codex must explicitly read the relevant role file before delegating; these files are not automatically registered as Codex agents. Use Codex delegation tools when available, passing the role instructions and a clear task. If delegation is unavailable, the lead may perform the roles sequentially while preserving their responsibilities and all scope, documentation, security, and review gates.

Project-local Codex skills live in `.agents/skills/`: use `supabase` for Supabase work and `tailwind-design-system` for Tailwind design-system work. Read the relevant `SKILL.md` and only the supporting references needed for the task. If a required file or tool is unavailable, report the limitation before performing dependent work.

| Agent | Lives in | Role | Can edit |
|---|---|---|---|
| **lead** | main chat | Orchestrator. Runs scope gate, routes work, enforces rules, talks to user. | Delegates when available; otherwise performs the roles sequentially as described above |
| **backend-dev** | `.claude/agents/backend-dev.md` | Supabase work via MCP: tables, RPC, edge, cron, RLS, storage, realtime auth. Server-side logic. | `src/lib/api/`, `src/lib/supabase/`, `src/lib/env.ts`, `src/types/database.ts`, `supabase/**`, MCP |
| **frontend-dev** | `.claude/agents/frontend-dev.md` | UI: pages, components, hooks, styling, TanStack Query usage. | `src/app/**`, `src/components/**`, `src/hooks/**`, `src/lib/` (except `api/`, `supabase/`), `src/lib/api/` (read), styles |
| **doc-keeper** | `.claude/agents/doc-keeper.md` | Updates [docs/project.md](docs/project.md), [docs/decisions.md](docs/decisions.md) and other docs. Runs before backend/frontend agents. | `docs/**` only |
| **tester** | `.claude/agents/tester.md` | QA when explicitly requested. Runs tests, hits endpoints, reports bugs. | `tests/**`, `supabase/tests/**`, Bash for test commands |

The lead has authorization to spawn any agent, update the doc, and proceed without per-step approval. The user starts a fresh chat per feature.

---

## 8. Per-Feature Loop

```
1. User describes feature in a fresh chat.
2. Lead reads AGENTS.md + docs/scope/scope-final.md + docs/project.md + docs/decisions.md.
3. Lead runs the scope gate. Asks all questions in one batch if anything unclear.
4. Doc-keeper updates docs/project.md with the planned change.
5. Backend-dev makes any Supabase changes via MCP (RLS draft reviewed first), builds RPC/edge/etc.
6. Frontend-dev builds UI against the documented contract.
7. (Optional) Tester runs checks if user requests.
8. Lead verifies rules compliance, reports result + any logged decisions to user.
```

---

## 9. Folder Structure

```
AGENTS.md                   Codex project rules (this file)
CLAUDE.md                   Original Claude Code project rules
src/
  app/                      Next.js App Router pages
  components/               Reusable UI (PascalCase.tsx)
    ui/                     shadcn/ui components
    icons/Icon.tsx          The only icon entry point
  hooks/                    Custom React hooks
  lib/
    api/                    API call functions, grouped by domain (ideas.ts, comments.ts, ...)
    supabase/               client.ts, server.ts, proxy.ts
    env.ts                  The only place that reads process.env
    query-client.ts         TanStack QueryClient factory
    form-input-filters.ts   Shared input filtering
    form-field-limits.ts    Shared max lengths (mirror DB CHECKs)
  types/                    TypeScript interfaces (+ generated database.ts)
  proxy.ts                  Session refresh + optimistic route guards
supabase/
  migrations/               All SQL (tables, constraints, RLS, functions, storage)
  seed.sql                  1 admin, 3 members, ≥2 ideas per status
  tests/                    SQL rule checks
docs/
  project.md                THE doc — single source of truth
  decisions.md              Decision log
  design-system.md          Design source (tokens, components, patterns)
  form-field-limits.md      Field limit policy
  rls-policies-draft.md     RLS drafts for review
  scope/scope-final.md      Locked scope (FRD)
.claude/
  agents/                   Shared agent role definitions (read explicitly by Codex)
.agents/
  skills/                   Codex skills: supabase, tailwind-design-system
.env.local                  Secrets (never committed)
```

---

## 10. Quick Reference

| Rule | Summary |
|---|---|
| File size | < 400 lines |
| Architecture | Component-first |
| State | TanStack Query only |
| API calls | `src/lib/api/` only |
| Env vars | `.env.local` via `src/lib/env.ts` + `src/lib/supabase/` |
| Comments | File header + per-function one-liner |
| Errors | Boundary + toasts + API-layer handling |
| TypeScript | Explicit types, avoid `any` |
| Icons | `<Icon />` only, never import lucide directly |
| Tables | Server-side pagination/filter/sort via URL params + paginated RPC |
| Search | ≥ 3 chars before querying |
| Docs | Update [docs/project.md](docs/project.md) first |
| Supabase | MCP only, locked project ref (TBD), `supabase` skill |
| Security | RLS everywhere, admin-only DML, users write via RPC, workflow columns RPC-only for everyone |
| Realtime | Private Broadcast, ID-only payloads |
| Scope check | Scope → Doc → Design → Database → Implement |
| Commands | Do only what is asked |
| Clarification | All questions upfront, one batch |
| Decisions | Ask if high-impact; else log in [docs/decisions.md](docs/decisions.md) + tell the user — never silent |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
