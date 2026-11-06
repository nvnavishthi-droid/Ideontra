// live.ts — Sanitized detail, comment, owner and workflow contracts.
import type { Idea, IdeaAction } from "./idea";
export interface OwnerOption {
  id: string;
  full_name: string | null;
}
export interface Comment {
  id: string;
  parent_comment_id: string | null;
  content: string;
  author_name: string | null;
  is_own: boolean;
  created_at: string;
  deleted_at: string | null;
}
export interface StatusEntry {
  id: string;
  from_status: string;
  to_status: string;
  actor_name: string | null;
  changed_at: string;
  reason: string | null;
}
export interface OwnerEntry {
  id: string;
  owner_name: string | null;
  assigned_at: string;
}
export interface ProgressEntry {
  id: string;
  author_name: string | null;
  update_text: string;
  created_at: string;
}
export interface IdeaDetailData {
  idea: Idea;
  comments: Comment[];
  history: StatusEntry[];
  owners: OwnerEntry[];
  progress: ProgressEntry[];
}
export interface WorkflowValues {
  impact: number;
  effort: number;
  owner: string;
  date: string;
  text: string;
  link: string;
  file: File | null;
  outcome: string;
  source: string;
  approve: boolean;
}
export interface WorkflowRequest {
  idea: Idea;
  action: IdeaAction;
  values: WorkflowValues;
  admin: boolean;
}
