# Roadmap — WeaveStudio

WeaveStudio is a local-first visual workflow canvas for turning messy professional inputs into repeatable, traceable deliverables. The current release is a static, local-first implementation. The items below are optional future enhancements, not current-release promises.

## Near Term

- Workflow import/export using a dedicated `.weavestudio.json` format for portability between browsers and devices.
- Richer PDF layout options while keeping export generation local.
- Template duplication and template editing inside the app.
- More keyboard shortcuts and canvas accessibility refinements.
- Process Check rule customization for buyer-specific workflow standards.

## Mid Term

- Desktop wrapper with local filesystem save/open support (Tauri or Electron).
- Encrypted local vault option for users who understand browser and device security tradeoffs.
- Expanded template packs for operations, documentation, research, and consulting workflows.
- Custom node metadata fields for team-specific review standards.
- Export to additional structured formats (DOCX, CSV for tabular node data).

## Long Term

- Plugin system for custom local transformations.
- Optional AI Assist provider adapters using BYOK architecture and explicit human review of all outputs.
- Optional hosted edition as a separate product track, requiring a new privacy, security, and data-retention design.

## Non-Goals For This Release

- No backend.
- No authentication.
- No cloud sync.
- No database.
- No required external API dependency.
- No bundled API keys.
- No automated sensitive-work approval.
- No guaranteed-correctness claims.
