// workflows.ts — Persist workflow actions and private demo uploads.
import { createClient } from "@/lib/supabase/client";
import { rpc } from "./ideas";
import type { WorkflowRequest } from "@/types/live";
const transitions = {
  withdraw: "Withdrawn",
  "start-evaluation": "Under Evaluation",
  resume: "Under Evaluation",
  start: "In Progress",
  park: "Parked",
  reject: "Rejected",
  "needs-info": "Needs More Info",
} as const;
// Upload allowed video types under random names containing no user identity.
async function uploadDemo(ideaId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mime =
    extension === "mp4"
      ? "video/mp4"
      : extension === "mov"
        ? "video/quicktime"
        : extension === "webm"
          ? "video/webm"
          : null;
  if (!mime || file.size > 104857600 || file.size === 0)
    throw new Error("Choose an MP4, MOV or WebM video up to 100 MB.");
  const path = `${ideaId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await createClient()
    .storage.from("idea-demos")
    .upload(path, file, { contentType: mime, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
// Execute one database-authorized operation; compound actions are atomic RPCs.
export async function runWorkflow({
  idea,
  action,
  values,
  admin,
}: WorkflowRequest) {
  const client = createClient();
  const args = { p_idea_id: idea.id };
  if (action === "delete" || action === "submit")
    return rpc(
      client,
      action === "delete" ? "delete_draft" : "submit_idea",
      args,
    );
  if (action === "evaluate")
    return values.approve
      ? rpc(client, "approve_evaluated_idea", {
          ...args,
          p_impact: values.impact,
          p_effort: values.effort,
        })
      : rpc(client, "evaluate_idea", {
          ...args,
          p_impact_score: values.impact,
          p_effort_score: values.effort,
        });
  if (action === "progress")
    return rpc(client, "add_idea_progress_update", {
      ...args,
      p_update_text: values.text,
    });
  if (action === "reassign")
    return rpc(client, "reassign_idea_owner", {
      ...args,
      p_new_owner_id: values.owner,
    });
  if (action === "done") {
    const path =
      values.source === "upload" && values.file
        ? await uploadDemo(idea.id, values.file)
        : null;
    // Retain a successfully uploaded object if completion fails so no referenced demo is deleted.
    return rpc(client, "complete_idea", {
      ...args,
      p_path: path,
      p_url: values.source === "link" ? values.link : null,
      p_outcome: values.outcome,
    });
  }
  if (action in transitions)
    return rpc(client, "transition_idea", {
      ...args,
      p_new_status: transitions[action as keyof typeof transitions],
      p_reason: values.text || null,
      p_owner_id: action === "start" && admin ? values.owner : null,
      p_target_date: action === "start" && admin ? values.date : null,
    });
  throw new Error("Unsupported workflow action.");
}
// Generate a short-lived URL after Storage authorization succeeds.
export async function readDemo(path: string): Promise<string> {
  const { data, error } = await createClient()
    .storage.from("idea-demos")
    .createSignedUrl(path, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
