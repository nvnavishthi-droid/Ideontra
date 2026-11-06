// use-dashboard-navigation.ts — URL-based server navigation for all dashboard controls.
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
// Update URL parameters and let the server fetch the next result set.
export function useDashboardNavigation() {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  // Apply a parameter patch while preserving unrelated dashboard state.
  function navigate(patch: Record<string, string>, resetPage = true) {
    const next = new URLSearchParams(search.toString());
    if (resetPage) next.delete("page");
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() =>
      router.push(`/?${next.toString()}`, { scroll: false }),
    );
  }
  return { navigate, pending };
}
