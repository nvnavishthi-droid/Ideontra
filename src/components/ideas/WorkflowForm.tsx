// WorkflowForm.tsx — Stage-specific evaluation, reason, owner, progress and demo forms.
"use client";
import { useLiveMutation } from "@/hooks/use-live-mutation";
import { runWorkflow } from "@/lib/api/workflows";
import { MutationFeedback } from "@/components/shared/MutationFeedback";
import { ButtonLoader } from "@/components/shared/Loaders";
import { OwnerSelect } from "./OwnerSelect";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/FormField";
import { Select } from "@/components/shared/Select";
import { DatePicker } from "@/components/shared/DatePicker";
import { Icon } from "@/components/icons/Icon";
import { getQuadrant } from "@/lib/idea-actions";
import { fieldLimits as limits } from "@/lib/form-field-limits";
import { validLink } from "@/lib/form-schemas";
import type { Idea, IdeaAction } from "@/types/idea";
export const actionLabels: Record<IdeaAction, string> = {
  edit: "Edit your idea",
  submit: "Submit idea",
  withdraw: "Withdraw this idea?",
  delete: "Delete this draft?",
  resubmit: "Update and Resubmit",
  evaluate: "Evaluate idea",
  "start-evaluation": "Start evaluation",
  resume: "Resume evaluation",
  start: "Start execution",
  reassign: "Reassign owner",
  progress: "Post progress update",
  done: "Share the outcome",
  park: "Park idea",
  reject: "Reject idea",
  "needs-info": "Request more information",
  demo: "Actual outcome",
};
interface WorkflowFormProps {
  admin: boolean;
  idea: Idea;
  action: IdeaAction;
  onClose: () => void;
  onSaved: () => void;
}
// Validate workflow-specific input without pretending that the backend has accepted a transition.
export function WorkflowForm({
  idea,
  admin,
  action,
  onClose,
  onSaved,
}: WorkflowFormProps) {
  const [impact, setImpact] = useState(
    idea.impactScore ? String(idea.impactScore) : "",
  );
  const [effort, setEffort] = useState(
    idea.effortScore ? String(idea.effortScore) : "",
  );
  const [owner, setOwner] = useState(idea.ownerId ?? "");
  const [date, setDate] = useState(idea.targetDate ?? "");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [outcome, setOutcome] = useState("");
  const [source, setSource] = useState("upload");
  const mutation = useLiveMutation(
    (approve: boolean) =>
      runWorkflow({
        idea,
        action,
        admin,
        values: {
          impact: Number(impact),
          effort: Number(effort),
          owner,
          date,
          text,
          link,
          file,
          outcome,
          source,
          approve,
        },
      }),
    onSaved,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reason = ["park", "reject", "needs-info"].includes(action);
  const ownership = ["start", "reassign"].includes(action);
  const confirm = [
    "submit",
    "withdraw",
    "delete",
    "start-evaluation",
    "resume",
  ].includes(action);
  // Focus the first invalid control after validating all related fields together.
  function submit(event?: FormEvent<HTMLFormElement>, approve = true) {
    event?.preventDefault();
    const next: Record<string, string> = {};
    if (action === "evaluate") {
      if (!impact) next.impact = "Impact is required.";
      if (!effort) next.effort = "Effort is required.";
    }
    if (ownership && admin) {
      if (!owner) next.owner = "Choose an owner.";
      if (action === "start" && !date)
        next.targetDate = "Choose a target date.";
    }
    if ((reason || action === "progress") && !text.trim())
      next.text = reason
        ? "Enter a reason before confirming."
        : "Enter a progress update.";
    if (action === "done") {
      if (
        source === "upload" &&
        (!file ||
          file.size > 100 * 1024 * 1024 ||
          !/\.(mp4|mov|webm)$/i.test(file.name))
      )
        next.file = "Choose MP4, MOV or WebM, no larger than 100 MB.";
      if (source === "link") {
        let host = "";
        try {
          host = new URL(link).hostname.toLowerCase();
        } catch {}
        if (
          !validLink(link) ||
          !link ||
          ![
            "youtube.com",
            "www.youtube.com",
            "youtu.be",
            "loom.com",
            "www.loom.com",
            "drive.google.com",
          ].includes(host)
        )
          next.link = "Add a valid YouTube, Loom or Google Drive link.";
      }
    }
    setErrors(next);
    if (Object.keys(next).length) {
      const element = document.getElementById(Object.keys(next)[0]);
      element?.focus();
      element?.scrollIntoView({ block: "center" });
      return;
    }
    mutation.mutate(approve);
  }
  return (
    <form
      noValidate
      onSubmit={(e) => submit(e)}
      className="flex flex-col gap-5"
    >
      <MutationFeedback
        feedback={mutation.feedback}
        onClose={() => mutation.setFeedback(null)}
      />
      <fieldset
        disabled={mutation.isPending}
        className="flex flex-col gap-5 border-0 p-0"
      >
        <p className="font-medium">{idea.title}</p>
        <FieldGroup className="gap-4">
          {confirm && (
            <p className="leading-6 text-muted-foreground">
              {action === "delete"
                ? "This private draft will be permanently removed."
                : action === "withdraw"
                  ? "The idea stays in history. Withdrawn is final and cannot be reopened."
                  : action === "resume"
                    ? "Move this Parked idea back to Under Evaluation."
                    : action === "start-evaluation"
                      ? "Move this Submitted idea to Under Evaluation. Author editing will be locked."
                      : "Move this draft to Submitted for review."}
            </p>
          )}
          {reason && (
            <FormField id="text" label="Reason *" error={errors.text}>
              <Textarea
                id="text"
                maxLength={limits.reason}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Explain the reason for this decision…"
                aria-invalid={!!errors.text}
              />
            </FormField>
          )}
          {action === "evaluate" && (
            <>
              <div className="grid items-start gap-4 sm:grid-cols-2">
                <FormField id="impact" label="Impact *" error={errors.impact}>
                  <Select
                    id="impact"
                    options={["1", "2", "3", "4", "5"]}
                    placeholder="Choose 1–5"
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    aria-invalid={!!errors.impact}
                  />
                </FormField>
                <FormField id="effort" label="Effort *" error={errors.effort}>
                  <Select
                    id="effort"
                    options={["1", "2", "3", "4", "5"]}
                    placeholder="Choose 1–5"
                    value={effort}
                    onChange={(e) => setEffort(e.target.value)}
                    aria-invalid={!!errors.effort}
                  />
                </FormField>
              </div>
              <p className="text-xs text-muted-foreground">
                Impact 3–5 is High · Effort 3–5 is High
              </p>
              <p>
                {impact && effort
                  ? getQuadrant(Number(impact), Number(effort))
                  : "Both scores are required before approval."}
              </p>
            </>
          )}
          {ownership && (
            <>
              <FormField id="owner" label="Owner *" error={errors.owner}>
                {admin ? (
                  <OwnerSelect
                    id="owner"
                    value={owner}
                    onChange={setOwner}
                    assign
                    invalid={!!errors.owner}
                  />
                ) : (
                  <p>{idea.owner ?? "Assigned to you"}</p>
                )}
              </FormField>
              {action === "start" && admin && (
                <FormField
                  id="targetDate"
                  label="Target date *"
                  error={errors.targetDate}
                >
                  <DatePicker
                    value={date}
                    onChange={setDate}
                    invalid={!!errors.targetDate}
                  />
                </FormField>
              )}
              <p className="text-xs text-muted-foreground">
                Assignments are recorded in owner history.
              </p>
            </>
          )}
          {action === "progress" && (
            <FormField id="text" label="Progress update *" error={errors.text}>
              <Textarea
                id="text"
                maxLength={limits.comment}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What has changed since the last update?"
                aria-invalid={!!errors.text}
              />
            </FormField>
          )}
          {action === "done" && (
            <>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={source === "upload" ? "default" : "outline"}
                  onClick={() => setSource("upload")}
                >
                  Upload video
                </Button>
                <Button
                  type="button"
                  variant={source === "link" ? "default" : "outline"}
                  onClick={() => setSource("link")}
                >
                  Video link
                </Button>
              </div>
              {source === "upload" ? (
                <FormField
                  id="file"
                  label="Demo video *"
                  error={errors.file}
                  hint="MP4, MOV or WebM · maximum 100 MB"
                >
                  <label className="panel flex cursor-pointer flex-col items-center gap-3 p-6 text-muted-foreground">
                    <Icon name="upload" size={24} className="text-primary" />
                    <span>{file?.name ?? "Choose a demo video"}</span>
                    <Input
                      id="file"
                      type="file"
                      accept=".mp4,.mov,.webm"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      aria-invalid={!!errors.file}
                    />
                  </label>
                </FormField>
              ) : (
                <FormField id="link" label="Video link *" error={errors.link}>
                  <Input
                    id="link"
                    maxLength={limits.links}
                    placeholder="YouTube, Loom or Google Drive"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    aria-invalid={!!errors.link}
                  />
                </FormField>
              )}
              <FormField id="outcome" label="Outcome summary (optional)">
                <Textarea
                  id="outcome"
                  maxLength={limits.outcome}
                  placeholder="What did this idea achieve?"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                />
              </FormField>
              <p className="text-xs text-muted-foreground">
                A demo is required. Done is a final status.
              </p>
            </>
          )}
        </FieldGroup>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          {action === "evaluate" && (
            <Button
              variant="outline"
              type="button"
              onClick={() => submit(undefined, false)}
            >
              Save scores
            </Button>
          )}
          <Button
            type="submit"
            variant={
              action === "delete" || action === "reject"
                ? "destructive"
                : "default"
            }
          >
            {mutation.isPending && <ButtonLoader />}
            {action === "evaluate"
              ? "Approve"
              : action === "done"
                ? "Mark Done"
                : action === "start"
                  ? "Start progress"
                  : actionLabels[action]}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
