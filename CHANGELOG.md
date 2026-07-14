# Changelog

All notable changes to WeaveStudio are documented in this file.

## [Unreleased]

No unreleased user-facing changes are currently documented.

## [1.0.0 — Acquisition-Ready Consolidated Release] - 2026-07-14

### Added

- Bounded workspace undo/redo with toolbar and keyboard shortcuts.
- Workflow outline, minimap, explicit auto-layout, and keyboard-safe deletion.
- Owned-data backup, validated restore, import-as-new, scoped clearing, and storage-pressure guidance.
- Consent-gated OpenAI and Gemini BYOK assistance with volatile tab-memory keys and human review before applying output.
- Desktop and mobile Playwright coverage with mocked provider requests.
- Acquisition package builder, deterministic package manifest, buyer executive summary, transfer checklist, first-90-day operating plan, value proof, and claim-safe outreach materials.
- Commercial architecture audit, implementation plan, permission matrix, and analytics-event catalog.
- Contribution and security-reporting guidance.

### Changed

- Consolidated acquisition hardening and commercial documentation into the authoritative `master` branch.
- Established `master` as the single editable source of truth for source, release packaging, and deployments.
- Expanded mobile review support through dedicated Inspector and Snapshot sheets while retaining desktop as the strongest dense-canvas editing surface.
- Clarified public evaluation visibility, proprietary ownership, local-storage boundaries, and the absence of revenue or customer claims.

### Fixed

- Removed landing-page SVG console errors and added browser regression coverage.
- Guided-demo reset now asks before replacing a non-demo workspace.
- Storage guidance measures only WeaveStudio-owned records and excludes API keys.
- Improved source synchronization, snapshot coherence, workspace initialization, and deliverable-generation safeguards.

## [1.0.0 — Initial Release] - 2026-07-10

### Added

- Golden-path workflow: source ingest, editable node structure, template-structured deliverables, and editable drafts.
- Named multi-workspace persistence with schema v1, migrations, save status, coherent snapshots, and Project JSON round-trip.
- Five primary data-driven templates plus an expandable legacy pack.
- Landing actions for templates, guided demo, and blank workspace.
- Vitest coverage for source structure, deliverables, schema, templates, snapshots, synchronization, navigation, and workspace initialization.
- Release validation CI for tests, lint, typecheck, and production build.

### Changed

- Workflow Validator is the deterministic workflow-readiness surface.
- AI Assist began as offline/mock-first; live provider activity required explicit consent.
- Repository ownership is explicitly proprietary and All Rights Reserved.
- README, QA summary, and limitations document the local-first and human-review boundaries.

### Fixed

- Guided demo workspace creation avoids duplicate workspaces.
- Source synchronization avoids destructive source-to-node replacement and preserves viewport state.
- Snapshot restoration keeps graph, source, draft, and metadata coherent.
- Deliverable generation avoids duplicate headings and stale snapshot output.