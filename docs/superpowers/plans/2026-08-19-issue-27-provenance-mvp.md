# WeaveStudio Issue #27 Provenance MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-first, explicit claim-to-source provenance vertical slice that lets reviewers trace annotated claims to exact source fragments while surfacing stale, broken, and missing lineage without changing readiness semantics.

**Architecture:** Store an optional versioned provenance graph inside `WorkspaceDocument`. Put all provenance semantics in a pure `src/lib/provenance.ts` module, validate the graph at import boundaries, preserve it through snapshots/project portability, and expose explicit annotation/reviewer controls through the existing source and output panels. No automatic inference, backend, factuality checking, or cryptographic authenticity claims.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 4, Playwright 1.61, localStorage workspace persistence.

**Spec:** `docs/superpowers/specs/2026-08-19-issue-27-provenance-mvp-design.md`

## Global Constraints

- Work only on `feat/issue-27-provenance-mvp`; never write directly to `main`.
- Strict TDD: each behavioral production change starts with a failing test and an observed expected failure.
- Keep `WORKSPACE_SCHEMA_VERSION = 1`; provenance is optional/backward-compatible.
- Provenance fingerprints are deterministic stale-reference detectors, not security or authenticity proof.
- Missing, stale, broken, or malformed provenance fails closed and is never shown as valid.
- Do not alter the #26 human-review/export-readiness gate.
- Do not add backend services, vector search, web citations, factuality checking, cryptographic verification, fuzzy re-anchoring, automatic lineage inference, or new node types.
- Project export/import and full snapshot restore must preserve provenance IDs exactly.
- Existing data without provenance remains valid.

---

### Task 1: Core provenance model and deterministic resolver

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/provenance.ts`
- Create/Test: `src/lib/provenance.test.ts`

**Interfaces:**
- Produces `ProvenanceDerivation`, `SourceFragment`, `ProvenanceClaim`, `ProvenanceGraph`, and optional `WorkspaceDocument.provenance` / `VersionSnapshot.provenance`.
- Produces `fingerprintText`, `createSourceFragment`, `createProvenanceClaim`, `validateSourceFragment`, `validateProvenanceClaim`, `resolveClaimTrace`, and `extractClaimCandidates`.

- [ ] **Step 1: Write the failing core behavior tests**

Create tests covering direct, transformed, multi-source, source mutation, invalid offsets/deleted fragment, claim mutation, cosmetic position-only change, AI-assisted derivation label, and no-fragment missing state. Use stable fixture IDs supplied to factory functions so assertions do not depend on random UUIDs.

Representative fixture/API:

```ts
const source = 'Alpha evidence. Beta evidence.';
const fragment = createSourceFragment({ sourceMaterial: source, startOffset: 0, endOffset: 15, id: 'frag_alpha' });
const claim = createProvenanceClaim({
  id: 'claim_1',
  nodeId: 'out_1',
  claimText: 'Alpha conclusion',
  sourceFragmentIds: ['frag_alpha'],
  derivation: 'direct',
});
const graph: ProvenanceGraph = {
  version: 1,
  sourceFingerprint: fingerprintText(source),
  fragments: [fragment],
  claims: [claim],
};
expect(resolveClaimTrace({ claim, graph, sourceMaterial: source, nodes })).toMatchObject({ status: 'valid' });
```

- [ ] **Step 2: Verify RED**

Use the PR-triggered CI after committing only the new test file. Expected failure: TypeScript/Vitest cannot resolve `./provenance` and/or provenance types because production code is intentionally absent.

- [ ] **Step 3: Add minimal provenance types**

Add exactly the data model from the approved design and optional provenance fields to workspace/snapshot types; keep schema version unchanged.

- [ ] **Step 4: Implement deterministic fingerprinting and factories**

Use a stable synchronous 32-bit FNV-1a style hash over UTF-16 code units and return a namespaced hex string such as `fnv1a32:<8-hex-digits>`. Factories trim neither selected quotes nor claim text; preserve exact source slices and user-visible claim text.

- [ ] **Step 5: Implement fail-closed validation/resolution**

Rules:

```ts
fragment valid  = offsets in range && source.slice(start,end) === quote && fingerprintText(quote) === quoteFingerprint
fragment stale  = offsets in range but current slice/quote fingerprint differs
fragment broken = invalid offsets

claim missing = sourceFragmentIds.length === 0
claim broken  = claim node absent || referenced fragment absent || required via node absent || any fragment broken
claim stale   = current node content does not contain claimText || fingerprintText(claimText) !== claimFingerprint || any fragment stale
claim valid   = otherwise all referenced fragments valid
```

`resolveClaimTrace` must return fragments with individual statuses and existing intermediate nodes in declared order.

- [ ] **Step 6: Add deterministic paragraph/list-item claim candidate extraction**

`extractClaimCandidates(nodes)` should return trimmed non-empty paragraphs/list items from `output`, `conclusion`, `evidence`, and `decision` nodes; strip a leading Markdown bullet marker from list items; include `{ nodeId, text }`; preserve ordering by node order then content order; deduplicate exact `(nodeId,text)` pairs.

- [ ] **Step 7: Verify GREEN**

Run the PR CI and confirm provenance tests plus all existing tests/lint/typecheck/build/browser/package checks pass before proceeding.

---

### Task 2: Schema validation and project portability

**Files:**
- Modify/Test: `src/lib/schema.test.ts`
- Modify: `src/lib/schema.ts`
- Modify/Test: `src/lib/workspaceStore.test.ts`

**Interfaces:**
- `validateWorkspaceDocument` preserves valid provenance exactly.
- Malformed provenance rejects the workspace/project rather than dropping malformed data silently.
- Existing project export/import functions preserve graph IDs via the workspace object.

- [ ] **Step 1: Add failing schema/project tests**

Add one valid provenance fixture to `validWorkspace`, assert `validateWorkspaceDocument` preserves fragment/claim IDs, assert wrapped project export preserves them, and assert malformed structures are rejected (negative offsets, `endOffset < startOffset`, non-string IDs, unknown derivation, missing graph arrays, duplicate IDs, claim referencing an unknown fragment).

- [ ] **Step 2: Verify RED**

Commit only tests and observe expected failures because current schema ignores provenance.

- [ ] **Step 3: Implement explicit provenance parsers**

In `schema.ts`, add structural parsing helpers. Require `version === 1`, finite non-negative integer offsets with `endOffset >= startOffset`, non-empty string IDs, permitted derivation values, string arrays for refs, unique fragment IDs, unique claim IDs, and all `sourceFragmentIds` to resolve within the graph. Do not require `viaNodeIds` to exist at import time; runtime resolver owns broken node lineage after project mutation.

- [ ] **Step 4: Preserve parsed provenance in `WorkspaceDocument`**

Only attach `provenance` when absent or validated. If a provenance key is present but malformed, return `{ ok:false }` rather than silently dropping it.

- [ ] **Step 5: Add project export/import round-trip test**

Use `buildProjectExport` and `importProjectFile` in jsdom/localStorage; assert imported provenance IDs and fields match exactly.

- [ ] **Step 6: Verify GREEN**

Run CI and inspect full validation job.

---

### Task 3: Snapshot preservation and backward-compatible restore

**Files:**
- Modify/Test: `src/lib/workspaceStore.test.ts`
- Modify: `src/lib/workspaceStore.ts`
- Modify if needed: `src/types/index.ts`

**Interfaces:**
- `saveSnapshot` copies `workspace.provenance` deeply.
- Full snapshot restore restores provenance exactly.
- Legacy snapshot without provenance restores with provenance absent, never synthesized.

- [ ] **Step 1: Add failing snapshot tests**

Create a workspace with one fragment/claim, save a snapshot, mutate/clear provenance, apply the snapshot, and assert the original IDs/quotes/claims are restored. Add a legacy snapshot fixture without provenance and assert restored provenance is `undefined`.

- [ ] **Step 2: Verify RED**

Observe expected failure because snapshots currently do not copy provenance.

- [ ] **Step 3: Implement snapshot copy/restore**

Add `provenance: workspace.provenance ? structuredClone(workspace.provenance) : undefined` to full snapshots and corresponding full-restore logic.

- [ ] **Step 4: Verify GREEN**

Run CI and confirm existing review-state snapshot/portability tests remain passing.

---

### Task 4: Source-fragment authoring through selected source text

**Files:**
- Modify: `src/components/workspace/SourceIngestPanel.tsx`
- Modify: `src/pages/WorkspacePage.tsx`
- Test behavior primarily through `e2e/release.spec.ts` in Task 6; pure duplicate/reuse behavior belongs in provenance unit tests.

**Interfaces:**
- `SourceIngestPanel` adds `onAddSourceFragment(startOffset,endOffset)` and uses a textarea ref/selection state.
- WorkspacePage creates/reuses fragments in `workspace.provenance` and keeps persistence ownership in the page.

- [ ] **Step 1: Add pure failing duplicate-fragment helper test**

Add `upsertSourceFragment(graph, sourceMaterial, startOffset, endOffset)` to the intended API through a failing test: exact same offsets/quote/current source should return the existing fragment ID and not increase fragment count.

- [ ] **Step 2: Verify RED**

Observe missing helper failure.

- [ ] **Step 3: Implement `upsertSourceFragment`**

Initialize `{ version:1, sourceFingerprint:fingerprintText(sourceMaterial), fragments:[], claims:[] }` when graph is absent. Reuse only an exact currently matching fragment; otherwise append a new fragment without rewriting historical fragments. Update graph-level `sourceFingerprint` to the current source fingerprint when authoring.

- [ ] **Step 4: Wire source selection UI**

Use `useRef<HTMLTextAreaElement>` and `onSelect` to track `selectionStart/selectionEnd`. Add a small `Add source fragment` button disabled when selection is empty. On success, clear selection state only; do not mutate source text.

- [ ] **Step 5: Wire workspace callback**

`WorkspacePage` uses functional `patchWorkspace` to call the helper and store the returned graph. Set a brief notice such as `Source fragment added for provenance.`. Source edits must not auto-rewrite stored fragment anchors.

- [ ] **Step 6: Verify GREEN**

Run CI before moving to claim/reviewer UI.

---

### Task 5: Explicit claim linking and reviewer-facing provenance inspector

**Files:**
- Modify/Test: `src/lib/provenance.test.ts`
- Modify: `src/lib/provenance.ts`
- Modify: `src/components/workspace/OutputPreviewPanel.tsx`
- Modify: `src/pages/WorkspacePage.tsx` only if prop wiring requires it

**Interfaces:**
- `upsertProvenanceClaim(graph, args)` creates/updates a claim keyed by `(nodeId, claimText)` while preserving explicit chosen fragments/derivation/via nodes.
- Output preview can switch between deliverable and provenance review, annotate candidates, and inspect statuses.

- [ ] **Step 1: Add failing claim-upsert tests**

Assert first annotation creates a deterministic supplied-ID claim; updating the same `(nodeId,claimText)` replaces links/derivation without duplicating; a different claim text creates a separate record.

- [ ] **Step 2: Verify RED**

Observe expected missing-helper failure.

- [ ] **Step 3: Implement claim upsert helper**

Require at least one source fragment for saved annotation; fingerprint the exact claim text; keep `viaNodeIds` explicit; never infer graph edges into provenance.

- [ ] **Step 4: Add provenance mode to Output Preview**

Add a third view control labeled `Provenance` beside Rendered/Edit. In provenance mode:

- show the trust-boundary copy verbatim: `Workspace lineage only — this does not verify the truth or authenticity of the source.`;
- show existing claim records with status badges resolved from current workspace state;
- selecting a recorded claim shows claim text, derivation, intermediate node titles, source quotes, offsets, and each fragment status;
- stale/broken/missing use warning/error semantics distinct from valid.

- [ ] **Step 5: Add explicit annotation form**

List `extractClaimCandidates(workspace.nodes)`. For a selected candidate, allow multi-select of existing source fragments, derivation select, and optional intermediate node multi-select restricted to `transform`/`aiAssist` nodes. `Save provenance` calls `onWorkspacePatch` with an updated graph. If there are no source fragments, explain that the user must select source text and add a fragment first.

- [ ] **Step 6: Preserve freeform draft trust boundary**

Do not attach provenance to arbitrary edited Markdown. Inspector status is computed against originating node content; claim mutation there becomes stale. No export/readiness blocking is added.

- [ ] **Step 7: Verify GREEN**

Run CI and verify #26 tests remain green.

---

### Task 6: Browser acceptance, documentation, and exact-head release verification

**Files:**
- Modify/Test: `e2e/release.spec.ts`
- Modify: `README.md` and/or `KNOWN_LIMITATIONS.md`
- Update: PR #29 description/checklist and issue #27 only after verification

**Interfaces:**
- Browser proof covers fragment creation, claim linking, valid trace inspection, and stale trace after source mutation.

- [ ] **Step 1: Add browser acceptance test before relying on UI manually**

Desktop scenario:

1. Open a deterministic workspace/template with source and a candidate output claim.
2. Select a known substring in the source textarea using DOM selection APIs and click `Add source fragment`.
3. Satisfy existing review/readiness requirements and open Generate.
4. Open `Provenance`, choose a claim candidate, select the fragment, choose `Direct`, save.
5. Assert `Valid`, exact source quote, and trust-boundary copy appear.
6. Close preview, mutate the referenced source substring, reopen preview, and assert the same claim trace is `Stale` rather than valid.

Use role/test-id selectors precise enough to avoid the prior strict-mode `Run` class of selector regression.

- [ ] **Step 2: Verify browser test RED if it precedes final UI wiring; otherwise perform mutation check**

To preserve regression integrity when UI is already present, temporarily revert the relevant UI/helper change locally is unavailable in connector execution; therefore rely on Tasks 4/5 RED commits for TDD and treat this as end-to-end acceptance coverage rather than the primary red test.

- [ ] **Step 3: Document provenance trust boundary**

State that provenance records workspace lineage only, does not establish factual truth/source authenticity, is browser-local, uses non-cryptographic stale-reference fingerprints, and can become stale/broken after source/node edits.

- [ ] **Step 4: Run exact-head verification**

Required commands are those in CI / `npm run verify`: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:browser`, buyer/docs verification, and acquisition packaging. Verify the CI run is attached to the exact final PR head SHA and concluded success.

- [ ] **Step 5: Review the final diff against #27 acceptance criteria**

Confirm every issue checkbox maps to code/test/UI/doc evidence. If any criterion is unsupported, leave the PR draft/open and report the gap rather than closing the issue.

- [ ] **Step 6: Finish branch safely**

Only after exact-head green CI: update PR body with evidence and move PR from draft to ready for review. Do not merge unless separately authorized. Do not close #27 before the implementation is merged and production verification is complete.
