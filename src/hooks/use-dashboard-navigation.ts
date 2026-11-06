// use-dashboard-navigation.ts — Immediate URL selections backed by shared server queries.
"use client";
import { createContext, useContext } from "react";
interface DashboardNavigationState {
  pending: boolean;
  prefetch: (patch: Record<string, string>, resetPage?: boolean) => void;
}
export const DashboardNavigationContext = createContext<DashboardNavigationState>({
  pending: false,
  prefetch: () => {},
});
// Share pending state and update History without waiting for a full RSC navigation.
export function useDashboardNavigation() {
  const context = useContext(DashboardNavigationContext);
  // Apply a parameter patch while preserving unrelated dashboard state.
  function navigate(patch: Record<string, string>, resetPage = true) {
    const next = new URLSearchParams(window.location.search);
    if (resetPage) next.delete("page");
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (next.toString() !== new URLSearchParams(window.location.search).toString())
      window.history.pushState(null, "", `/?${next.toString()}`);
  }
  return { navigate, ...context };
}
