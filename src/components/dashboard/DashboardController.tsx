// DashboardController.tsx — Keep URL selections immediate and cache server result pages.
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dashboard } from "./Dashboard";
import { DashboardNavigationContext } from "@/hooks/use-dashboard-navigation";
import { parseFilters } from "@/lib/dashboard-filters";
import { dashboardKey, fetchDashboard } from "@/lib/api/dashboard-client";
import type { DashboardSnapshot } from "@/types/dashboard";
import type { AuthIdentity } from "@/types/auth";
// Reuse server hydration, cached pages and interruptible reads without stale filtered rows.
export function DashboardController({ user, initial }: {
  user: AuthIdentity; initial: DashboardSnapshot;
}) {
  const search = useSearchParams();
  const client = useQueryClient();
  const filters = parseFilters({ ...Object.fromEntries(search), role: user.role });
  const [seed] = useState(initial);
  const seedKey = JSON.stringify(dashboardKey(user.id, seed.data.filters));
  const key = dashboardKey(user.id, filters);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetchDashboard(filters, signal),
    initialData: JSON.stringify(key) === seedKey ? () => seed : undefined,
    staleTime: 60_000,
    retry: false,
  });
  // Preload only one adjacent page so normal Next clicks can use its cached response.
  useEffect(() => {
    if (!query.data || filters.view === "admin" || query.isStale) return;
    const current = query.data.data;
    if (current.filters.page * current.filters.pageSize >= current.total) return;
    const next = { ...current.filters, page: current.filters.page + 1 };
    void client.prefetchQuery({
      queryKey: dashboardKey(user.id, next),
      queryFn: ({ signal }) => fetchDashboard(next, signal),
      staleTime: 60_000,
    });
  }, [client, user.id, query.data, query.isStale, filters.view]);
  // Warm a likely destination without changing the selected URL or rendering its rows.
  function prefetch(patch: Record<string, string>, resetPage = true) {
    const params = new URLSearchParams(window.location.search);
    if (resetPage) params.delete("page");
    for (const [name, value] of Object.entries(patch)) {
      if (value) params.set(name, value); else params.delete(name);
    }
    const next = parseFilters({ ...Object.fromEntries(params), role: user.role });
    void client.prefetchQuery({
      queryKey: dashboardKey(user.id, next),
      queryFn: ({ signal }) => fetchDashboard(next, signal),
      staleTime: 60_000,
    });
  }
  const snapshot = query.data ?? {
    data: { rows: [], total: 0, filters, counts: {}, categoryCounts: {} },
    review: [], overdue: [],
  };
  return (
    <DashboardNavigationContext.Provider value={{ pending: query.isFetching, prefetch }}>
      <Dashboard user={user} {...snapshot}
        data={{ ...snapshot.data, filters: { ...filters,
          page: query.data?.data.filters.page ?? filters.page } }}
        loading={query.isPending} loadError={query.error?.message}
        onRetry={() => { void query.refetch(); }} />
    </DashboardNavigationContext.Provider>
  );
}
