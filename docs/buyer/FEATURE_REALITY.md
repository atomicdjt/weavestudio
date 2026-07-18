# Feature Reality Matrix

| Capability | Status | Boundary |
|---|---|---|
| Workflow canvas, templates, source structuring, validation | Implemented | Deterministic local behavior |
| Workspaces, autosave, snapshots, project JSON | Implemented | Browser-local storage only |
| Markdown and PDF export | Implemented | PDF is text-oriented, not a design-layout engine |
| Undo/redo | Implemented | In-memory, workspace-scoped, bounded to 80 entries |
| OpenAI/Gemini assistance | Implemented | Direct browser BYOK, explicit consent each request, human review required |
| Recovery and portability | Implemented | Owned-key backup/export, validated restore, import-as-new, scoped clearing, and storage-pressure guidance |
| Dense-canvas navigation | Implemented | Workflow outline, minimap, explicit auto-layout with undo/redo, and keyboard-safe deletion |

## Hardening evidence (2026-07-14)

- Landing-page SVG console errors were removed and are covered by a browser regression test.
- Guided-demo reset now asks before replacing a non-demo workspace; cancellation leaves the current workspace open.
- Storage guidance measures only WeaveStudio-owned records. It is not a browser-quota guarantee and never includes API keys.
- Rich-text editing, cloud sync, accounts, collaboration, and a template-builder remain future product work, not present functionality.
| Accounts, sync, collaboration, billing | Not included | Buyer-led roadmap |
| Secure provider proxy | Architecture-compatible | Not enabled without authentication and abuse controls |
| Fact verification or regulated advice | Not included | Human review remains required |
