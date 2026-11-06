# Idea AI chat — implemented 2026-11-06

User approved AI chat in the idea-detail dialog, sending idea content to Google,
and permanent conversations private to each user and idea. Access policies approved by the user on 2026-11-06. Schema and application implementation complete; Google activation pending.

## Interface and behavior

Add an Ask AI tab to the existing detail dialog. Show timestamped messages,
an empty-state explanation, a bounded message scroller, a question textarea and
Send with the shared pending indicator. Reuse existing tokens and inline errors.
Load older messages through server pagination, preserving chronological display.
Closing/reopening the dialog restores the signed-in user's saved conversation.
Changing ideas or signing out must never retain another conversation onscreen.

The server validates the session and idea UUID, fetches the idea through existing
sanitized authorized RPCs, and sends only content fields and this user's recent
conversation to Gemini. Exclude author/profile identifiers, signed Storage URLs,
comments and other users' conversations. Treat idea text as untrusted context;
answer questions about this idea, acknowledge missing facts, and perform no writes
to the idea. The model has no database credentials or tools.

Use Google's REST API without adding dependencies. Keep the Google API key and
model configuration server-only in the centralized environment module. Verify a
currently available free-tier text model before implementation; no paid fallback.
Google free-tier quotas can reject requests. Surface failures without losing the
saved question or claiming an answer was saved. Never log prompts or credentials.

User clarification (2026-11-06): Google free-tier models only. Use a Google API
project without paid billing enabled; a free-tier-capable model alone does not
guarantee free requests on a billed project. Do not enable billing or fall back
to paid models/providers. On quota exhaustion, keep history and show an error.

## Approved persistence and access contract

Table `idea_chat_messages`: UUID id, idea_id FK to ideas, user_id FK to profiles,
role (user/assistant), content, created_at, request_id and reply_to FK to this
table. Index idea_id/user_id/created_at/id for chronological keyset pagination,
user_id for FK coverage, and reply_to; enforce one answer per question.
Set question cap to 4000 characters and answer cap to 16000 in DB CHECKs and the
shared field-limits module. Content must contain non-whitespace text.

- ENABLE and FORCE RLS in the creation migration.
- SELECT: authenticated user_id = auth.uid() AND can_see_idea(idea_id).
  Admins receive no exception for another user's chats.
- No direct INSERT, UPDATE or DELETE grants/policies, including Admins.
- No anonymous grants or realtime publication of message content.
- Validated RPCs provide paginated history and save questions under auth.uid();
  callers cannot supply a different user ID or forge an assistant message.
- Saving assistant responses is server-only, protected with a dedicated secret
  checked inside the RPC as required by AGENTS.md §5.5. The secret is
  configured in Vault and ignored .env.local, never exposed to the browser. This is a new
  sensitive server operation; record configuration and rotation before use.
- Every elevated RPC pins search_path, checks auth.uid(), visibility, message
  ownership, role and limits, revokes PUBLIC execution and explicitly grants
  intended authenticated execution. No service-role runtime key.
- Reserve request IDs idempotently and reject concurrent pending requests for
  the same user/idea; expire abandoned reservations so retries can recover.
  Enforce per-user request bounds in the database, across server instances.
- Retain messages indefinitely while their idea/user exists; removal of those
  parent records cascades to messages. Losing idea visibility blocks history too.

Security verification must prove cross-user reads/writes and forged assistant
messages fail, including Admin access to another user's chat, draft invisibility,
revoked visibility, repeated requests, pagination and anonymous-author masking.

## Current status

RLS review approved and both migrations applied to the locked project. API/UI,
34 unit tests, rollback security tests and desktop/mobile browser checks pass.
Browser replies were mocked; no live Google call is claimed. Google credentials
and confirmation that billing is disabled are still required.

## Implementation decisions — 2026-11-06

Use gemini-3.5-flash-lite only, with 2048 output tokens and a 30-second timeout.
Store the assistant-write secret in Supabase Vault, generate it inside the
migration, and compare it only inside elevated RPCs. Vault avoids embedding
secrets in migrations or relying on pooled connection settings. Use 20 requests
per user per hour and one active request per idea/user with a two-minute lease.
History uses 25-message keyset pages; model context uses the latest 20 messages
within a 24000-character budget. Failed requests retain their question and can
be retried by request ID without duplicating it. Never send links or identities.

History reads use SECURITY INVOKER and the approved row/column grants; only
validated write functions need SECURITY DEFINER. This minimizes elevation.

## Verification and advisor review

Applied migrations: 20261106095150_private_idea_ai_chat and
20261106095709_idea_chat_invoker_history. Fresh-install snapshot users apply both
after install.sql; Vault must be available. The existing snapshot is unchanged.
Security advisor reports intentional authenticated DEFINER write entry points;
they validate identity/visibility and require the server-only secret because
users have no direct write grants. History uses INVOKER. See
https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
for the general advisory. Existing no-policy RPC-only tables and disabled leaked
password protection are unchanged. The new table has a SELECT policy and forced
RLS. Every FK is indexed, including reply_to via its unique constraint.

To activate, follow README.md's Idea AI chat setup. The Google project must have
billing disabled; the app cannot query billing status using a Gemini key.
