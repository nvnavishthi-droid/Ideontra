// IdeaDetail.tsx — Live detail queries, persisted engagement and contextual actions.
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DetailSkeleton } from "@/components/shared/ContentSkeletons";
import { MutationFeedback } from "@/components/shared/MutationFeedback";
import { IdeaChat } from "./IdeaChat";
import { Discussion } from "./Discussion";
import { ExecutionDetails, HistoryDetails } from "./DetailSections";
import { readDetail, engageIdea } from "@/lib/api/ideas";
import { useLiveMutation } from "@/hooks/use-live-mutation";
import { ideaActions } from "@/lib/idea-actions";
import type { Idea, IdeaAction, Role } from "@/types/idea";
// Fetch current ownership, conversation and histories each time the detail opens.
export function IdeaDetail({
  idea: initial,
  role,
  userId,
  onAction,
  onClose,
}: {
  idea: Idea;
  role: Role;
  userId: string;
  onAction: (idea: Idea, action: IdeaAction) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("Overview");
  const query = useQuery({
    queryKey: ["live", "detail", initial.id],
    queryFn: () => readDetail(initial.id),
  });
  const mutation = useLiveMutation(
    ({ kind, active }: { kind: "vote" | "follow"; active: boolean }) =>
      engageIdea(initial.id, kind, active),
  );
  if (query.isPending) return <DetailSkeleton />;
  if (query.error)
    return (
      <div className="flex flex-col gap-4">
        <p role="alert">{query.error.message}</p>
        <Button onClick={() => query.refetch()}>Try again</Button>
      </div>
    );
  const data = query.data;
  const { idea } = data;
  const canVote =
    !idea.isAuthor &&
    ["Submitted", "Needs More Info", "Under Evaluation"].includes(idea.status);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={idea.status} />
        <span className="text-xs text-muted-foreground">
          {idea.category} ·{" "}
          {idea.status === "Draft"
            ? "Private draft"
            : `Submitted ${format(new Date(idea.submittedAt), "dd MMM yyyy, HH:mm")}`}
        </span>
        {idea.overdue && <StatusBadge status="Overdue" />}
      </div>
      <div
        className="flex flex-wrap gap-3"
        role="tablist"
        aria-label="Idea detail sections"
      >
        {["Overview", "Discussion", "Execution", "History", "Ask AI"].map((section) => (
          <Button
            key={section}
            role="tab"
            aria-selected={section === tab}
            variant={tab === section ? "default" : "outline"}
            onClick={() => setTab(section)}
          >
            {section}
          </Button>
        ))}
      </div>
      <div role="tabpanel" aria-label={tab}>
        {tab === "Overview" && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              Submitted by {idea.author}
              {idea.anonymous && role === "admin"
                ? " · anonymous to Members"
                : ""}
            </p>
            {data.history.at(-1)?.reason && (
              <p className="panel bg-muted p-3 text-sm">
                Reason: {data.history.at(-1)?.reason}
              </p>
            )}
            {[
              { label: "Problem", value: idea.problem },
              { label: "Proposed solution", value: idea.solution },
              { label: "Who benefits", value: idea.beneficiaries },
              { label: "Expected impact", value: idea.impact },
              { label: "Rough effort", value: idea.effort || "Not provided" },
              { label: "Owner", value: idea.owner ?? "Not assigned" },
            ].map((item) => (
              <section key={item.label} className="flex flex-col gap-2">
                <h3 className="font-medium">{item.label}</h3>
                <p className="leading-6 text-muted-foreground">
                  {item.value || "Not provided"}
                </p>
              </section>
            ))}
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              Supporting links:
              {idea.links
                ? idea.links.split("\n").map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link underline"
                    >
                      {link}
                    </a>
                  ))
                : "None provided"}
            </div>
            {idea.quadrant && (
              <div className="flex flex-col gap-2">
                <p>
                  <span className="font-medium">Impact:</span>{" "}
                  {idea.impactScore} / 5 ·{" "}
                  <span className="font-medium">Effort:</span>{" "}
                  {idea.effortScore} / 5
                </p>
                <p>
                  <span className="font-medium">Quadrant:</span> {idea.quadrant}
                </p>
              </div>
            )}
            {idea.status !== "Draft" && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant={idea.voted ? "default" : "outline"}
                  disabled={!canVote || mutation.isPending}
                  onClick={() =>
                    mutation.mutate({ kind: "vote", active: idea.voted })
                  }
                >
                  <Icon name="vote" />
                  {idea.voted ? "Remove vote" : "Vote"} · {idea.votes}
                </Button>
                <Button
                  variant="outline"
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({ kind: "follow", active: idea.followed })
                  }
                >
                  <Icon name="bookmark" />
                  {idea.followed ? "Unfollow" : "Follow"}
                </Button>
                <button
                  className="text-xs text-muted-foreground"
                  onClick={() => setTab("Discussion")}
                >
                  {idea.comments} comments
                </button>
              </div>
            )}
            {!canVote && idea.status !== "Draft" && (
              <p className="text-xs text-muted-foreground">
                {idea.isAuthor
                  ? "You cannot vote on your own idea."
                  : "Voting is closed for this status."}
              </p>
            )}
          </div>
        )}
        {tab === "Discussion" &&
          (idea.status === "Draft" ? (
            <p className="text-muted-foreground">
              Discussion is available after submission.
            </p>
          ) : (
            <Discussion ideaId={idea.id} comments={data.comments} />
          ))}
        {tab === "Execution" && (
          <ExecutionDetails data={data} onDemo={() => onAction(idea, "demo")} />
        )}
        {tab === "History" && <HistoryDetails data={data} />}
        {tab === "Ask AI" && <IdeaChat key={`${userId}-${idea.id}`} ideaId={idea.id} userId={userId} />}
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {ideaActions(idea, role).map((option) => (
          <Button
            key={option.action}
            variant="outline"
            onClick={() => onAction(idea, option.action)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <MutationFeedback
        feedback={mutation.feedback}
        onClose={() => mutation.setFeedback(null)}
      />
    </div>
  );
}
