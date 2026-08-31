# WeaveStudio

[![CI](https://github.com/atomicdjt/weavestudio/actions/workflows/ci.yml/badge.svg)](https://github.com/atomicdjt/weavestudio/actions/workflows/ci.yml)

**Turn fragmented information into a structured, reviewable, reusable deliverable workflow.**

**[Canonical project page](https://ai-project-portfolio-portfolio-hub.vercel.app/projects/weavestudio) · [Public demo](https://weavestudio-nine.vercel.app/) · [Case study](docs/CASE_STUDY.md) · [Known limitations](docs/KNOWN_LIMITATIONS.md)**

**License:** **Proprietary / All Rights Reserved.** Public source visibility is for evaluation, portfolio review, technical critique, and prospective collaboration. This repository is **not open source**; see [LICENSE.md](LICENSE.md).

**Built by David Turner · [atomicdjt](https://github.com/atomicdjt)**

WeaveStudio is a local-first visual workflow canvas for turning notes, transcripts, logs, research fragments, and other unstructured inputs into reviewable deliverables. The core workflow runs in the browser without a backend, account system, cloud database, or required external API.

## Why it is technically interesting

- **Claim-to-source provenance is explicit.** Selected source ranges can be linked to claims with direct, transformed, manual, or AI-assisted derivation labels.
- **Human review is a first-class state.** Workflow validation and review gates are visible rather than implied by a generated output.
- **The standard workflow is local-first.** Named workspaces, autosave, snapshots, undo/redo, and exports operate in the browser.
- **AI is optional and bounded.** OpenAI/Gemini BYOK requests require explicit user action and human review before output is applied.
- **Exports are portable and inspectable.** Markdown, PDF, Project JSON, snapshots, and owned-data backup are user-initiated outputs.

![WeaveStudio home screen](docs/screenshots/weavestudio-home.png)

> **Evaluate it:** [open the live demo](https://weavestudio-nine.vercel.app/) and [leave specific technical or product feedback](https://github.com/atomicdjt/weavestudio/issues/21). The most useful feedback is a reproducible failure, a confusing workflow boundary, a trust concern, or a reason the tool would not fit real work.

## The problem it solves

Important source material often begins as scattered, inconsistent fragments. WeaveStudio gives that material a visible workflow shape: source content becomes editable nodes, nodes become a structured deliverable, and the result remains reviewable before export.

It is designed for researchers, analysts, project managers, and consultants who need to synthesize unstructured source material without depending on a cloud SaaS backend.

## Golden path

1. Choose a workflow template or open the guided demo.
2. Paste unstructured source material.
3. Apply the source to an Input node or split it into editable nodes.
4. Organize, connect, classify, and review the workflow on the canvas.
5. Run Workflow Validator, then generate a template-structured deliverable.
6. Review and edit the draft before exporting Markdown, PDF, or Project JSON.
7. Reopen the named workspace later in the same browser profile.

## Implemented capabilities

- Visual workflow canvas powered by `@xyflow/react`
- Five primary templates plus an expandable legacy starter pack
- Source ingest, editable canvas nodes, and explicit review checkpoints
- Claim-to-source provenance with direct, transformed, manual, and AI-assisted derivation labels
- Reviewer-facing provenance inspection with valid/stale/broken/missing status and exact source quotes
- Named browser-local workspaces with autosave, visible save state, and snapshots
- Bounded workspace undo/redo with toolbar and keyboard shortcuts
- Workflow outline, minimap, explicit auto-layout, and keyboard-safe deletion
- Workflow Validator for structure, completeness, review gaps, and export readiness
- Template-structured deliverable generation with an editable draft
- Markdown, PDF, and re-importable Project JSON export
- Owned-data backup, validated restore, import-as-new, scoped clearing, and storage-pressure guidance
- Optional OpenAI/Gemini BYOK assistance with explicit consent for each request and human review before applying output

## Product tour

### Guided workflow workspace

![WeaveStudio guided-demo workspace](docs/screenshots/weavestudio-workspace.png)

### Template gallery

![WeaveStudio template gallery](docs/screenshots/weavestudio-templates.png)

### Deliverable preview and exports

![WeaveStudio deliverable preview and export choices](docs/screenshots/weavestudio-deliverable.png)

## Architecture and trust boundaries

WeaveStudio is a static browser application. Workspaces are stored in browser `localStorage`; exports are files the user initiates from the browser.

The normal workflow does not make provider requests. Optional AI Assist requests remain disabled until a user explicitly confirms the individual action and may send the displayed prompt/context to the selected provider. API keys are not bundled with WeaveStudio, are held only in volatile tab memory, and are not saved to `localStorage` or project exports.

Provenance records **workspace lineage**: which captured source fragments and declared transform/AI-assist steps a claim was linked to. It does **not** prove external factual truth, source authenticity, or source quality. Provenance fingerprints are deterministic stale-reference detectors, not cryptographic authenticity proofs.

See the [case study](docs/CASE_STUDY.md) and [known limitations](docs/KNOWN_LIMITATIONS.md) for deeper evaluation context.

## Local development

```bash
npm ci
npm run dev
```

To inspect the production build locally:

```bash
npm run build
npm run preview
```

## Verification

Core engineering checks:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

GitHub Actions runs the repository CI gate on pushes and pull requests. Passing these checks establishes the recorded software/test result; it does not establish factual truth for source material or generated deliverables.

## Export and persistence

- **Markdown** produces an editable text deliverable.
- **PDF** produces a local print-oriented representation of the draft.
- **Project JSON** preserves workspace nodes, edges, source material, template selection, deliverable draft, and provenance identifiers for validated re-import.
- **Snapshots** capture a coherent local checkpoint of workspace state, including provenance when present.
- **Download all local data** creates an owned-data backup that can be validated and restored.

## Known limitations and review boundaries

- Browser `localStorage` is neither encrypted storage nor durable cloud storage. Clearing site data, using private browsing, changing browsers, or device cleanup can remove workspaces.
- Workflow Validator evaluates workflow structure and readiness; it does not verify facts or guarantee correctness.
- A `Valid` provenance trace means the recorded claim, declared intermediate steps, and captured source ranges still resolve consistently; it does not establish factual truth, source authenticity, or source quality.
- Generated and AI-assisted work requires human review before sharing or applying.
- WeaveStudio is a single-user workflow tool. It does not provide real-time collaboration, cloud sync, account-based sharing, or billing.
- Dense graph editing is most efficient on desktop; mobile remains better suited to review and lighter edits.
- It is not legal, medical, financial, compliance, or security software.

See [KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) for the full boundary list.

## Release and deployment authority

**Release status:** v1.0.0 — current consolidated release.

The authoritative editable source and production branch is `main`. `master` is retained only as a compatibility/legacy branch from the July 2026 non-force branch migration.

[weavestudio-nine.vercel.app](https://weavestudio-nine.vercel.app/) is canonical production. Generated deployment and packaging artifacts are outputs of this source and do not supersede the repository.

## Commercial transfer materials (secondary)

The repository also contains buyer-oriented transfer and due-diligence materials under [`docs/buyer/`](docs/buyer/) and a supporting [acquisition overview](https://weavestudio-nine.vercel.app/acquire). These materials are intentionally secondary to the engineering source of truth.

For a full deterministic transfer package, `npm run verify:buyer` runs the buyer release gate and `npm run package:acquisition` produces the acquisition package. The associated GitHub workflow can produce a private release artifact with a package manifest, CycloneDX SBOM, release summary, and SHA-256 inventory.

No revenue, customer, active-user, compliance-certification, or completed-acquisition claim is included with this asset. Draft legal-review templates are working materials only and are not legal advice or self-executing transaction documents.

## License

[Proprietary — All Rights Reserved](LICENSE.md). Public visibility is provided for evaluation and portfolio review only. It does not grant a license to copy, redistribute, commercialize, or reuse the source or associated intellectual property.

## More projects

[Agent Session Bridge](https://github.com/atomicdjt/agent-session-bridge) · [Validation Ledger](https://github.com/atomicdjt/validation-ledger) · [BuildWorld AI](https://github.com/atomicdjt/buildworld-ai) · [GitHub profile](https://github.com/atomicdjt) · [Full portfolio](https://ai-project-portfolio-portfolio-hub.vercel.app/)
