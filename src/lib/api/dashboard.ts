// dashboard.ts — Request-bound live dashboard reads with verified roles.
import "server-only";
import { z } from "zod";
import { getIdentity } from "./session";
import { createClient } from "@/lib/supabase/server";
import { parseFilters, type SearchValues } from "@/lib/dashboard-filters";
import { readIdeas, rpc } from "./ideas";
import type { DashboardSnapshot } from "@/types/dashboard";
// Retrieve only data allowed by the current verified session and selected view.
export async function readDashboard(params: SearchValues): Promise<DashboardSnapshot> {
  const user = await getIdentity();
  if (!user) throw new Error("Please sign in again.");
  const client = await createClient();
  const filters = parseFilters({ ...params, role: user.role });
  if (filters.view === "admin") {
    const [stats, queue, late] = await Promise.all([
      rpc(client, "get_admin_dashboard"),
      readIdeas(client, { ...filters, view: "review", sort: "oldest", page: 1, pageSize: 10 }),
      readIdeas(client, { ...filters, view: "overdue", page: 1, pageSize: 10 }),
    ]);
    const counts = z
      .object({
        status_counts: z.record(z.string(), z.coerce.number()),
        category_counts: z.record(z.string(), z.coerce.number()),
      })
      .parse(stats);
    return {
      data: { rows: [], total: 0, filters, counts: counts.status_counts,
        categoryCounts: counts.category_counts },
      review: queue.rows,
      overdue: late.rows,
    };
  }
  return { data: await readIdeas(client, filters), review: [], overdue: [] };
}
