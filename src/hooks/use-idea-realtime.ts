// use-idea-realtime.ts — Invalidate query data after authorized private events.
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeIdeas } from "@/lib/api/realtime";
import type { AuthIdentity } from "@/types/auth";
// Coalesce duplicate database events and refetch after reconnect.
export function useIdeaRealtime(
  user: AuthIdentity,
  onError: (message: string) => void,
) {
  const router = useRouter();
  const { id, role, name, email } = user;
  const queries = useQueryClient();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Group related row/history events into one refresh.
    function refresh() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void queries.invalidateQueries({ queryKey: ["live"] });
        router.refresh();
      }, 250);
    }
    const stop = subscribeIdeas({ id, role, name, email }, refresh, onError);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [id, role, name, email, router, queries, onError]);
}
