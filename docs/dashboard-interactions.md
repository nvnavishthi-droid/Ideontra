# Dashboard interaction corrections — 2026-11-06

Status: implemented and verified locally. User instructions supersede earlier active-
status-only boards and deleted-comment placeholders. Relevant FRD: FR-4.4,
FR-5.1–5.4, FR-9 and FR-10; draft privacy and workflow permissions remain intact.

- Click anywhere on an idea card to open details. A native button supplies
  keyboard activation and visible focus; the overflow menu remains independent.
- Vote/comment counts on cards are read-only. Vote and Follow inside details
  remain functional, as explicitly confirmed by the user.
- Click a table row or press Enter/Space while focused to open its idea. Remove
  the Action/Open idea column everywhere, retaining Submitted/Target date fields.
- Board/List/sort controls appear in All Ideas, every My Ideas tab, Review and
  Overdue. Keep Admin Overview's count/category/review summary, as confirmed.
- Preserve selected layout across views. Board columns include all nine public
  statuses and additionally Draft in My Ideas. All Ideas still excludes drafts;
  database author visibility protects every returned draft. Keep server paging,
  filtering, sorting, URL state, skeletons and bounded internal scrolling.
- Review defaults oldest-first; explicitly selected newest/votes/updated sorts
  run on the server. Admin Overview's queue explicitly requests oldest-first.
- User explicitly chose to hide a deleted comment and its replies. Retain the
  database tombstone and reply records, but omit the branch from detail results
  and visible comment counts. No hard deletion or permission expansion occurs.
- Reuse existing FK/PK/partial comment indexes for parent lookup and counts.
  Preserve auth checks, search_path, DEFINER grants and anonymity masking.

Implementation choices: stretched button rather than nested buttons; focusable
rows preserve table semantics; public boards omit the private Draft column while
My Ideas includes it. These are reversible and logged in decisions.md.

Read RPC migration 20261106082337 was applied through MCP to the locked project.
Summary/detail comment projections omit deleted branches; list sorting accepts
oldest alongside newest/votes/updated. Existing grants and search_path are retained.
No new RLS policy, dependency, route, commit, push or deployment is required.
Pencil tools are not available in this session; no test.pen edits are claimed.

## Verification

- Production build, TypeScript, lint and all 28 unit tests pass. Server request
  tests cover final statuses, review defaults/explicit sort and layout cache keys.
- All five rollback SQL suites pass, including actual comment deletion, hidden
  parent/reply branches, visible counts, retained stored rows, anonymous identity,
  author-private drafts and oldest/newest/votes/updated review ordering. No test
  records persist. Existing PK/FK/active-comment indexes cover the changed reads.
- Edge/Playwright at http://127.0.0.1:3003, 1440x900 and 390x844, because Browser
  plugin is unavailable. Real Admin sign-in verified page identity, populated
  content, no framework overlay, no console/runtime errors, card-body clicks,
  native button keyboard activation and independent overflow menu. Card counts
  have no buttons/actions; detail Vote/Follow controls remain.
- Table rows open via cell click/Enter/Space; Action is absent from all four/five-
  column tables. Every My Ideas tab, Review and Overdue exposes Board/List/sort;
  Review Newest updates the server URL/read. Admin Overview retains summary panels.
  Final statuses and 9/10 columns are present with internal horizontal scrolling;
  controls/pagination fit both viewports. Desktop/mobile screenshots were inspected.
- A mocked stale detail response verified hidden deleted parent/reply content,
  no deletion placeholder, matching discussion count and updated delete-confirmation
  text; no comment was saved from the browser. Real persistence behavior is covered
  by rollback SQL tests. Browser interactions made no content writes.
- Security advisors retain intentional RPC-only table/DEFINER warnings and the
  pre-existing disabled leaked-password warning; no grants or RLS were expanded.
  No new security findings were introduced by the three existing RPC replacements.
- Pencil synchronization is complete through the installed extension MCP. The
  87-artboard set covers the approved interactions and loading states. Publication
  and production verification are tracked in release-2026-11-06.md.
