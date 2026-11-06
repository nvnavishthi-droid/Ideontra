-- query-indexes-draft.sql — Review copy; applied and verified 2026-11-06.
-- Canonical SQL: supabase/migrations/20261106071758_query_driven_partial_indexes.sql.
-- Target: knmqlkhnfumeuxgnkuez only.
-- Active comment counts in get_idea_summary exclude deleted placeholders.
CREATE INDEX IF NOT EXISTS idea_comments_active_idea_idx
  ON public.idea_comments (idea_id) WHERE deleted_at IS NULL;

-- Admin dashboard counts overdue In Progress ideas by target date.
-- Keep current_date in the query, not in the immutable index predicate.
CREATE INDEX IF NOT EXISTS ideas_in_progress_target_idx
  ON public.ideas (target_date) WHERE status = 'In Progress';
