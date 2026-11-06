// MutationFeedback.tsx — Reusable popup for asynchronous action failures.
"use client";
import { FeedbackDialog, type Feedback } from "./FeedbackDialog";
// Keep feedback presentation identical across persisted forms.
export function MutationFeedback({
  feedback,
  onClose,
}: {
  feedback: Feedback | null;
  onClose: () => void;
}) {
  return <FeedbackDialog feedback={feedback} onClose={onClose} />;
}
