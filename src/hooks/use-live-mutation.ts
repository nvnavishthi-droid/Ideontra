// use-live-mutation.ts — Shared pending state, popup errors and query invalidation.
"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Feedback } from "@/components/shared/FeedbackDialog";
// Preserve form values on errors and refresh all user-visible data after writes.
export function useLiveMutation<T>(
  operation: (values: T) => Promise<unknown>,
  onSuccess?: () => void,
) {
  const router = useRouter();
  const client = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const mutation = useMutation({
    mutationFn: operation,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["live"] });
      router.refresh();
      onSuccess?.();
    },
    onError: (error) =>
      setFeedback({ title: "Could not save", message: error.message }),
  });
  return { ...mutation, feedback, setFeedback };
}
