# Changelog

All notable changes to WeaveStudio are documented in this file.

## [Unreleased]

## [1.0.0] - 2026-07-10

### Added

- Golden-path workflow: source ingest, editable node structure, template-structured deliverables, and editable drafts.
- Named multi-workspace persistence with schema v1, migrations, save status, coherent snapshots, and Project JSON round-trip.
- Five primary data-driven templates plus an expandable legacy pack.
- Landing actions for templates, guided demo, and blank workspace.
- Vitest coverage for source structure, deliverables, schema, templates, snapshots, synchronization, navigation, and workspace initialization.
- Release validation CI for tests, lint, typecheck, and production build.

### Changed

- Process Check is the canonical deterministic workflow-readiness surface.
- AI Assist is offline/mock-first; live provider activity requires explicit consent.
- Repository ownership is explicitly proprietary and All Rights Reserved.
- README, QA summary, and limitations document the local-first and human-review boundaries.

### Fixed

- Guided demo workspace creation avoids duplicate workspaces.
- Source synchronization avoids destructive source-to-node replacement and preserves viewport state.
- Snapshot restoration keeps graph, source, draft, and metadata coherent.
- Deliverable generation avoids duplicate headings and stale snapshot output.
