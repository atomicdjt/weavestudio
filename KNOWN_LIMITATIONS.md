# Known Limitations

WeaveStudio is intentionally scoped as a local-first, assistive workflow canvas.

## Storage

- Workspaces and snapshots are stored in browser localStorage.
- Clearing browser data, using private browsing, changing browsers, or device cleanup tools can remove local data.
- Export important work to Markdown or JSON before relying on it outside the current browser profile.

## Generation and Process Check

- Output generation is deterministic local formatting from user-provided node content.
- Process Check validates workflow structure, completeness, review checkpoints, and export readiness.
- Neither output generation nor Process Check verifies facts, extracts truth automatically, or guarantees correctness.
- No external AI APIs or local LLMs are called in this release.

## AI Assist Blueprint

- AI Assist is an optional BYOK-ready blueprint node.
- It does not execute live provider calls by default.
- It includes no API keys and does not save API keys to localStorage.
- Any future provider integration needs secure key handling, adapter design, and human review.

## Collaboration

- Single-user only.
- No multiplayer editing, account system, cloud sync, or shared workspace model.

## Compliance and Sensitive Work

- Not a legal, medical, financial, compliance, or security tool.
- Not HIPAA compliant.
- Does not provide security guarantees for sensitive data stored in browser localStorage.
- Human review is required before sharing or relying on generated deliverables.

## Exporting

- Markdown and JSON exports are the most complete handoff formats.
- PDF export is a simple text-mapped representation of the markdown preview.
- Complex page layout, signatures, redaction, and publishing controls are outside this release.
