# WeaveStudio Issue #27 Provenance MVP Design

## Purpose

Implement the smallest trustworthy claim-to-source provenance vertical slice for WeaveStudio so a reviewer can answer **where did this claim come from?** inside the local-first workspace without implying that lineage proves external factual truth or source authenticity.

This design implements GitHub issue #27 and is intentionally scoped as a trust-layer enhancement after the human-review readiness fix in #26.

## Product invariant

Every explicitly linked reviewable claim can expose a lineage path:

`claim → derivation step(s) → exact source fragment(s)`

A provenance trace must distinguish direct source support from transformed/manual/AI-assisted derivation. Missing, stale, or broken lineage must be surfaced explicitly and must never be treated as valid provenance.

## Scope

### In scope

1. Fragment-level source references using character offsets plus captured text and a deterministic content fingerprint.
2. Explicit claim records attached to a workspace node.
3. Claim-to-fragment links with derivation classification and optional intermediate node IDs.
4. Deterministic validation that marks a fragment or claim as valid, stale, broken, or missing.
5. Reviewer-facing provenance inspection inside the existing output preview.
6. Browser-local persistence only.
7. Project export/import and snapshot/restore preservation.
8. Tests for direct, transformed, multi-source, mutated-source, mutated-claim, cosmetic-edit, export/import, snapshot/restore, AI-assisted, and missing-provenance behavior.
9. Documentation that states provenance proves workspace lineage only.

### Explicit non-goals

Do not add a backend, database, embeddings, vector search, internet citation lookup, factuality checking, cryptographic source authenticity, collaborative provenance, automatic source discovery, fuzzy re-anchoring after arbitrary rewrites, or a new node type.

## Data model

Add the following types in `src/types/index.ts`.

```ts
export type ProvenanceDerivation =
  | 'direct'
  | 'transformed'
  | 'manual'
  | 'ai-assisted';

export interface SourceFragment {
  id: string;
  startOffset: number;
  endOffset: number;
  quote: string;
  quoteFingerprint: string;
  sourceFingerprint: string;
}

export interface ProvenanceClaim {
  id: string;
  nodeId: string;
  claimText: string;
  claimFingerprint: string;
  sourceFragmentIds: string[];
  viaNodeIds: string[];
  derivation: ProvenanceDerivation;
}

export interface ProvenanceGraph {
  version: 1;
  sourceFingerprint: string;
  fragments: SourceFragment[];
  claims: ProvenanceClaim[];
}
```

Add optional `provenance?: ProvenanceGraph` to `WorkspaceDocument` and `VersionSnapshot`.

Keep `WORKSPACE_SCHEMA_VERSION` unchanged because provenance is optional and backward compatible. Imported workspaces without provenance remain valid. New provenance content must be structurally validated before it is accepted.

## Fingerprints

Create a small deterministic synchronous fingerprint helper in the provenance module. It is a stale-reference detector, **not** a security primitive. The implementation must be stable across sessions and browsers and must not require Web Crypto or asynchronous code.

The docs and UI must never describe the fingerprint as cryptographic proof.

## Provenance engine

Create `src/lib/provenance.ts` as the only module that owns provenance semantics.

Required public operations:

```ts
fingerprintText(value: string): string

createSourceFragment(args: {
  sourceMaterial: string;
  startOffset: number;
  endOffset: number;
  id?: string;
}): SourceFragment

createProvenanceClaim(args: {
  nodeId: string;
  claimText: string;
  sourceFragmentIds: string[];
  viaNodeIds?: string[];
  derivation: ProvenanceDerivation;
  id?: string;
}): ProvenanceClaim

validateSourceFragment(
  fragment: SourceFragment,
  sourceMaterial: string,
): 'valid' | 'stale' | 'broken'

validateProvenanceClaim(
  claim: ProvenanceClaim,
  graph: ProvenanceGraph,
  nodes: AppNode[],
): 'valid' | 'stale' | 'broken' | 'missing'

resolveClaimTrace(args: {
  claim: ProvenanceClaim;
  graph: ProvenanceGraph;
  sourceMaterial: string;
  nodes: AppNode[];
}): {
  status: 'valid' | 'stale' | 'broken' | 'missing';
  claim: ProvenanceClaim;
  fragments: Array<{ fragment: SourceFragment; status: 'valid' | 'stale' | 'broken' }>;
  viaNodes: AppNode[];
}
```

### Validation rules

- A source fragment is `valid` only when offsets are in bounds, the current substring equals the captured quote, and the current quote fingerprint matches the stored quote fingerprint.
- If offsets are in bounds but the text/fingerprint differs, status is `stale`.
- If offsets are invalid or the fragment cannot be resolved, status is `broken`.
- A claim is `missing` when it has no fragment references.
- A claim is `broken` when any referenced fragment ID is absent, its node is absent, or any required intermediate node ID is absent.
- A claim is `stale` when its current node content no longer contains the recorded `claimText` or the claim fingerprint no longer matches.
- A claim is `valid` only when the claim and every referenced fragment resolve successfully.
- Moving nodes or changing viewport coordinates must not affect provenance validity.

## Authoring flow

### Source fragment creation

Extend `SourceIngestPanel.tsx` with a textarea ref and selection-aware action:

- User selects source text in the existing source textarea.
- `Add source fragment` is enabled only for a non-empty selection.
- Creating a fragment stores selection offsets, quote, quote fingerprint, and current source fingerprint in `workspace.provenance.fragments`.
- Duplicate exact fragments should be reused instead of creating duplicates.
- Editing source material does not silently rewrite existing fragment anchors; validation decides whether they remain valid.

This requires the parent workspace component to pass a fragment-creation callback. Do not move persistence responsibility into the presentational panel.

### Claim creation/linking

Use paragraph/bullet-level claim candidates from existing node content rather than building a Markdown AST or arbitrary rendered-text selection system.

In the Output Preview provenance UI:

- Present eligible claim candidates from output/conclusion/evidence/decision nodes that contain non-empty content.
- A candidate is a trimmed non-empty paragraph or list item.
- User can create or update a provenance claim for the candidate.
- User chooses one or more existing source fragments.
- User chooses derivation: Direct, Transformed, Manual, or AI-assisted.
- For Transformed and AI-assisted, the UI may select existing upstream transform/AI-assist nodes as intermediate `viaNodeIds`; do not invent hidden lineage automatically.
- Direct claims must allow zero intermediate nodes.

This is intentionally explicit annotation. The MVP must not pretend to infer evidence relationships automatically.

## Reviewer flow

Extend `OutputPreviewPanel.tsx` with a compact `Provenance` section/tab that lists recorded claims and their status.

For a selected claim, show:

- claim text;
- derivation badge;
- current status (`Valid`, `Stale`, `Broken`, `Missing`);
- intermediate node titles, if any;
- each exact source quote with its offsets and fragment status;
- explicit copy: `Workspace lineage only — this does not verify the truth or authenticity of the source.`

Broken or stale provenance must use warning/error semantics and must never display the same positive styling as valid provenance.

Do not block export/readiness in this MVP. #27 is a traceability capability, not a new global readiness gate.

## Deliverable integration

Do not rewrite `deliverableEngine.ts` or alter its Markdown composition contract. Provenance records are workspace metadata attached to source/node content and inspected alongside the deliverable.

The only deliverable-engine change allowed is a small exported helper, if needed, for deterministic paragraph/list-item claim candidate extraction. Prefer placing claim extraction in `provenance.ts` if it avoids changing the existing engine.

Manual edits to the freeform deliverable draft do not automatically inherit provenance. If the recorded claim text no longer exists in the source node content used for the claim record, validation becomes stale. The UI must not imply that arbitrary edited Markdown is still traceable.

## Persistence and portability

`WorkspaceDocument.provenance` is stored with the existing local workspace document, so normal localStorage persistence and project export inherit it automatically once schema validation retains the field.

Update:

- `src/lib/schema.ts` to validate and preserve provenance;
- `src/lib/workspaceStore.ts` to copy provenance into snapshots and restore it from full snapshots;
- `VersionSnapshot` to include optional provenance;
- snapshot restore logic so legacy snapshots with no provenance remain valid and restore `provenance` as absent rather than synthesizing data.

Project export/import must preserve IDs exactly. Import validation must fail closed for malformed provenance rather than silently accepting invalid structures.

## TDD regression matrix

Write failing tests before production code for each behavior.

1. Direct source claim resolves `valid`.
2. Transformed claim resolves source fragment plus intermediate transform node.
3. Multi-source claim resolves two fragments.
4. Source edit that changes referenced text makes fragment/claim `stale`.
5. Invalid offsets or deleted fragment reference makes trace `broken`.
6. Claim text mutation in its node makes claim `stale`.
7. Node position/viewport-only change leaves claim `valid`.
8. Project export/import preserves provenance IDs and validity.
9. Snapshot save/restore preserves provenance exactly.
10. AI-assisted derivation remains labeled `ai-assisted`; it is never presented as direct evidence.
11. Claim with no source fragments reports `missing`.
12. Malformed imported provenance is rejected by schema validation.

## Files expected to change

Primary:

- `src/types/index.ts`
- `src/lib/provenance.ts` (new)
- `src/lib/provenance.test.ts` (new)
- `src/lib/schema.ts`
- `src/lib/schema.test.ts`
- `src/lib/workspaceStore.ts`
- snapshot/portability tests near existing workspace-store tests
- `src/components/workspace/SourceIngestPanel.tsx`
- `src/components/workspace/OutputPreviewPanel.tsx`
- the parent workspace orchestration component that owns `WorkspaceDocument` patching

Documentation:

- `README.md` or the existing product/limitations documentation, whichever already owns trust-boundary claims
- issue #27 completion comment after verification

Avoid unrelated refactors.

## Verification gate

Before the PR is considered implementation-complete, all of the following must pass on the exact PR head:

- unit tests;
- lint;
- TypeScript typecheck;
- production build;
- existing browser/Playwright acceptance checks;
- provenance-specific regression tests;
- existing #26 human-review readiness tests unchanged and passing.

Do not merge merely because a preview renders. Treat CI and regression evidence as the release gate.

## Optimized execution prompt

> Implement GitHub issue #27 on `atomicdjt/weavestudio` from the approved design in `docs/superpowers/specs/2026-08-19-issue-27-provenance-mvp-design.md`. Work only on `feat/issue-27-provenance-mvp`; do not modify `main` directly. Use strict TDD: add each failing provenance regression test first, verify the expected failure, then add the minimum production code to pass it. Preserve the current local-first architecture, existing #26 review/readiness semantics, export behavior, and backward compatibility. Build an explicit annotation system, not inferred citations: selected source ranges become stable `SourceFragment` records; paragraph/list-item node claims become `ProvenanceClaim` records linked to one or more fragments and optionally intermediate transform/AI-assist nodes. Fingerprints are deterministic stale-reference detectors only, never authenticity proof. Fail closed on malformed, missing, stale, or broken references. Preserve provenance through localStorage, project export/import, and full snapshot restore; legacy data without provenance must remain valid. Add a compact reviewer-facing provenance inspector to the existing output preview and a source-selection fragment action to the existing source panel. Do not add a backend, vector search, web citations, factuality checking, cryptographic claims, automatic provenance inference, new node types, or unrelated refactors. Run and record unit tests, lint, typecheck, production build, Playwright/browser acceptance, and all existing #26 regression coverage on the exact final head. Stop and report rather than weakening an acceptance criterion if the existing architecture exposes a conflict.

## Completion definition

Issue #27 may be closed only when every acceptance criterion in the issue is demonstrated by code/tests or explicit UI behavior, all verification gates pass on the exact PR head, and the documentation clearly states the provenance trust boundary.
