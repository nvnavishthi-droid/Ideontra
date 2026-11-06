// DetailSections.tsx — Live execution details and immutable workflow histories.
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import type { IdeaDetailData } from "@/types/live";
// Format timestamps consistently across detail sections.
function timestamp(value: string) {
  return format(new Date(value), "dd MMM yyyy, HH:mm");
}
// Show actual progress, demo availability and evaluation information.
export function ExecutionDetails({
  data,
  onDemo,
}: {
  data: IdeaDetailData;
  onDemo: () => void;
}) {
  const { idea, progress } = data;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <p>
          <span className="font-semibold">Owner:</span>{" "}
          {idea.owner ?? "Not assigned"}
        </p>
        <p>
          <span className="font-semibold">Target date:</span>{" "}
          {idea.targetDate ?? "Not set"}
        </p>
      </div>
      <h3 className="text-lg font-semibold">Progress updates</h3>
      {progress.length ? (
        progress.map((p) => (
          <article key={p.id} className="panel p-4">
            <p className="mb-2 text-xs text-muted-foreground">
              {timestamp(p.created_at)} · {p.author_name ?? "Anonymous"}
            </p>
            <p>{p.update_text}</p>
          </article>
        ))
      ) : (
        <p className="text-muted-foreground">No progress updates yet.</p>
      )}
      <h3 className="text-lg font-semibold">Actual outcome demo</h3>
      {idea.demoPath || idea.demoUrl ? (
        <>
          <p>{idea.outcome}</p>
          <Button variant="outline" className="self-start" onClick={onDemo}>
            View outcome demo
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground">
          A demo is required when marking this idea Done.
        </p>
      )}
    </div>
  );
}
// Render the database's sanitized status and owner history without sample entries.
export function HistoryDetails({ data }: { data: IdeaDetailData }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Status history</h3>
      {!data.history.length && (
        <p className="text-muted-foreground">No status changes yet.</p>
      )}
      {data.history.map((h) => (
        <article key={h.id} className="panel p-4">
          <p className="font-medium">
            {h.from_status} → {h.to_status}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {timestamp(h.changed_at)} · {h.actor_name ?? "Anonymous"}
            {h.reason ? ` · ${h.reason}` : ""}
          </p>
        </article>
      ))}
      <h3 className="text-lg font-semibold">Owner history</h3>
      {!data.owners.length && (
        <p className="text-muted-foreground">No owner assignments yet.</p>
      )}
      {data.owners.map((h) => (
        <p key={h.id} className="text-sm text-muted-foreground">
          {timestamp(h.assigned_at)} · {h.owner_name ?? "Anonymous"}
        </p>
      ))}
    </div>
  );
}
