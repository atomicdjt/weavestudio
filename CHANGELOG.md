# Changelog

All notable changes to the WeaveStudio project will be documented in this file.

## [Unreleased]

### Added
- Golden-path product flow: source ingest, split-into-nodes, template-structured deliverables, editable draft.
- Named multi-workspace persistence with schema v1, migrations, save status, and project JSON round-trip.
- Five primary data-driven templates + expandable legacy pack.
- Landing CTAs: Start with template, Guided demo, Blank workspace.
- Vitest unit tests for structureSource, deliverableEngine, schema, templates.
- Product/audit docs under `docs/`.

### Changed
- Deliverable engine composes from template `outputStructure` (no default inventory dump).
- AI Assist: Mock offline is primary; live provider requires explicit consent.
- Acquisition CTA demoted from primary product chrome.
- README and limitations rewritten for privacy honesty.

### Fixed
- Docs no longer claim zero network capability while live AI path exists without disclosure.

