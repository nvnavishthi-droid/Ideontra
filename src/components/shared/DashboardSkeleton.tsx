// DashboardSkeleton.tsx — Content silhouettes for existing board, table and Admin views.
import type { CSSProperties } from "react";
import { Skeleton } from "@/components/ui/skeleton";
export type DashboardSkeletonVariant = "board" | "table" | "admin";
const columns = ["w-40", "w-24", "w-32", "w-12"];
// Match the category, title, description, badge and footer of an idea card.
function CardSkeleton() {
  return (
    <div className="panel flex flex-col gap-3 p-4" data-slot="idea-card-skeleton">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24" /><Skeleton className="size-6" />
      </div>
      <div className="flex min-h-10 flex-col gap-2">
        <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex min-h-10 flex-col gap-2">
        <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" />
      </div>
      <Skeleton className="h-6 w-24 rounded-full" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-10" /><Skeleton className="h-4 w-10" />
        <Skeleton className="ml-auto h-4 w-16" />
      </div>
    </div>
  );
}
// Preserve every status column while board data is unavailable.
function BoardSkeleton({ count }: { count: number }) {
  return (
    <div className="board-grid min-h-full"
      style={{ "--board-column-count": count } as CSSProperties}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="panel flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between gap-2 py-1">
            <Skeleton className="h-4 w-28" /><Skeleton className="size-4" />
          </div>
          <CardSkeleton /><CardSkeleton />
        </div>
      ))}
    </div>
  );
}
// Reserve the same header and cell spacing as the live table.
function TableSkeleton({ extraColumn }: { extraColumn: boolean }) {
  const widths = extraColumn ? [...columns, "w-24"] : columns;
  return (
    <table className="w-full min-w-2xl text-left">
      <thead className="bg-muted">
        <tr>{widths.map((width, index) => (
          <th key={index} className="px-4 py-4"><Skeleton className={`h-4 ${width}`} /></th>
        ))}</tr>
      </thead>
      <tbody>{Array.from({ length: 6 }, (_, row) => (
        <tr key={row} className="border-t">
          {widths.map((width, column) => (
            <td key={column} className="px-4 py-5">
              <Skeleton className={`h-4 ${width}`} />
            </td>
          ))}
        </tr>
      ))}</tbody>
    </table>
  );
}
// Match Admin status counts and the independently scrolling lower panels.
function AdminSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="panel flex min-h-20 flex-col gap-3 p-4">
            <Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>
      <div className="results-scroll">
        <div className="grid items-stretch gap-3 md:grid-cols-2">
          {[0, 1].map((panel) => (
            <div key={panel} className="panel flex flex-col gap-4 p-5">
              <Skeleton className="h-6 w-40" />
              {Array.from({ length: 6 }, (_, row) => (
                <div key={row} className="flex items-center justify-between gap-3">
                  <Skeleton className={`h-4 ${panel ? "w-3/4" : "w-40"}`} />
                  <Skeleton className={panel ? "h-10 w-20" : "size-4"} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// Choose a content shape without loading data or introducing additional timers.
export function DashboardSkeleton({ variant, extraColumn = false, boardColumns = 9 }: {
  variant: DashboardSkeletonVariant; extraColumn?: boolean; boardColumns?: number;
}) {
  if (variant === "board") return <BoardSkeleton count={boardColumns} />;
  if (variant === "admin") return <AdminSkeleton />;
  return <TableSkeleton extraColumn={extraColumn} />;
}
