# WeaveStudio Quality Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make WeaveStudio's local persistence, generated deliverables,
optional AI, exports, accessibility, privacy, verification documentation, and
research readiness demonstrably reliable within their stated scope.

**Architecture:** Preserve the browser-local design, but move validation and
record assignment into reusable, testable helpers. Storage mutations become
transactional at their multi-record boundary; output composition and readiness
use the same assignment model; an AI draft has an immutable target signature;
and external rendering is guarded until the user asks to load it.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Playwright, React Flow,
jsPDF, DOMPurify, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-10-12-quality-remediation-design.md`

**Global constraints**

- Start every behavior change with a focused failing test and record the RED
  result before implementation.
- Do not weaken human review or protected-branch requirements. Do not publish
  production from this branch.
- Treat Markdown and JSON as the full-fidelity handoff formats; PDFs are a
  paginated reading view.
- No live provider call, user data, or participant data is sent during tests.
- Every multi-record storage test compares exact key/value bytes before and
  after cancellation or failed mutation.

## File map

- `src/lib/schema.ts` — structural validation of documents, snapshots, and
  full-backup records.
- `src/lib/workspaceStore.ts` — durable record transactions, import and
  restore behavior, snapshots, and propagation of save failures.
- `src/pages/WorkspacePage.tsx` — split confirmation, save feedback,
  history command boundaries, template-aware readiness.
- `src/lib/workspaceHistory.ts` — short-lived, explicit coalescing for
  continuous edits only.
- `src/lib/deliverableEngine.ts` and
  `src/lib/workflowValidator.ts` — shared template section assignment and
  complete output readiness.
- `src/lib/ai.ts` and `src/components/workspace/WorkspacePanels.tsx` —
  Responses parsing, response classes, and target-bound AI drafts.
- `src/lib/exporter.ts` — reusable PDF page planning and line rendering.
- `src/components/workspace/OutputPreviewPanel.tsx`,
  `src/components/workspace/MarkdownImage.tsx`, and route components —
  safe Markdown rendering and contrast repair.
- `vitest.config.ts`, `src/**/*.test.*`, and `e2e/**/*.spec.ts` —
  complete test discovery and behavior coverage.
- `docs/` and `docs/research/` — current provider/release guidance and
  participant-study instruments.

## Task 1: Make local data recovery and cancellation lossless

**Files:** `src/lib/schema.ts`, `src/lib/workspaceStore.ts`,
`src/lib/workspaceStore.test.ts`, `src/lib/schema.test.ts`,
`src/pages/WorkspacePage.tsx`, `e2e/workspace.spec.ts`

- [ ] Add failing unit tests for a nested-invalid workspace document, a backup
  missing an indexed document, malformed snapshots, settings-only backup,
  import-as-new of a full backup, and simulated document/index write failure.
  **Expected:** tests fail because malformed records pass or save reports
  success.
- [ ] Add a failing restoration transaction test that injects an individual
  `localStorage.setItem` failure and compares all owned key/value bytes with
  the pre-restore set. **Expected:** test fails because failed restore can
  leave partial bytes.
- [ ] Implement strict nested validation and a staged restore transaction:
  validate all records, write/verify exact bytes, and roll back to prior bytes
  on failure. Reject a full backup from import-as-new with guidance to the
  dedicated restore action. Propagate document, index, duplicate, snapshot,
  and active-index write failures.
- [ ] Add a failing Playwright test which opens split replacement confirmation,
  cancels it, and asserts the storage snapshot and node count are unchanged.
  **Expected:** it fails because the legacy fragment path applies the split.
- [ ] Remove the fragment/hash confirmation bypass, return immediately after
  opening confirmation, and expose save failures in the workspace UI.
- [ ] Run focused storage/schema/browser tests, then `npm test`.
- [ ] Commit: `fix(storage): make import restore and cancellation lossless`

## Task 2: Share correct template assignment between composition and readiness

**Files:** `src/lib/deliverableEngine.ts`,
`src/lib/deliverableEngine.test.ts`, `src/lib/workflowValidator.ts`,
`src/lib/workflowValidator.test.ts`, `src/data/templates.test.ts`,
`src/pages/WorkspacePage.tsx`

- [ ] Add a failing composition test with overlapping type/category selectors
  that proves a decision/open-question transform cannot be consumed by an
  action/evidence section. Add a multiline provenance assertion that has stable
  source references.
- [ ] Extract a section-assignment helper that uses node IDs as explicit
  assignments, category matching for categorized nodes, and type matching only
  for nodes without a category. Give each node at most one destination.
- [ ] Add failing validator tests for a populated graph that is missing a
  required template section. **Expected:** readiness reports Ready today.
- [ ] Feed the same assignment output to the validator, producing a specific
  required-section issue and preventing Ready while it is empty.
- [ ] Add a table-driven end-to-end composition/validation test for every
  `pack: 'primary'` template with complete fixture content. **Expected:**
  all compose successfully and their readiness is Ready.
- [ ] Run focused tests and `npm test`.
- [ ] Commit: `fix(output): align section routing with template readiness`

## Task 3: Make optional AI response handling target-safe

**Files:** `src/lib/ai.ts`, `src/lib/ai.test.ts`,
`src/components/workspace/WorkspacePanels.tsx`,
`src/components/workspace/WorkspacePanels.test.tsx`,
`e2e/workspace.spec.ts`

- [ ] Add failing `runAIRequest` tests for a realistic OpenAI Responses REST
  `output[].content[].text` payload, refusal content, 401, 429, and abort.
- [ ] Parse supported Responses shapes, report refusal/auth/rate-limit
  failures accurately, and retain cancellation semantics.
- [ ] Add a failing component or Playwright test for a delayed request on node
  A followed by selection/change of node B; the returned draft must not appear
  as an apply-able draft for B. Add a stale-revision Apply test.
- [ ] Bind request/draft state to workspace ID, node ID, and a stable input
  fingerprint. Only show Apply at the original target/revision; invalidate on
  cancellation and clearly explain stale results.
- [ ] Run focused tests and `npm test`.
- [ ] Commit: `fix(ai): bind provider drafts to the requested node revision`

## Task 4: Preserve complete exports and meaningful recovery commands

**Files:** `src/lib/exporter.ts`, `src/lib/exporter.test.ts`,
`src/lib/workspaceHistory.ts`, `src/lib/workspaceHistory.test.ts`,
`src/pages/WorkspacePage.tsx`, `src/lib/snapshots.test.ts`

- [ ] Add a failing pure PDF-layout test for a block exceeding one page.
  **Expected:** the current layout places text below its bottom margin.
- [ ] Implement page-aware wrapped-line planning/rendering, repeating page
  footer behavior and preserving content order.
- [ ] Add failing history tests proving separate commands require separate
  undo presses while one short uninterrupted text edit is coalesced.
- [ ] Replace the global mutation group with per-command history and bounded
  explicit text/canvas coalescing. Add re-imported full-draft/snapshot
  assertions.
- [ ] Run focused tests and `npm test`.
- [ ] Commit: `fix(export): paginate PDFs and bound undo commands`

## Task 5: Close executable QA, accessibility, privacy, and production dependency gaps

**Files:** `vitest.config.ts`, `src/components/workspace/MarkdownImage.tsx`,
`src/components/workspace/OutputPreviewPanel.tsx`, `src/pages/DocsPage.tsx`,
`src/pages/TemplatesGallery.tsx`, `src/pages/WorkspacePage.tsx`,
`src/**/*.test.tsx`, `e2e/**/*.spec.ts`, `package.json`,
`package-lock.json`

- [ ] Add a failing discovery check for existing `.test.tsx` files and a
  rendering test that external Markdown images are not requested before an
  explicit click.
- [ ] Include TSX tests in Vitest; implement the opt-in remote image gate
  without allowing unsafe URL schemes.
- [ ] Add failing route/dialog assertions for dark-text contrast corrections,
  text links with visible affordance, and workspace/output modal states.
- [ ] Repair the audited color classes/underlines and add Playwright coverage
  for all public routes plus critical dialogs/sheets.
- [ ] Move build-only typography tooling out of the production dependency
  graph and update only compatible production vulnerability resolutions.
  **Expected:** `npm audit --omit=dev` reports no production finding after
  the regular verification suite passes.
- [ ] Run `npm run verify` and `npm audit --omit=dev`.
- [ ] Commit: `fix(quality): cover TSX privacy a11y and production deps`

## Task 6: Align product claims with demonstrated evidence

**Files:** `docs/AI-PROVIDERS.md`, `docs/KNOWN_LIMITATIONS.md`,
`docs/RELEASE_VERIFICATION.md`, `README.md`, `docs/research/*`,
`scripts/verify-buyer.mjs`, `.github/workflows/ci.yml`

- [ ] Add documentation-validation tests that fail on retired Mock/Ollama
  guidance and stale static test-count claims.
- [ ] Update provider/offline documentation to name OpenAI/Gemini accurately,
  preserve the offline-by-default workflow claim, and distinguish historical
  release evidence from a candidate's fresh verification.
- [ ] Produce a participant consent note, moderator task script, completion
  and time ledger, and analysis guide for consultant, researcher, and
  operations participants. Make the templates explicitly blank evidence,
  never fabricated results.
- [ ] Emit exact candidate commit, UTC date, command, and result through the
  validation workflow so a release claim can point to a reproducible run.
- [ ] Run docs validation, `npm run verify`, and inspect a production-like
  preview deployment.
- [ ] Commit: `docs: make verification and study evidence current`

## Review focus

- Transaction rollback must preserve exact original bytes, including records
  unrelated to the current active workspace.
- Category/type selector precedence must not discard a legitimate uncategorized
  node or accidentally consume it twice.
- An AI response must not mutate any node when its source revision is stale.
- Long PDF text must paginate in the rendered output, not only in a pure
  helper.
- Remote Markdown images must be inert until a local user gesture, and no
  adjusted contrast fix may reduce light-surface readability.
- Final documentation must not claim study results, verification, deployment,
  or approval that has not happened.
