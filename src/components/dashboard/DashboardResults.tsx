// DashboardResults.tsx — Bounded row/board scrolling with persistent pagination.
"use client";
import { IdeaCard, type IdeaInteractions } from "@/components/ideas/IdeaCard";
import { IdeasTable } from "./IdeasTable";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyResults } from "./EmptyResults";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import type { IdeaPage } from "@/types/idea";
const boardStatuses = [
  "Submitted",
  "Needs More Info",
  "Under Evaluation",
  "Approved",
  "In Progress",
  "Parked",
];
// Keep table rows and board cards in their own scrollport beneath dashboard controls.
export function DashboardResults({
  data,
  onOpen,
  onAction,
  pending,
}: IdeaInteractions & { data: IdeaPage; pending: boolean }) {
  const { rows, filters, total } = data;
  const { navigate } = useDashboardNavigation();
  const board = filters.view === "all" && filters.layout === "board";
  // Clear server-side filters without changing the selected view.
  function clear() {
    navigate({ q: "", status: "", category: "", owner: "", quadrant: "" });
  }
  return (
    <div className="dashboard-results" aria-busy={pending}>
      {board ? (
        <section
          className="results-scroll"
          aria-label="Ideas board"
          tabIndex={0}
        >
          {total ? (
            <div className="board-grid min-h-full">
              {boardStatuses.map((status) => (
                <section key={status} className="panel flex flex-col gap-3 p-3">
                  <div className="sticky top-0 flex items-center justify-between gap-2 bg-card py-1">
                    <h2 className="text-xs font-semibold">{status}</h2>
                    <span className="text-xs text-muted-foreground">
                      {rows.filter((idea) => idea.status === status).length}
                    </span>
                  </div>
                  {rows
                    .filter((idea) => idea.status === status)
                    .map((idea) => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        role={filters.role}
                        onOpen={onOpen}
                        onAction={onAction}
                      />
                    ))}
                </section>
              ))}
            </div>
          ) : (
            <div className="panel">
              <EmptyResults onClear={clear} />
            </div>
          )}
        </section>
      ) : (
        <IdeasTable
          rows={rows}
          onOpen={onOpen}
          review={filters.view === "review"}
          overdue={filters.view === "overdue"}
          onClear={clear}
        />
      )}
      <Pagination
        page={filters.page}
        pageSize={filters.pageSize}
        total={total}
        shown={rows.length}
      />
    </div>
  );
}
