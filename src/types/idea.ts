// idea.ts — Typed sanitized idea records and dashboard query state.
export const statuses = [
  "Draft",
  "Submitted",
  "Needs More Info",
  "Under Evaluation",
  "Approved",
  "In Progress",
  "Done",
  "Rejected",
  "Parked",
  "Withdrawn",
] as const;
export const categories = [
  "New Service Offering",
  "Internal Tool",
  "Process Improvement",
  "Marketing/Content",
  "Client Experience",
  "Training",
] as const;
export const quadrants = [
  "Quick Win",
  "Big Bet",
  "Fill-in",
  "Not Worth It",
] as const;
export type Status = (typeof statuses)[number];
export type Role = "member" | "admin";
export type View = "all" | "my" | "admin" | "review" | "overdue";
export type PersonalTab = "drafts" | "submissions" | "owned" | "following";
export interface Idea {
  id: string;
  title: string;
  category: string;
  status: Status;
  problem: string;
  solution: string;
  beneficiaries: string;
  impact: string;
  effort: string;
  links: string;
  anonymous: boolean;
  author: string;
  isAuthor: boolean;
  owner: string | null;
  ownerId?: string | null;
  isOwner?: boolean;
  demoPath?: string | null;
  demoUrl?: string | null;
  votes: number;
  comments: number;
  followed: boolean;
  voted: boolean;
  impactScore: number | null;
  effortScore: number | null;
  quadrant: string | null;
  targetDate: string | null;
  submittedAt: string;
  updatedAt: string;
  overdue: boolean;
  reason?: string;
  outcome?: string;
}
export interface DashboardFilters {
  q: string;
  status: string;
  category: string;
  owner: string;
  quadrant: string;
  sort: string;
  page: number;
  pageSize: number;
  view: View;
  personal: PersonalTab;
  layout: "board" | "list";
  role: Role;
}
export interface IdeaPage {
  rows: Idea[];
  total: number;
  filters: DashboardFilters;
  counts: Record<string, number>;
  categoryCounts: Record<string, number>;
}
export type IdeaAction =
  | "edit"
  | "submit"
  | "withdraw"
  | "delete"
  | "resubmit"
  | "evaluate"
  | "start-evaluation"
  | "resume"
  | "start"
  | "reassign"
  | "progress"
  | "done"
  | "park"
  | "reject"
  | "needs-info"
  | "demo";
export interface ActionOption {
  action: IdeaAction;
  label: string;
}
