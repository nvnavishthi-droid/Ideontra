// dashboard-client.ts — Abortable dashboard reads and normalized user-scoped keys.
import type { DashboardFilters } from "@/types/idea";
import type { DashboardSnapshot } from "@/types/dashboard";
// Isolate result pages by authenticated user, role and every server query parameter.
export function dashboardKey(userId: string, filters: DashboardFilters) {
  return ["live", "dashboard", userId, {
    ...filters,
    personal: filters.view === "my" ? filters.personal : "drafts",
    layout: filters.view === "admin" ? "list" : filters.layout,
  }] as const;
}
// Fetch a server-filtered page, allowing obsolete navigation requests to be cancelled.
export async function fetchDashboard(
  filters: DashboardFilters, signal?: AbortSignal,
): Promise<DashboardSnapshot> {
  const params = new URLSearchParams();
  Object.entries({ ...filters, tab: filters.personal }).forEach(([key, value]) => {
    if (key !== "role" && key !== "personal") params.set(key, String(value));
  });
  const response = await fetch(`/api/dashboard?${params}`, {
    signal, cache: "no-store", credentials: "same-origin",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Could not load ideas.");
  return body as DashboardSnapshot;
}
