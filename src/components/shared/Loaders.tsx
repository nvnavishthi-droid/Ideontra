// Loaders.tsx — Consistent action and page loading indicators.
import { Icon } from "@/components/icons/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "./LoadingRegion";
import { DashboardSkeleton, type DashboardSkeletonVariant } from "./DashboardSkeleton";
import { AuthSkeleton } from "./ContentSkeletons";
// Render the shared pending button indicator.
export function ButtonLoader() {
  return <Icon name="loader" className="animate-spin" />;
}
// Keep dashboard controls usable while a newly selected result page loads.
export function ResultsLoader({ variant = "table", extraColumn = false, boardColumns = 9 }: {
  variant?: DashboardSkeletonVariant; extraColumn?: boolean; boardColumns?: number;
}) {
  return (
    <LoadingRegion label="Loading results" variant={variant}
      className={variant === "admin" ? "dashboard-overview" :
        `${variant === "table" ? "panel " : ""}results-scroll`}>
      <DashboardSkeleton variant={variant} extraColumn={extraColumn} boardColumns={boardColumns} />
    </LoadingRegion>
  );
}
// Match the fixed dashboard shell or the authentication card during route loading.
export function PageLoader({ variant = "dashboard" }: { variant?: "dashboard" | "auth" }) {
  if (variant === "auth") return <AuthSkeleton />;
  return (
    <LoadingRegion label="Loading ideas" variant="dashboard" className="dashboard-shell">
      <header className="shrink-0 border-b bg-card">
        <div className="app-container flex h-16 items-center gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="hidden h-4 w-40 md:block" />
          <Skeleton className="ml-auto size-10 rounded-full" />
        </div>
      </header>
      <div className="app-container dashboard-workspace">
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Skeleton className="h-8 w-3/4 max-w-64" />
            <Skeleton className="h-4 w-5/6 max-w-96" />
          </div>
          <Skeleton className="h-10 w-24 shrink-0" />
        </div>
        <div className="dashboard-controls">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-20" /><Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-wrap gap-3">
              {[0, 1, 2, 3].map((filter) => <Skeleton key={filter} className="h-10 w-24" />)}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-3">
              {[0, 1, 2].map((control) => <Skeleton key={control} className="h-10 w-20" />)}
            </div>
          </div>
        </div>
        <div className="results-scroll"><DashboardSkeleton variant="board" /></div>
        <div className="flex shrink-0 justify-end gap-3 py-3">
          {[0, 1, 2].map((control) => <Skeleton key={control} className="h-8 w-20" />)}
        </div>
      </div>
    </LoadingRegion>
  );
}
