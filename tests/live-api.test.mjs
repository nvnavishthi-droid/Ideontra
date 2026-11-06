// live-api.test.mjs — Validate live RPC projections, query contracts and draft boundaries.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
// Load API utilities with a browser-client stub and no network or new dependencies.
function load(relative) {
  const path = resolve(relative);
  const mod = { exports: {} };
  const output = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  // Resolve project utility imports without constructing a real browser client.
  function localRequire(name) {
    if (name === "@/lib/supabase/client")
      return {
        createClient: () => {
          throw Error("Unexpected network request");
        },
      };
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
    if (name.startsWith(".")) return load(resolve(dirname(path), `${name}.ts`));
    return require(name);
  }
  new Function("require", "module", "exports", output)(
    localRequire,
    mod,
    mod.exports,
  );
  return mod.exports;
}
const { mapIdea } = load("src/lib/api/idea-mapping.ts");
const { readIdeas, rpc } = load("src/lib/api/ideas.ts");
const { parseFilters } = load("src/lib/dashboard-filters.ts");
const { draftSchema, ideaSchema } = load("src/lib/form-schemas.ts");
const raw = {
  id: "test-id",
  title: "Live idea",
  category: "Internal Tool",
  status: "Submitted",
  problem: "Problem",
  proposed_solution: "Solution",
  who_benefits: "Team",
  expected_impact: "Benefit",
  rough_effort: null,
  links: [],
  is_anonymous: true,
  author_name: null,
  owner_name: null,
  owner_id: null,
  is_author: false,
  is_owner: true,
  vote_count: 7,
  comment_count: 2,
  has_voted: true,
  is_following: true,
  impact_score: null,
  effort_score: null,
  evaluation_quadrant: null,
  target_date: null,
  submitted_at: "2026-11-05T10:00:00Z",
  created_at: "2026-11-05T10:00:00Z",
  updated_at: "2026-11-05T10:00:00Z",
  is_overdue: false,
  outcome_summary: null,
  demo_video_path: null,
  demo_video_url: null,
};
test("sanitized live mapping preserves ownership flags and existing vote totals", () => {
  const mapped = mapIdea({ ...raw, submitter_id: "must-not-return" });
  assert.equal(mapped.author, "Anonymous");
  assert.equal(mapped.isOwner, true);
  assert.equal(mapped.votes, 7);
  assert.equal(mapped.voted, true);
  assert.ok(!JSON.stringify(mapped).includes("must-not-return"));
});
test("server pagination/filter/sort are sent to RPC without reducing returned rows", async () => {
  let request;
  const client = {
    rpc: async (name, args) => {
      request = { name, args };
      return { data: { rows: [raw], total: 201 }, error: null };
    },
  };
  const result = await readIdeas(
    client,
    parseFilters({
      role: "admin",
      view: "review",
      page: "2",
      pageSize: "10",
      owner: "Unassigned",
      q: "onboarding",
      sort: "votes",
    }),
  );
  assert.equal(request.name, "list_ideas");
  assert.equal(request.args.p_status, "Submitted");
  assert.equal(request.args.p_page, 2);
  assert.equal(request.args.p_page_size, 10);
  assert.equal(request.args.p_sort, "votes");
  assert.equal(request.args.p_owner, "00000000-0000-0000-0000-000000000000");
  assert.equal(result.rows.length, 1);
  assert.equal(result.total, 201);
});
test("board requests include final statuses and review defaults oldest-first", async () => {
  const requests = [];
  const client = { rpc: async (_name, args) => {
    requests.push(args);
    return { data: { rows: [{ ...raw, status: "Done" }], total: 1 }, error: null };
  } };
  for (const view of ["all", "my", "review", "overdue"]) {
    const result = await readIdeas(client, parseFilters({ role: "admin", view, layout: "board" }));
    assert.equal(requests.at(-1).p_active_statuses, null);
    assert.equal(result.rows[0].status, "Done");
    assert.equal(requests.at(-1).p_sort, view === "review" ? "oldest" : "newest");
  }
});
test("RPC failures are propagated rather than silently returning empty data", async () => {
  await assert.rejects(
    () =>
      rpc(
        {
          rpc: async () => ({
            data: null,
            error: { message: "Permission denied" },
          }),
        },
        "list_ideas",
        {},
      ),
    /Permission denied/,
  );
});
test("incomplete drafts are valid while submit validation and persisted caps remain enforced", () => {
  const draft = {
    title: "",
    category: "",
    problem: "",
    solution: "",
    beneficiaries: "",
    impact: "",
    effort: "",
    links: "",
    anonymous: false,
  };
  assert.equal(draftSchema.safeParse(draft).success, true);
  assert.equal(ideaSchema.safeParse(draft).success, false);
  assert.equal(
    draftSchema.safeParse({ ...draft, problem: "x".repeat(5001) }).success,
    false,
  );
  assert.equal(
    draftSchema.safeParse({
      ...draft,
      links: "https://example.com\nhttps://example.org",
    }).success,
    true,
  );
});

// Legacy nullable optional fields must not prevent authorized lists from loading.
test("legacy null links normalize to an empty link list", () => {
  assert.equal(mapIdea({ ...raw, links: null }).links, "");
});
