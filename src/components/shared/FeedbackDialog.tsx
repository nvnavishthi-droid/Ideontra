// FeedbackDialog.tsx — Popup feedback rather than toast notifications.
"use client";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/Icon";
export interface Feedback {
  title: string;
  message: string;
  success?: boolean;
}
// Show an actionable popup without discarding the underlying form.
export function FeedbackDialog({
  feedback,
  onClose,
}: {
  feedback: Feedback | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!feedback}
      onClose={onClose}
      title={feedback?.title ?? "Feedback"}
      description={feedback?.message ?? ""}
    >
      <Icon
        name={feedback?.success ? "success" : "alert"}
        className={feedback?.success ? "text-primary" : "text-muted-foreground"}
        size={32}
      />
      <div className="flex justify-end">
        <Button onClick={onClose}>Return</Button>
      </div>
    </Modal>
  );
}
