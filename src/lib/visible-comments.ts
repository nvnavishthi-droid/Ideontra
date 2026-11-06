// visible-comments.ts — Keep deleted branches out of cached discussion rendering.
import type { Comment } from "@/types/live";
// Retain live roots and their live replies without showing deleted placeholders.
export function getVisibleComments(comments: Comment[]): Comment[] {
  const roots = new Set(comments
    .filter((comment) => !comment.deleted_at && !comment.parent_comment_id)
    .map((comment) => comment.id));
  return comments.filter((comment) => !comment.deleted_at &&
    (!comment.parent_comment_id || roots.has(comment.parent_comment_id)));
}
