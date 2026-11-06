// Loaders.tsx — Consistent action and page loading indicators.
import { Icon } from "@/components/icons/Icon";
import { Skeleton } from "@/components/ui/skeleton";
// Render the shared pending button indicator.
export function ButtonLoader() {
  return <Icon name="loader" className="animate-spin" />;
}
// Render a predictable dashboard content skeleton.
export function PageLoader() {
  return (
    <div
      className="app-container flex flex-col gap-6 py-10"
      role="status"
      aria-label="Loading ideas"
    >
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
      <span className="sr-only">Loading ideas…</span>
    </div>
  );
}
