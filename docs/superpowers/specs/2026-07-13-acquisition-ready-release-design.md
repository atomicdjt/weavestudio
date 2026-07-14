# Acquisition-Ready Release Design

## Goal

Make WeaveStudio a defensible, local-first workflow-product acquisition asset: safe for real user work, simple to demo, straightforward to evaluate, and packaged with proof rather than inflated claims.

## Product boundary

WeaveStudio remains a static React/Vite application. No account system, cloud synchronization, owner-funded model proxy, analytics, or billing is added in this release. Optional AI remains direct browser BYOK and requires explicit consent per request.

## Workstreams

1. **Document integrity:** bounded, workspace-scoped undo/redo; recovery checkpoint before restore; separate project import and complete backup restore; schema validation; recovery status.
2. **User confidence:** custom dialogs rather than native browser prompts; application error boundary; first-run guided checklist; local demo banner and deterministic demo reset.
3. **Accessibility and responsive use:** accessible dialog primitive with focus restoration; keyboard shortcuts; live status; tablet/mobile drawers for palette, inspector, and snapshots; visible focus and overflow regression checks.
4. **Buyer-grade presentation:** landing-page narrative, product proof, concrete consultant/agency use cases, a resettable public demo, and accurate privacy/AI boundaries.
5. **Evidence and handoff:** unit/browser tests, QA report, buyer data room, package manifest, deterministic source ZIP, checksums, commercial listing, and outreach sequences.

## Architecture

`workspaceHistory` owns in-memory snapshots of meaningful `WorkspaceDocument` mutations. `WorkspacePage` records history transactions and remains the sole document-state owner; `WorkflowCanvas` continues to own transient React Flow interaction state. `workspaceStore` remains the sole browser-persistence boundary and exposes validated backup/restore and recovery operations. Reusable dialogs and responsive workspace controls live in focused components rather than embedding browser-native APIs in pages.

## Safety rules

- A new mutation after undo clears redo; history is capped and never persists API keys or UI-only state.
- Destructive actions use explicit custom dialogs. Restore creates a recovery checkpoint before replacing document state.
- Project JSON import always creates a workspace; full backup restoration remains separate, validated, staged, and confirmation-gated.
- No deployment touches `master` or the existing production deployment. A preview deployment is permitted only from this hardening branch.
- Public copy states limitations plainly: local browser storage is not encrypted or durable cloud storage; AI output needs review; direct BYOK is not server-side secret storage.

## Acceptance criteria

- Keyboard and toolbar undo/redo cover create, edit, move, connect, delete, restore, and AI apply operations.
- The golden path works from landing page through guided demo, source structuring, validation, generation, export, backup, and recovery.
- Mobile/tablet controls remain reachable without horizontal overflow.
- Unit and browser tests prove consent, persistence, undo/redo, dialog behavior, routes, critical responsive widths, and exports.
- Buyer package contains a verified ZIP, docs, screenshots, manifest, checksum, listing, FAQ, and outreach material.
