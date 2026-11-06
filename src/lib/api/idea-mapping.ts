// idea-mapping.ts — Runtime validation and mapping of sanitized RPC projections.
import { z } from "zod";
import { statuses, type Idea } from "@/types/idea";
import type { IdeaDetailData } from "@/types/live";
const rowSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  status: z.enum(statuses),
  problem: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  proposed_solution: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  who_benefits: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  expected_impact: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  rough_effort: z.string().nullable(),
  links: z
    .array(z.string())
    .nullable()
    .transform((value) => value ?? []),
  is_anonymous: z.boolean(),
  author_name: z.string().nullable(),
  owner_name: z.string().nullable(),
  owner_id: z.string().nullable(),
  is_author: z.boolean(),
  is_owner: z.boolean(),
  vote_count: z.coerce.number(),
  comment_count: z.coerce.number(),
  has_voted: z.boolean(),
  is_following: z.boolean(),
  impact_score: z.number().nullable(),
  effort_score: z.number().nullable(),
  evaluation_quadrant: z.string().nullable(),
  target_date: z.string().nullable(),
  submitted_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  is_overdue: z.boolean().nullable(),
  outcome_summary: z.string().nullable(),
  demo_video_path: z.string().nullable(),
  demo_video_url: z.string().nullable(),
});
// Convert only explicitly returned safe fields into component data.
export function mapIdea(value: unknown): Idea {
  const r = rowSchema.parse(value);
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    problem: r.problem,
    solution: r.proposed_solution,
    beneficiaries: r.who_benefits,
    impact: r.expected_impact,
    effort: r.rough_effort ?? "",
    links: r.links.join("\n"),
    anonymous: r.is_anonymous,
    author: r.author_name ?? (r.is_anonymous ? "Anonymous" : "Employee"),
    owner: r.owner_name,
    ownerId: r.owner_id,
    isOwner: r.is_owner,
    isAuthor: r.is_author,
    votes: r.vote_count,
    comments: r.comment_count,
    voted: r.has_voted,
    followed: r.is_following,
    impactScore: r.impact_score,
    effortScore: r.effort_score,
    quadrant: r.evaluation_quadrant,
    targetDate: r.target_date,
    submittedAt: r.submitted_at ?? r.created_at,
    updatedAt: r.updated_at,
    overdue: !!r.is_overdue,
    outcome: r.outcome_summary ?? "",
    demoPath: r.demo_video_path,
    demoUrl: r.demo_video_url,
  };
}
const comment = z.object({
  id: z.string(),
  parent_comment_id: z.string().nullable(),
  content: z.string(),
  author_name: z.string().nullable(),
  is_own: z.boolean(),
  created_at: z.string(),
  deleted_at: z.string().nullable(),
});
const status = z.object({
  id: z.string(),
  from_status: z.string(),
  to_status: z.string(),
  actor_name: z.string().nullable(),
  changed_at: z.string(),
  reason: z.string().nullable(),
});
const owner = z.object({
  id: z.string(),
  owner_name: z.string().nullable(),
  assigned_at: z.string(),
});
const progress = z.object({
  id: z.string(),
  author_name: z.string().nullable(),
  update_text: z.string(),
  created_at: z.string(),
});
// Validate detail arrays while stripping all unnecessary actor identifiers.
export function mapDetail(value: unknown): IdeaDetailData {
  const r = z
    .object({
      comments: z.array(comment),
      status_history: z.array(status),
      owner_history: z.array(owner),
      progress_updates: z.array(progress),
    })
    .parse(value);
  return {
    idea: mapIdea(value),
    comments: r.comments,
    history: r.status_history,
    owners: r.owner_history,
    progress: r.progress_updates,
  };
}
