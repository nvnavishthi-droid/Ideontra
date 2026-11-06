// idea-actions.ts — Present scoped actions for verified role, ownership and status.
import type { ActionOption, Idea, Role } from "@/types/idea";
// Return permitted visual workflow actions without granting backend authorization.
export function ideaActions(idea: Idea, role: Role): ActionOption[] {
  const actions: ActionOption[] = [];
  const admin = role === "admin";
  const owner = idea.isOwner === true;
  if (
    idea.isAuthor &&
    ["Draft", "Submitted", "Needs More Info"].includes(idea.status)
  )
    actions.push({ action: "edit", label: "Edit idea" });
  if (idea.isAuthor && idea.status === "Draft")
    actions.push(
      { action: "submit", label: "Submit idea" },
      { action: "delete", label: "Delete draft" },
    );
  if (idea.isAuthor && ["Submitted", "Needs More Info"].includes(idea.status))
    actions.push({ action: "withdraw", label: "Withdraw idea" });
  if (idea.isAuthor && idea.status === "Needs More Info")
    actions.push({ action: "resubmit", label: "Update and Resubmit" });
  if (admin && idea.status === "Submitted")
    actions.push(
      { action: "start-evaluation", label: "Start evaluation" },
      { action: "needs-info", label: "Needs More Info" },
      { action: "reject", label: "Reject idea" },
    );
  if (admin && idea.status === "Under Evaluation")
    actions.push(
      { action: "evaluate", label: "Evaluate idea" },
      { action: "needs-info", label: "Needs More Info" },
      { action: "park", label: "Park idea" },
      { action: "reject", label: "Reject idea" },
    );
  if ((admin || owner) && idea.status === "Approved")
    actions.push({ action: "start", label: "Start execution" });
  if ((admin || owner) && idea.status === "In Progress")
    actions.push(
      { action: "progress", label: "Post progress update" },
      { action: "done", label: "Mark Done" },
      { action: "park", label: "Park idea" },
    );
  if (admin && ["Approved", "In Progress", "Parked"].includes(idea.status))
    actions.push({ action: "reassign", label: "Reassign owner" });
  if (admin && idea.status === "Parked")
    actions.push({ action: "resume", label: "Resume evaluation" });
  if (idea.status === "Done")
    actions.push({ action: "demo", label: "View outcome demo" });
  return actions;
}
// Derive the FRD quadrant after both evaluation scores are supplied.
export function getQuadrant(impact: number, effort: number): string {
  return impact >= 3
    ? effort >= 3
      ? "Big Bet"
      : "Quick Win"
    : effort >= 3
      ? "Not Worth It"
      : "Fill-in";
}
