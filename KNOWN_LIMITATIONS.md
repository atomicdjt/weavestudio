# Known Limitations — WeaveStudio

WeaveStudio is intentionally scoped as a local-first, assistive workflow canvas. The following limitations are by design or known constraints of the current release.

## Storage

- Workspaces and snapshots are stored in browser localStorage.
- Clearing browser data, using private browsing, changing browsers, or device cleanup tools can remove local data.
- Export important work to Markdown or JSON before relying on it outside the current browser profile.
- localStorage is not a substitute for durable filesystem or cloud storage.

## Generation and Workflow Validator

- Output generation is deterministic local formatting from user-provided node content.
- Workflow Validator validates workflow structure, completeness, review checkpoints, and export-readiness.
- Neither output generation nor Workflow Validator verifies facts, extracts truth automatically, or guarantees correctness.
- No external AI APIs or local LLMs are called in this release.
- Exported deliverables should be reviewed by a human before sharing or relying on them.

## AI Assist Blueprint

- AI Assist is an optional BYOK-ready blueprint node.
- It does not execute live provider calls by default.
- It includes no API keys and does not save API keys to localStorage.
- Any future provider integration requires secure key handling, adapter design, and human review of outputs.

## Collaboration

- Single-user only.
- No multiplayer editing, account system, cloud sync, or shared workspace model.

## Scope and Claim Boundaries

- Not a legal, medical, financial, compliance, or security tool.
- Does not provide security guarantees for sensitive data stored in browser localStorage.
- Human review is required before sharing or relying on generated deliverables.
- Workflows involving sensitive or regulated data require independent review and a stronger storage and security model.

## Exporting

- Markdown and JSON exports are the most complete handoff formats.
- PDF export is a simple text-mapped representation of the markdown preview.
- Complex page layout, signatures, redaction, and publishing controls are outside this release.
