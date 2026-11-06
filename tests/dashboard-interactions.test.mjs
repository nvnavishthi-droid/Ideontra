// dashboard-interactions.test.mjs — Protect status coverage and deleted-branch rendering.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
// Compile a utility with only explicit local dependencies and no browser/network.
function load(path, stubs = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => stubs[name] ?? require(name), mod, mod.exports);
  return mod.exports;
}
test("all final statuses appear on boards while Draft stays in My Ideas", () => {
  const types = load("src/types/idea.ts");
  const { getBoardStatuses } = load("src/lib/board-statuses.ts", { "@/types/idea": types });
  for (const view of ["all", "review", "overdue"]) {
    const result = getBoardStatuses(view);
    for (const status of ["Done", "Rejected", "Withdrawn"]) assert.ok(result.includes(status));
    assert.equal(result.includes("Draft"), false);
  }
  assert.deepEqual(getBoardStatuses("my"), types.statuses);
});
test("deleted roots hide their entire branch and deleted replies do not hide siblings", () => {
  const { getVisibleComments } = load("src/lib/visible-comments.ts");
  const comments = [
    { id: "deleted", parent_comment_id: null, deleted_at: "now" },
    { id: "hidden-reply", parent_comment_id: "deleted", deleted_at: null },
    { id: "live", parent_comment_id: null, deleted_at: null },
    { id: "reply", parent_comment_id: "live", deleted_at: null },
    { id: "removed-reply", parent_comment_id: "live", deleted_at: "now" },
    { id: "orphan", parent_comment_id: "missing", deleted_at: null },
  ];
  assert.deepEqual(getVisibleComments(comments).map(comment => comment.id), ["live", "reply"]);
  assert.equal(comments.length, 6);
});
