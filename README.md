# WeaveStudio

**Turn fragmented information into a structured, reusable deliverable workflow.**

WeaveStudio is a local-first visual workflow canvas for turning messy notes, transcripts, logs, research fragments, and discovery inputs into reviewable, reusable deliverables.

[Open the public demo](https://weavestudio-demo.vercel.app/) · [Acquisition overview](https://weavestudio-demo.vercel.app/acquire)

**Release status:** v1.0.0 — acquisition-ready consolidated release

![WeaveStudio home screen](docs/screenshots/weavestudio-home.png)

## Current release authority

The authoritative editable source is the `main` branch of this repository. The acquisition hardening, OpenAI/Gemini BYOK workflow, browser validation, buyer materials, commercial architecture guidance, and repository-governance work were preserved from the released `master` lineage during the July 2026 non-force branch migration. `master` remains a temporary compatibility branch until production verification is complete.

Generated acquisition ZIPs and deployment artifacts are outputs of the authoritative source; they do not supersede it.

## The problem it solves

Important source material often begins as scattered, inconsistent fragments. WeaveStudio gives that material a visible workflow shape: source content becomes editable nodes, nodes become a structured deliverable, and the final result remains reviewable before it is shared.

## Golden path

1. Choose a professional workflow template or open the guided demo.
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

## Local-first architecture

WeaveStudio is a static browser application. The standard workflow has no backend, account system, cloud database, or required external API. Workspaces are stored in browser `localStorage`; exports are files you initiate from the browser.

The normal workflow does not make provider requests. Optional AI Assist requests are disabled until a user explicitly confirms the individual action and may send the displayed prompt/context to the selected provider. API keys are not bundled with WeaveStudio, are held only in volatile tab memory, and are not saved to `localStorage` or project exports.

## Local development

```bash
npm ci
npm run dev
```

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
npm run package:acquisition
# Full buyer release gate
npm run verify:buyer
```

To inspect the built application locally:

```bash
npm run preview
```

The manually dispatched or acquisition-tag-triggered workflow in [`.github/workflows/acquisition-release.yml`](.github/workflows/acquisition-release.yml) runs the buyer gate and produces a private release artifact containing the deterministic package, package manifest, CycloneDX SBOM, release summary, and SHA-256 inventory.

## Export and persistence

- **Markdown** produces an editable text deliverable.
- **PDF** produces a simple local print-oriented representation of the draft.
- **Project JSON** preserves workspace nodes, edges, source material, template selection, and the deliverable draft for re-import.
- **Snapshots** capture a coherent local checkpoint of workspace state.
- **Download all local data** creates an owned-data backup that can be validated and restored.

## Known limitations and review boundaries

- Browser `localStorage` is neither encrypted storage nor durable cloud storage. Clearing site data, using private browsing, changing browsers, or device cleanup can remove workspaces.
- Workflow Validator evaluates workflow structure and readiness; it does not verify facts or guarantee correctness.
- Generated and AI-assisted work requires human review before sharing or applying.
- WeaveStudio is a single-user workflow tool. It does not provide real-time collaboration, cloud sync, account-based sharing, or billing.
- Dense graph editing is most efficient on desktop; mobile includes dedicated Inspector and Snapshot sheets but remains better suited to review and lighter edits.
- It is not legal, medical, financial, compliance, or security software.

See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) for full details.

## License

[Proprietary — All Rights Reserved](LICENSE.md). Public visibility is provided for evaluation and portfolio review only. It does not grant a license to copy, redistribute, commercialize, or reuse the source or associated intellectual property.

## Production deployment

Production is deployed from the authoritative `main` branch to [weavestudio-nine.vercel.app](https://weavestudio-nine.vercel.app/). The public review demo and acquisition overview are available at [weavestudio-demo.vercel.app](https://weavestudio-demo.vercel.app/). `vercel.json` provides the SPA rewrite needed for direct route refreshes.

## Buyer materials

The acquisition-ready executive summary, architecture and maintenance guide, feature-reality matrix, outreach copy, value proof, public-demo notes, and preview instructions are in [`docs/buyer/`](docs/buyer/). The package command builds a fresh ZIP and prints its SHA-256; generated release files are intentionally not committed.

Fast-sale and transaction materials:

- [One-page acquisition brief](docs/buyer/ONE_PAGE_ACQUISITION_BRIEF.md)
- [Included asset schedule](docs/buyer/ASSET_SCHEDULE.md)
- [Excluded assets and retained rights](docs/buyer/EXCLUDED_ASSETS.md)
- [Buyer due-diligence index](docs/buyer/DUE_DILIGENCE_INDEX.md)
- [Closing runbook](docs/buyer/CLOSING_RUNBOOK.md)
- [Post-close support terms](docs/buyer/POST_CLOSE_SUPPORT_TERMS.md)
- [Transfer checklist](docs/buyer/TRANSFER_CHECKLIST.md)
- [90-day buyer operating plan](docs/buyer/OPERATING_PLAN_90_DAYS.md)

Draft legal-review templates are available under [`docs/buyer/legal/`](docs/buyer/legal/). They are working templates only and are not legal advice or self-executing transaction documents.

No revenue, customer, active-user, compliance-certification, or completed-acquisition claim is included with this asset.
