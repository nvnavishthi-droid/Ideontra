// ideas.ts — Authenticated RPC reads and mutations; no client table writes.
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { mapIdea, mapDetail } from "./idea-mapping";
import type { DashboardFilters, IdeaPage } from "@/types/idea";
import type { IdeaFormValues } from "@/lib/form-schemas";
import type { OwnerOption } from "@/types/live";
type Functions = Database["public"]["Functions"];
// PostgREST optional SQL arguments accept explicit NULL as well as omission.
type RpcArgs<N extends keyof Functions> = {
  [K in keyof Functions[N]["Args"]]: Functions[N]["Args"][K] | null;
};
// Normalize Supabase failures into user-facing Error objects.
export async function rpc<N extends keyof Database["public"]["Functions"]>(
  client: SupabaseClient<Database>,
  name: N,
  args?: RpcArgs<N>,
): Promise<unknown> {
  const { data, error } = await client.rpc(name, args as never);
  if (error) throw new Error(error.message);
  return data;
}
const active = [
  "Submitted",
  "Needs More Info",
  "Under Evaluation",
  "Approved",
  "In Progress",
  "Parked",
];
// Fetch a single server-filtered and server-sorted page through the database.
export async function readIdeas(
  client: SupabaseClient<Database>,
  filters: DashboardFilters,
): Promise<IdeaPage> {
  const mode =
    filters.view === "my"
      ? filters.personal
      : filters.view === "admin"
        ? "all"
        : filters.view;
  const raw = await rpc(client, "list_ideas", {
    p_page: filters.page,
    p_page_size: filters.pageSize,
    p_q: filters.q || null,
    p_status: mode === "review" ? "Submitted" : filters.status || null,
    p_category: filters.category || null,
    p_owner:
      filters.owner === "Unassigned"
        ? "00000000-0000-0000-0000-000000000000"
        : filters.owner || null,
    p_quadrant: filters.quadrant || null,
    p_sort: ["newest", "votes", "updated"].includes(filters.sort)
      ? filters.sort
      : "newest",
    p_mode: mode,
    p_active_statuses:
      filters.view === "all" && filters.layout === "board" ? active : null,
  });
  const page = z
    .object({ rows: z.array(z.unknown()), total: z.coerce.number() })
    .parse(raw);
  const lastPage = Math.max(1, Math.ceil(page.total / filters.pageSize));
  if (filters.page > lastPage)
    return readIdeas(client, { ...filters, page: lastPage });
  return {
    rows: page.rows.map(mapIdea),
    total: page.total,
    filters,
    counts: {},
    categoryCounts: {},
  };
}
// Read and sanitize an individual idea with its live conversation and histories.
export async function readDetail(id: string) {
  return mapDetail(
    await rpc(createClient(), "get_idea_detail", { p_idea_id: id }),
  );
}
// Save and optionally submit/resubmit the form in one database transaction.
export async function saveIdea(
  values: IdeaFormValues,
  id?: string,
  submit = false,
) {
  return rpc(createClient(), "save_idea_form", {
    p_idea_id: id ?? null,
    p_submit: submit,
    p_values: {
      ...values,
      links: values.links
        .split(/\n/)
        .map((x) => x.trim())
        .filter(Boolean),
    },
  });
}
// Persist vote/follow state through validated user-facing functions.
export async function engageIdea(
  id: string,
  kind: "vote" | "follow",
  active: boolean,
) {
  return rpc(
    createClient(),
    kind === "vote"
      ? active
        ? "unvote_for_idea"
        : "vote_for_idea"
      : active
        ? "unfollow_idea"
        : "follow_idea",
    { p_idea_id: id },
  );
}
// Persist a comment, reply, edit or soft deletion using the existing RPC rules.
export async function writeComment(input: {
  ideaId: string;
  content: string;
  commentId?: string;
  parentId?: string;
  remove?: boolean;
}) {
  return input.commentId
    ? rpc(
        createClient(),
        input.remove ? "delete_idea_comment" : "edit_idea_comment",
        {
          p_comment_id: input.commentId,
          ...(!input.remove ? { p_content: input.content } : {}),
        },
      )
    : rpc(createClient(), "add_idea_comment", {
        p_idea_id: input.ideaId,
        p_content: input.content,
        p_parent_comment_id: input.parentId ?? null,
      });
}
// Fetch a bounded page of assignable users or anonymity-safe visible owners.
export async function readOwners(
  page = 1,
  assign = false,
): Promise<{ rows: OwnerOption[]; total: number }> {
  const r = await rpc(
    createClient(),
    assign ? "list_idea_owners" : "list_visible_owners",
    { p_page: page, p_page_size: 100 },
  );
  return z
    .object({
      rows: z.array(
        z.object({ id: z.string(), full_name: z.string().nullable() }),
      ),
      total: z.coerce.number(),
    })
    .parse(r);
}
