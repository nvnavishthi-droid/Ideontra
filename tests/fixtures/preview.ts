// preview.ts — Read-only server fixture adapter for URL-controlled design previews.
import "server-only";
import { previewFixtures } from "./preview-fixtures";
import type { IdeaPage } from "@/types/idea";
import { parseFilters, type SearchValues } from "@/lib/dashboard-filters";
export { parseFilters };
export type { SearchValues };
// Return server-filtered sample rows; replace this adapter with paginated Supabase RPCs later.
export function getPreviewPage(params: SearchValues): IdeaPage {
  const filters = parseFilters(params);
  const user = filters.role === "admin" ? "Arun K." : "Priya S.";
  const visible = previewFixtures().filter(
    (idea) => idea.status !== "Draft" || idea.author === user,
  );
  const counts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  for (const idea of visible)
    if (idea.status !== "Draft") {
      counts[idea.status] = (counts[idea.status] ?? 0) + 1;
      categoryCounts[idea.category] = (categoryCounts[idea.category] ?? 0) + 1;
    }
  const result = visible.filter((idea) => {
    if (filters.view === "my") {
      if (filters.personal === "drafts" && idea.status !== "Draft")
        return false;
      if (
        filters.personal === "submissions" &&
        (idea.author !== user || idea.status === "Draft")
      )
        return false;
      if (filters.personal === "owned" && idea.owner !== user) return false;
      if (filters.personal === "following" && !idea.followed) return false;
    } else if (idea.status === "Draft") return false;
    if (filters.view === "review" && idea.status !== "Submitted") return false;
    if (filters.view === "overdue" && !idea.overdue) return false;
    if (
      filters.view === "all" &&
      filters.layout === "board" &&
      ["Done", "Rejected", "Withdrawn"].includes(idea.status)
    )
      return false;
    return (
      (!filters.status || idea.status === filters.status) &&
      (!filters.category || idea.category === filters.category) &&
      (!filters.owner ||
        (filters.owner === "Unassigned"
          ? !idea.owner
          : idea.owner === filters.owner)) &&
      (!filters.quadrant || idea.quadrant === filters.quadrant) &&
      (!filters.q ||
        `${idea.title} ${idea.problem} ${idea.solution} ${idea.beneficiaries} ${idea.impact}`
          .toLowerCase()
          .includes(filters.q.toLowerCase()))
    );
  });
  result.sort((a, b) =>
    filters.view === "review"
      ? a.submittedAt.localeCompare(b.submittedAt)
      : filters.sort === "votes"
        ? b.votes - a.votes
        : filters.sort === "updated"
          ? b.updatedAt.localeCompare(a.updatedAt)
          : b.submittedAt.localeCompare(a.submittedAt),
  );
  const total = result.length;
  filters.page = Math.min(
    filters.page,
    Math.max(1, Math.ceil(total / filters.pageSize)),
  );
  const rows = result
    .slice(
      (filters.page - 1) * filters.pageSize,
      filters.page * filters.pageSize,
    )
    .map((idea) => ({
      ...idea,
      isAuthor: idea.author === user,
      author:
        idea.anonymous && filters.role !== "admin" ? "Anonymous" : idea.author,
    }));
  return { rows, total, filters, counts, categoryCounts };
}
