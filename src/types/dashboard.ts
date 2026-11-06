// dashboard.ts — Shared server response for dashboard data queries.
import type { Idea, IdeaPage } from "./idea";
export interface DashboardSnapshot {
  data: IdeaPage;
  review: Idea[];
  overdue: Idea[];
}
