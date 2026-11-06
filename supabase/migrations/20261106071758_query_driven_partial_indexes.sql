-- query_driven_partial_indexes — Targeted indexes for existing RPC predicates.
-- Locked project: knmqlkhnfumeuxgnkuez. No data or permission changes.
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
-- Count active comments without scanning deleted placeholders.
CREATE INDEX IF NOT EXISTS idea_comments_active_idea_idx
  ON public.idea_comments (idea_id) WHERE deleted_at IS NULL;
-- Count overdue execution work using only In Progress target dates.
CREATE INDEX IF NOT EXISTS ideas_in_progress_target_idx
  ON public.ideas (target_date) WHERE status = 'In Progress';
