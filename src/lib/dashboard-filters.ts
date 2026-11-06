// dashboard-filters.ts — Normalize URL parameters before authenticated RPC queries.
import type { DashboardFilters, PersonalTab, View } from "@/types/idea";
export type SearchValues = Record<string, string | string[] | undefined>;
// Read a scalar query parameter without trusting repeated values.
function value(params: SearchValues, key: string, fallback = ""): string {
  const entry = params[key];
  return typeof entry === "string" ? entry : fallback;
}
// Normalize dashboard navigation and paging parameters.
export function parseFilters(params: SearchValues): DashboardFilters {
  const requestedView = value(params, "view", "all");
  const role = value(params, "role") === "admin" ? "admin" : "member";
  const allowed: View[] =
    role === "admin"
      ? ["all", "my", "admin", "review", "overdue"]
      : ["all", "my"];
  const view = allowed.includes(requestedView as View) ? requestedView as View : "all";
  const personal = value(params, "tab", "drafts");
  const requestedPage = Number(value(params, "page", "1"));
  return {
    q: value(params, "q").trim().length >= 3 ? value(params, "q").trim() : "",
    status: value(params, "status"),
    category: value(params, "category"),
    owner: value(params, "owner"),
    quadrant: value(params, "quadrant"),
    sort: value(params, "sort", view === "review" ? "oldest" : "newest"),
    page: Number.isFinite(requestedPage)
      ? Math.max(1, Math.min(1000000, Math.floor(requestedPage) || 1))
      : 1,
    pageSize: [10, 25, 50, 100].includes(
      Number(value(params, "pageSize", "25")),
    )
      ? Number(value(params, "pageSize", "25"))
      : 25,
    view,
    personal: ["drafts", "submissions", "owned", "following"].includes(personal)
      ? (personal as PersonalTab)
      : "drafts",
    layout: value(params, "layout") === "list" ? "list" : "board",
    role,
  };
}
