// dashboard-performance.test.mjs — Protect server filtering and lean dashboard requests.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
// Compile one utility with explicit dependencies and no live network access.
function load(path, stubs = {}) {
  const loaded = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => name === "server-only" ? {} : stubs[name] ?? require(name), loaded, loaded.exports,
  );
  return loaded.exports;
}
const { parseFilters } = load("src/lib/dashboard-filters.ts");
// Supply authenticated identities and track which authorized query is requested.
function dashboard(identity, readIdeas, rpc = async () => ({})) {
  return load("src/lib/api/dashboard.ts", {
    "./session": { getIdentity: async () => identity },
    "@/lib/supabase/server": { createClient: async () => ({}) },
    "@/lib/dashboard-filters": { parseFilters },
    "./ideas": { readIdeas, rpc },
  });
}
test("dashboard reads reject unauthenticated requests before querying data", async () => {
  const { readDashboard } = dashboard(null, () => assert.fail("Unexpected RPC"));
  await assert.rejects(() => readDashboard({}), /Please sign in again/);
});
test("dashboard URL cannot spoof role, pagination or filtering ownership", async () => {
  let filters;
  const { readDashboard } = dashboard({ role: "member" }, async (_client, value) => {
    filters = value;
    return { filters, rows: [], total: 0 };
  });
  await readDashboard({ role: "admin", view: "admin", page: "2", pageSize: "10", owner: "Unassigned" });
  assert.equal(filters.role, "member");
  assert.equal(filters.view, "all");
  assert.equal(filters.page, 2);
  assert.equal(filters.pageSize, 10);
  assert.equal(filters.owner, "Unassigned");
});
test("Admin overview starts three independent reads without an unused all-ideas query", async () => {
  const calls = [];
  let resolveQueue;
  const blocked = new Promise(resolve => { resolveQueue = resolve; });
  const { readDashboard } = dashboard({ role: "admin" }, async (_client, filters) => {
    calls.push(filters.view);
    await blocked;
    return { rows: [], total: 0, filters };
  }, async () => {
    calls.push("counts");
    return { status_counts: {}, category_counts: {} };
  });
  const result = readDashboard({ view: "admin" });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls, ["counts", "review", "overdue"]);
  resolveQueue();
  assert.equal((await result).data.filters.view, "admin");
});
test("dashboard HTTP transport preserves cancellation and excludes browser role claims", async () => {
  const { fetchDashboard, dashboardKey } = load("src/lib/api/dashboard-client.ts");
  const filters = parseFilters({ role: "admin", view: "review", page: "2" });
  const original = globalThis.fetch;
  const controller = new AbortController();
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ data: { rows: [] } }) };
  };
  try {
    await fetchDashboard(filters, controller.signal);
    const url = new URL(request.url, "http://localhost");
    assert.equal(url.searchParams.has("role"), false);
    assert.equal(url.searchParams.get("page"), "2");
    assert.equal(request.options.signal, controller.signal);
    assert.equal(request.options.cache, "no-store");
    assert.notDeepEqual(dashboardKey("member-a", filters), dashboardKey("member-b", filters));
    const all = { ...filters, view: "all" };
    assert.deepEqual(dashboardKey("same-user", all), dashboardKey("same-user", { ...all, personal: "following" }));
    assert.notDeepEqual(dashboardKey("same-user", { ...all, view: "my", personal: "drafts" }),
      dashboardKey("same-user", { ...all, view: "my", personal: "following" }));
    for (const view of ["all", "my", "review", "overdue"]) {
      assert.notDeepEqual(dashboardKey("same-user", { ...all, view, layout: "board" }),
        dashboardKey("same-user", { ...all, view, layout: "list" }));
    }
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: "Please sign in again." }) });
    await assert.rejects(() => fetchDashboard(filters), /Please sign in again/);
  } finally { globalThis.fetch = original; }
});

test("confirmed saves finish without waiting for pending background refetches", () => {
  let options;
  const events = [];
  const { useLiveMutation } = load("src/hooks/use-live-mutation.ts", {
    react: { useState: () => [null, () => {}] },
    "@tanstack/react-query": {
      useMutation: value => { options = value; return {}; },
      useQueryClient: () => ({ invalidateQueries: () => {
        events.push("refresh"); return new Promise(() => {});
      } }),
    },
  });
  useLiveMutation(async () => {}, () => events.push("confirmed"));
  assert.equal(options.onSuccess(), undefined);
  assert.deepEqual(events, ["confirmed", "refresh"]);
});
