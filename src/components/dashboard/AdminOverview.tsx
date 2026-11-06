// AdminOverview.tsx — FRD status/category counts and review/overdue entry panels.
"use client";
import { statuses, categories, type Idea } from "@/types/idea";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
interface AdminOverviewProps {
  counts: Record<string, number>;
  categoryCounts: Record<string, number>;
  review: Idea[];
  overdue: Idea[];
  onOpen: (idea: Idea) => void;
}
// Render administrator information only when server-verified role permits it.
export function AdminOverview({
  counts,
  categoryCounts,
  review,
  overdue,
  onOpen,
}: AdminOverviewProps) {
  const { navigate } = useDashboardNavigation();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-5">
        {statuses.map((status) => (
          <div key={status} className="panel flex min-h-20 flex-col gap-3 p-4">
            <span className="text-xs text-muted-foreground">{status}</span>
            <strong className="text-xl font-semibold">
              {status === "Draft" ? "Private" : (counts[status] ?? 0)}
            </strong>
          </div>
        ))}
      </div>
      <div
        className="results-scroll"
        role="region"
        aria-label="Admin category and review panels"
        tabIndex={0}
      >
        <div className="grid items-stretch gap-3 md:grid-cols-2">
          <section className="panel flex flex-col gap-4 p-5">
            <h2 className="text-lg font-semibold">Ideas by category</h2>
            {categories.map((category) => (
              <div key={category} className="flex justify-between gap-3">
                <span>{category}</span>
                <span>{categoryCounts[category] ?? 0}</span>
              </div>
            ))}
          </section>
          <section className="panel flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Awaiting review</h2>
              <Button
                variant="link"
                onClick={() =>
                  navigate({ view: "review", sort: "", status: "" })
                }
              >
                Review ideas
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Oldest first · Submitted queue
            </p>
            {review.slice(0, 2).map((idea) => (
              <div
                className="flex items-center justify-between gap-3"
                key={idea.id}
              >
                <p>
                  {idea.title}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Submitted {new Date(idea.submittedAt).toLocaleDateString()}
                  </span>
                </p>
                <Button variant="outline" onClick={() => onOpen(idea)}>
                  Review
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Overdue ideas</h2>
              <Button
                variant="link"
                onClick={() =>
                  navigate({ view: "overdue", sort: "", status: "" })
                }
              >
                View all
              </Button>
            </div>
            {overdue.slice(0, 2).map((idea) => (
              <div
                key={idea.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <p>
                  {idea.title}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Owner: {idea.owner} · Target {idea.targetDate}
                  </span>
                </p>
                <StatusBadge status="Overdue" />
                <Button variant="outline" onClick={() => onOpen(idea)}>
                  Open
                </Button>
              </div>
            ))}
          </section>
        </div>
        <p className="text-xs text-muted-foreground">
          Counts respect visibility. Private drafts are not exposed to
          administrators.
        </p>
      </div>
    </div>
  );
}
