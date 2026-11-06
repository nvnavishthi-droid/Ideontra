// Discussion.tsx — Persisted one-level comments, replies and timed author edits.
"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/FormField";
import { Modal } from "@/components/shared/Modal";
import { MutationFeedback } from "@/components/shared/MutationFeedback";
import { ButtonLoader } from "@/components/shared/Loaders";
import { useLiveMutation } from "@/hooks/use-live-mutation";
import { writeComment } from "@/lib/api/ideas";
import { fieldLimits } from "@/lib/form-field-limits";
import type { Comment } from "@/types/live";
// Preserve conversation structure and leave database time/ownership checks authoritative.
export function Discussion({
  ideaId,
  comments,
}: {
  ideaId: string;
  comments: Comment[];
}) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [target, setTarget] = useState<Comment | null>(null);
  const [mode, setMode] = useState<"comment" | "reply" | "edit">("comment");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Comment | null>(null);
  const mutation = useLiveMutation(writeComment, () => {
    setMode("comment");
    setValue("");
    setTarget(null);
    setDeleting(null);
  });
  // Validate and persist the current comment or reply.
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) {
      setError("Enter a comment.");
      document.getElementById("comment-text")?.focus();
      return;
    }
    setError("");
    mutation.mutate({
      ideaId,
      content: value,
      commentId: mode === "edit" ? target?.id : undefined,
      parentId: mode === "reply" ? target?.id : undefined,
    });
  }
  // Render a single sanitized comment; replies do not expose another reply action.
  function renderComment(comment: Comment, reply = false) {
    const editable =
      comment.is_own &&
      !comment.deleted_at &&
      new Date(comment.created_at).getTime() + 900000 > now;
    return (
      <article
        key={comment.id}
        className={
          reply
            ? "ml-4 flex flex-col gap-3 border-l pl-4"
            : "panel flex flex-col gap-3 p-4"
        }
      >
        <p className="text-xs text-muted-foreground">
          {comment.author_name ?? "Anonymous"} ·{" "}
          {format(new Date(comment.created_at), "dd MMM yyyy, HH:mm")}
        </p>
        <p className={comment.deleted_at ? "text-muted-foreground" : ""}>
          {comment.deleted_at ? "Comment deleted" : comment.content}
        </p>
        <div className="flex gap-3 text-xs">
          {!reply && (
            <button
              className="text-link"
              onClick={() => {
                setTarget(comment);
                setMode("reply");
                setValue("");
              }}
            >
              Reply
            </button>
          )}
          {editable && (
            <>
              <button
                className="text-link"
                onClick={() => {
                  setTarget(comment);
                  setMode("edit");
                  setValue(comment.content);
                }}
              >
                Edit
              </button>
              <button
                className="text-destructive"
                onClick={() => setDeleting(comment)}
              >
                Delete
              </button>
            </>
          )}
        </div>
        {!reply &&
          comments
            .filter((c) => c.parent_comment_id === comment.id)
            .map((c) => renderComment(c, true))}
      </article>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">
        Comments · {comments.filter((c) => !c.deleted_at).length}
      </h3>
      {!comments.length && (
        <p className="text-muted-foreground">No comments yet.</p>
      )}
      {comments
        .filter((c) => !c.parent_comment_id)
        .map((c) => renderComment(c))}
      <p className="text-xs text-muted-foreground">
        You can edit or delete your own comment within 15 minutes.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <FormField
          id="comment-text"
          label={
            mode === "reply"
              ? "Your reply"
              : mode === "edit"
                ? "Edit your comment"
                : "Your comment"
          }
          error={error}
        >
          <Textarea
            id="comment-text"
            maxLength={fieldLimits.comment}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!error}
          />
        </FormField>
        <div className="flex justify-end gap-3">
          {mode !== "comment" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMode("comment");
                setTarget(null);
                setValue("");
              }}
            >
              Cancel
            </Button>
          )}
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending && <ButtonLoader />}
            {mode === "edit"
              ? "Save comment"
              : mode === "reply"
                ? "Post reply"
                : "Post comment"}
          </Button>
        </div>
      </form>
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete your comment?"
        description="Replies remain visible beneath a deleted comment placeholder."
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                ideaId,
                content: "",
                commentId: deleting?.id,
                remove: true,
              })
            }
          >
            Delete comment
          </Button>
        </div>
      </Modal>
      <MutationFeedback
        feedback={mutation.feedback}
        onClose={() => mutation.setFeedback(null)}
      />
    </div>
  );
}
