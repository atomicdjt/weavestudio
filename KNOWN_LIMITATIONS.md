# Known Limitations — WeaveStudio

## Storage

- Workspaces and snapshots are stored in browser localStorage.
- Clearing browser data, private browsing, changing browsers, or device cleanup tools can remove local data.
- Export important work to Markdown or project JSON before relying on it outside the current browser profile.
- localStorage is not a substitute for durable filesystem or cloud storage.
- Storage quota errors surface in the UI; free space or export, then delete old workspaces.

## Generation and Workflow Validator

- Output generation is deterministic local composition from user-provided node content and template structure.
- Workflow Validator validates structure, completeness, review checkpoints, and export-readiness.
- Neither verifies facts, extracts truth automatically, nor guarantees correctness.
- Exported deliverables should be reviewed by a human before sharing.

## AI Assist

- AI Assist is optional.
- **Mock (offline)** is the default recommended path.
- **Live provider calls** (OpenAI-compatible or Ollama) run only after explicit user consent and may send prompt/context over the network.
- No API keys are bundled. Keys are not saved to localStorage.
- Provider URL and model name fields may be stored on the node in localStorage if the user sets them.

## Collaboration

- Single-user only.
- No multiplayer editing, account system, cloud sync, or shared workspace model.

## Exporting

- Markdown and project JSON are the most complete handoff formats.
- PDF export is a simple text-mapped representation of the markdown (limited fonts/Unicode).
- Complex page layout, signatures, redaction, and publishing controls are outside this release.

## Scope

- Not a legal, medical, financial, compliance, or security product.
- Does not encrypt localStorage.
- Canvas is desktop-oriented; mobile is usable but cramped.
