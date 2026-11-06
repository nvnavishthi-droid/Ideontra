// preview.test.mjs — Verify fixture isolation, server filters and scoped UI rules.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const cache = new Map();
// Load TypeScript utilities without adding a test-runtime dependency.
function load(relative) {
  const path = resolve(relative);
  if (cache.has(path)) return cache.get(path);
  const output = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const mod = { exports: {} };
  cache.set(path, mod.exports);
  // Resolve project aliases and stub the server-only marker only inside this test harness.
  function localRequire(name) {
    if (name === "server-only") return {};
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
const { getPreviewPage, parseFilters } = load("tests/fixtures/preview.ts");
const { ideaActions, getQuadrant } = load("src/lib/idea-actions.ts");
const { authSchema, ideaSchema, validLink } = load("src/lib/form-schemas.ts");
const { filterName, filterDigits } = load("src/lib/form-input-filters.ts");
test("anonymous author is redacted before member props are produced", () => {
  assert.equal(
    getPreviewPage({ layout: "list" }).rows.find((x) => x.anonymous).author,
    "Anonymous",
  );
  assert.equal(
    getPreviewPage({ role: "admin", layout: "list" }).rows.find(
      (x) => x.anonymous,
    ).author,
    "Rahul M.",
  );
});
test("private drafts belong only to the active sample author", () => {
  assert.equal(getPreviewPage({ view: "my", tab: "drafts" }).rows.length, 2);
  assert.equal(
    getPreviewPage({ role: "admin", view: "my", tab: "drafts" }).rows.length,
    0,
  );
  assert.ok(
    getPreviewPage({ layout: "list" }).rows.every((x) => x.status !== "Draft"),
  );
});
test("server filters, short search and manual page sizes are normalized", () => {
  assert.equal(parseFilters({ q: "on", page: "-2", pageSize: "999" }).q, "");
  assert.equal(parseFilters({ page: "-2", pageSize: "999" }).page, 1);
  assert.equal(parseFilters({ pageSize: "999" }).pageSize, 25);
  const result = getPreviewPage({ layout: "list", category: "Training" });
  assert.ok(result.rows.every((x) => x.category === "Training"));
  assert.ok(getPreviewPage({ q: "no-such-idea" }).total === 0);
});
test("member cannot select an administrator dashboard view", () => {
  assert.equal(parseFilters({ view: "review" }).view, "all");
  assert.ok(
    getPreviewPage({ role: "admin", view: "review" }).rows.every(
      (x) => x.status === "Submitted",
    ),
  );
});
test("only scoped actions are shown for workflow roles", () => {
  const approved = getPreviewPage({}).rows.find((x) => x.status === "Approved");
  assert.ok(
    ideaActions({ ...approved, isOwner: true }, "member").some(
      (x) => x.action === "start",
    ),
  );
  assert.ok(
    !ideaActions({ ...approved, isOwner: true }, "member").some(
      (x) => x.action === "reassign",
    ),
  );
  const parked = getPreviewPage({}).rows.find((x) => x.status === "Parked");
  assert.ok(ideaActions(parked, "admin").some((x) => x.action === "resume"));
  assert.ok(!ideaActions(parked, "member").some((x) => x.action === "resume"));
});
test("quadrants use the FRD threshold of three", () => {
  assert.equal(getQuadrant(3, 2), "Quick Win");
  assert.equal(getQuadrant(3, 3), "Big Bet");
  assert.equal(getQuadrant(2, 2), "Fill-in");
  assert.equal(getQuadrant(2, 3), "Not Worth It");
});
test("exact signup domain and text input rules reject invalid input", () => {
  assert.ok(
    authSchema.safeParse({
      name: "Priya",
      email: "priya@closefuture.io",
      password: "testonly123",
    }).success,
  );
  for (const email of [
    "priya@example.com",
    "priya@closefuture.io.evil.test",
    "priya@sub.closefuture.io",
  ])
    assert.ok(
      !authSchema.safeParse({ name: "Priya", email, password: "testonly123" })
        .success,
    );
  assert.equal(filterName("Priya 123 S."), "Priya  S.");
  assert.equal(filterDigits("a12b3"), "123");
  assert.equal(validLink("javascript:alert(1)"), false);
});
test("idea fields and FRD title maximum validate together", () => {
  const base = {
    title: "Onboarding",
    category: "Internal Tool",
    problem: "Scattered setup",
    solution: "Shared list",
    beneficiaries: "New joiners",
    impact: "Faster setup",
    effort: "Small",
    links: "",
    anonymous: false,
  };
  assert.ok(ideaSchema.safeParse(base).success);
  assert.ok(!ideaSchema.safeParse({ ...base, title: "a".repeat(101) }).success);
  assert.ok(!ideaSchema.safeParse({ ...base, problem: "" }).success);
});
