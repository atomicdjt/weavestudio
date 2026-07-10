# Known Limitations - WeaveStudio

## Storage

- Workspaces and snapshots are stored in browser `localStorage`.
- Clearing browser data, private browsing, changing browsers, or device cleanup tools can remove local data.
- Export important work to Markdown or Project JSON before relying on it outside the current browser profile.
- `localStorage` is not encrypted and is not a substitute for durable filesystem or cloud storage.
- Storage quota errors surface in the UI; export work before deleting old workspaces.

## Generation and Process Check

- Output generation is deterministic local composition from user-provided node content and template structure.
- Process Check evaluates structure, completeness, review checkpoints, and export readiness.
- Neither output generation nor Process Check verifies facts, extracts truth automatically, or guarantees correctness.
- Review generated deliverables before sharing them.

## AI Assist

- AI Assist is optional.
- The offline/mock path is the default recommended path.
- Live provider calls require explicit user confirmation and may send prompt/context over the network.
- No API keys are bundled, and keys are not stored in `localStorage`.
- Provider URL and model fields can be stored on a local node if the user enters them.

## Collaboration and export

- WeaveStudio is single-user and has no accounts, cloud sync, shared workspace model, or real-time collaboration.
- Markdown and Project JSON are the most complete handoff formats.
- PDF export is a simple text-mapped representation of the markdown draft with limited typography and Unicode support.
- Complex layout, signatures, redaction, and publishing controls are outside this release.

## Scope

- WeaveStudio is not legal, medical, financial, compliance, or security software.
- The canvas is desktop-oriented; mobile access is supported but constrained.
