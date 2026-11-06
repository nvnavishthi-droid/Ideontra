<!-- query-index-audit.md — Verified query/index coverage and plan limitations. -->
# Query index audit

Verified live on 2026-11-06 after MCP authentication recovered. Project URL matches
knmqlkhnfumeuxgnkuez. Live index inventory and relevant RPC definitions match the
saved schema. Both prepared indexes are applied, valid and ready.

| Table | Existing query coverage |
| --- | --- |
| profiles | Primary key for identity joins; full_name/id for owner ordering |
| ideas | Primary key; status/submitted_at/id; category; owner; quadrant; target date; created/id; updated/id; trigram search expression |
| idea_private_details | idea_id primary key; submitter_id lookup |
| idea_votes | idea_id/user_id unique index covers counts and membership; user_id index |
| idea_followers | idea_id/user_id unique index covers counts and membership; user_id index |
| idea_comments | idea_id/created_at thread lookup; parent_comment_id; user_id |
| idea_status_history | idea_id/changed_at history; changed_by |
| idea_owner_history | idea_id/assigned_at history; owner_id; assigned_by |
| idea_progress_updates | idea_id/created_at updates; user_id |
| audit_log | idea_id/occurred_at; actor_id; occurred_at |

Every live public-table foreign key has leading index coverage. Do not create an index on
every column or duplicate existing primary/unique indexes.

## Applied indexes

- Partial comments index on idea_id where deleted_at is null: matches active
  comment counts in get_idea_summary while preserving deleted reply placeholders.
- Partial ideas index on target_date where status is In Progress: matches the
  overdue count in get_admin_dashboard with a smaller date index.

Migration: [20261106071758_query_driven_partial_indexes.sql](../../supabase/migrations/20261106071758_query_driven_partial_indexes.sql).
No equivalent partial indexes existed. Existing full indexes remain useful for
other queries and were retained. CLI was unavailable; the filename uses the
version assigned by MCP, confirmed against the live migration ledger.

## Verification results

1. Live pg_indexes, foreign keys, table sizes and relevant RPC definitions checked.
   No public foreign key lacks leading index coverage; all ten tables have RLS
   enabled and forced.
2. EXPLAIN (ANALYZE, BUFFERS) before/after: overdue count changes from the general
   target-date index scan plus status filter to an index-only scan using
   ideas_in_progress_target_idx. Active comments still use a sequential scan on
   the tiny table. No forced planner settings or large-data speedup claims.
3. Both new indexes report indisvalid=true and indisready=true. Migration applied
   with a two-second lock timeout and 30-second statement timeout.
4. Performance advisors report existing unused-index information and the existing
   duplicate followers index. Security advisors retain known intentional
   policy-free RPC-only tables, callable DEFINER RPCs, and disabled leaked-password
   protection. This change adds no policies/functions/grants. Schema snapshot and
   project record updated; no employee or idea records modified.

list_ideas materializes its visible and filtered CTEs. Mode filtering and dynamic
sorting occur after materialization; extra base-table indexes cannot automatically
remove that work. Vote ordering uses a computed count, not an indexable stored
vote-count column. Query rewrites require separate review with live plans.

The live followers schema has two equivalent idea_id/user_id unique indexes.
No removal performed; checking constraint dependencies and usage is separate work.
No Auth, Storage, Realtime managed-schema indexes or permissions are changed.

References: [Query optimization](https://supabase.com/docs/guides/database/query-optimization),
[duplicate-index advisor](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index).
