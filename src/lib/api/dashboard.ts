// dashboard.ts — Request-bound live dashboard reads with verified roles.
"use server";
import { z } from "zod";
import { getIdentity } from "./session";
import { createClient } from "@/lib/supabase/server";
import { parseFilters, type SearchValues } from "@/lib/dashboard-filters";
import { readIdeas, rpc } from "./ideas";
// Retrieve only data allowed by the current verified session and selected view.
export async function readDashboard(params: SearchValues) {
  const user = await getIdentity();
  if (!user) throw new Error("Please sign in again.");
  const client = await createClient();
  const filters = parseFilters({ ...params, role: user.role });
  const data = await readIdeas(client, filters);
  let review: typeof data.rows = [];
  let overdue: typeof data.rows = [];
  if (filters.view === "admin") {
    const [stats, queue, late] = await Promise.all([
      rpc(client, "get_admin_dashboard"),
      readIdeas(client, { ...filters, view: "review", page: 1, pageSize: 10 }),
      readIdeas(client, { ...filters, view: "overdue", page: 1, pageSize: 10 }),
    ]);
    const counts = z
      .object({
        status_counts: z.record(z.string(), z.coerce.number()),
        category_counts: z.record(z.string(), z.coerce.number()),
      })
      .parse(stats);
    data.counts = counts.status_counts;
    data.categoryCounts = counts.category_counts;
    review = queue.rows;
    overdue = late.rows;
  }
  return { data, review, overdue };
}
