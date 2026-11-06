// Pagination.tsx — Shared server-controlled paging with totals and page sizes.
"use client";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/Icon";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
// Render the same paging controls for every table view.
export function Pagination({
  page,
  pageSize,
  total,
  shown,
}: {
  page: number;
  pageSize: number;
  total: number;
  shown: number;
}) {
  const { navigate, pending, prefetch } = useDashboardNavigation();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total ? (page - 1) * pageSize + 1 : 0;
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 py-3">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {pending ? "Updating ideas…" : <>Showing {first}
        {shown > 1 ? `–${first + shown - 1}` : ""} of {total} · Page {page} of{" "}
        {pages}</>}
      </p>
      <div className="flex items-center gap-3">
        <div
          className="relative inline-flex h-8 shrink-0 items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring"
          data-disabled={pending || undefined}
        >
          <span aria-hidden="true">{pageSize} per page</span>
          <Icon name="chevron-down" />
          <select
            aria-label="Rows per page"
            className="absolute inset-0 size-full appearance-none opacity-0 disabled:cursor-default"
            value={pageSize}
            disabled={pending}
            onChange={(event) => navigate({ pageSize: event.target.value })}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={page <= 1 || pending}
          onMouseEnter={() => { if (page > 1) prefetch({ page: String(page - 1) }, false); }}
          onFocus={() => { if (page > 1) prefetch({ page: String(page - 1) }, false); }}
          onClick={() => navigate({ page: String(page - 1) }, false)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={page >= pages || pending}
          onMouseEnter={() => { if (page < pages) prefetch({ page: String(page + 1) }, false); }}
          onFocus={() => { if (page < pages) prefetch({ page: String(page + 1) }, false); }}
          onClick={() => navigate({ page: String(page + 1) }, false)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
