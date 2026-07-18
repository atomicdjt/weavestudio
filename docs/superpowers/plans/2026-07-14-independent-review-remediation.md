# Independent Review Remediation Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task after user approval.

**Goal:** Address the evidence-backed usability, accessibility, and acquisition-readiness gaps identified across the three independent reviews, while preserving WeaveStudio's local-first data model, existing browser compatibility, and explicit AI consent boundary.

**Architecture:** Make narrow additions around the existing workspace shell: correct invalid landing-page SVG markup, clarify potentially destructive demo/source actions with the existing accessible dialog primitives, expose storage-pressure guidance using owned-key measurements, and add focused canvas-navigation affordances. Keep all application data in browser-owned storage and reuse the existing undo/redo, dialog, portable-backup, and Playwright infrastructure.

**Tech Stack:** React, TypeScript, React Flow, Tailwind CSS, Vitest, Playwright.

## Evidence disposition

| Review suggestion | Disposition | Rationale |
| --- | --- | --- |
| Remove SVG parsing warnings | Implement | Reproduced on the public demo: two invalid percentage-based `path d` attributes generate console errors. |
| Escape-dismissible walkthrough | Regression coverage only | `AccessibleDialog` already traps focus, returns focus, and handles Escape; the public demo passed an Escape check. |
| Warn before guided-demo/reset replacement | Implement | The current workspace can be replaced directly, creating avoidable confusion for non-demo workspaces. |
| Explain source/canvas divergence and validation result | Implement | Existing state labels are accurate but not sufficiently action-oriented for first-time users. |
| Improve empty inspector | Implement | The current empty state gives instruction but no direct recovery action. |
| Storage quota warning | Implement as soft pressure guidance | Browser quota varies; show measured owned-key use and actionable backup/export guidance, never a false capacity guarantee. |
| Minimap and explicit auto-layout | Implement | Both improve dense-canvas navigation without changing stored document compatibility. Auto-layout must be deliberate and undoable. |
| Standard delete shortcuts | Implement with text-field guard | Canvas deletion should work from the workspace while preserving native input/textarea/contenteditable behavior. |
| ARIA labels for workflow nodes | Implement | Supplements visible node titles for assistive technology. |
| Mobile validation | Add regression coverage | Keep the existing responsive workspace rather than locking mobile users out. Assert no horizontal overflow on key routes. |
| Rich text, cloud sync, template builder | Defer | These are material product expansions, not hardening defects. |
| Persisted/encrypted API-key vault | Reject | It conflicts with the established volatile-only API-key privacy boundary. |

## Task 1: Remove public-demo console errors and improve initial loading semantics

**Files:**
- Modify: `src/pages/LandingPage.tsx`
- Modify: `src/main.tsx`
- Modify: `e2e/release.spec.ts`

- [ ] Write a failing Playwright assertion that loading `/` produces no console errors and still exposes the landing-page primary actions.
- [ ] Replace percentage values in the SVG path `d` attributes with numeric coordinates inside a defined `viewBox`; retain the same visual connector placement using `preserveAspectRatio`.
- [ ] Keep the existing SVG decorative (`aria-hidden`) and prevent the correction from affecting mobile layout.
- [ ] Give the initial render fallback a labelled status message and lightweight visual structure so the black loading state reads intentionally while the app bundle initializes.
- [ ] Run the focused Playwright test, then `npm run typecheck`, `npm run lint`, and `npm test`.
- [ ] Commit: `fix: remove landing console errors and improve loading state`

## Task 2: Make replacement, source synchronization, and empty-state recovery explicit

**Files:**
- Modify: `src/pages/WorkspacePage.tsx`
- Modify: `src/components/workspace/SourceIngestPanel.tsx`
- Modify: `src/components/workspace/WorkspacePanels.tsx`
- Modify: `src/lib/sourceSync.ts`
- Modify: `e2e/release.spec.ts`

- [ ] Add failing browser tests for: opening/resetting the guided demo from a non-demo workspace requires a clear confirmation; cancellation preserves the current workspace; confirmation replaces it deterministically.
- [ ] Reuse the existing accessible confirmation dialog rather than introducing native browser dialogs or a second dialog system.
- [ ] Extend the `canvas_ahead` source-sync state with plain-language recovery guidance and an explicit non-destructive next action. Do not silently overwrite source or canvas data.
- [ ] Add an actionable empty-inspector control (for example, “Add Input node”) wired to the existing node creation path and returning focus predictably.
- [ ] Add a concise validation-result explanation beside the existing validator score: identify the next actionable category rather than presenting a percentage without context.
- [ ] Verify Escape, focus return, and keyboard operation for every newly reachable dialog/control.
- [ ] Run focused unit/browser tests plus `npm run typecheck`, `npm run lint`, and `npm test`.
- [ ] Commit: `feat: clarify workspace replacement and recovery actions`

## Task 3: Add honest storage-pressure guidance without changing persistence ownership

**Files:**
- Modify: `src/lib/storageUsage.ts`
- Modify: `src/components/workspace/DataPortabilityModal.tsx`
- Add/Modify: focused storage-usage unit test file under `src/lib/`
- Modify: `e2e/release.spec.ts`

- [ ] Write failing unit tests for a deterministic storage-pressure classifier based on WeaveStudio-owned key bytes, including empty, advisory, and elevated cases.
- [ ] Add a pure helper that returns advisory copy and severity; do not call browser quota APIs as a source of truth and do not measure unrelated origin data.
- [ ] Surface the existing owned-key size alongside clear backup/export, restore-validation, and project-cleanup actions in the Recovery Center/Data Portability UI.
- [ ] Ensure no API keys are included in any displayed metric, backup, diagnostic, console output, or export.
- [ ] Add a browser regression test that proves the advisory is understandable and that the backup action remains reachable on a narrow mobile viewport.
- [ ] Run focused tests, `npm run typecheck`, `npm run lint`, and `npm test`.
- [ ] Commit: `feat: add local storage pressure guidance`

## Task 4: Improve dense-canvas navigation, keyboard flow, and node accessibility

**Files:**
- Modify: `src/components/workspace/WorkflowCanvas.tsx`
- Modify: `src/components/workspace/CustomNodes.tsx`
- Add: `src/lib/autoLayout.ts`
- Add: `src/lib/autoLayout.test.ts`
- Modify: `src/pages/WorkspacePage.tsx`
- Modify: `e2e/release.spec.ts`

- [ ] Write unit tests for a deterministic, dependency-aware layout helper: stable results for identical graph input, safe treatment of disconnected nodes, and no mutation of the incoming document.
- [ ] Implement a small pure layout helper using workflow layers and rows; avoid a new dependency. Keep node IDs, content, edges, and document schema unchanged.
- [ ] Add a visible “Auto-layout workflow” action that applies the computed positions through the existing workspace-history command path, so Undo restores the exact prior layout and Redo reapplies it.
- [ ] Add React Flow’s built-in minimap with accessible labelling and responsive sizing; ensure it cannot cover critical mobile controls.
- [ ] Add a workspace-level Delete/Backspace handler for a selected node only when the event target is not an input, textarea, select, button, or contenteditable element. Preserve existing Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, and Ctrl/Cmd+Y behavior.
- [ ] Give each custom workflow node a useful accessible name composed from its type/title and selection state without duplicating interactive controls.
- [ ] Add Playwright coverage for auto-layout + undo/redo, minimap visibility on desktop, Delete/Backspace behavior, text-field preservation, and mobile overflow.
- [ ] Run focused tests, `npm run typecheck`, `npm run lint`, and `npm test`.
- [ ] Commit: `feat: improve canvas navigation and keyboard accessibility`

## Task 5: Update buyer evidence and perform release-grade verification

**Files:**
- Modify: `docs/QA_REPORT.md`
- Modify: `docs/FEATURE_REALITY_MATRIX.md`
- Modify: `docs/KNOWN_LIMITATIONS.md`
- Modify: `docs/BUYER_FAQ.md`
- Modify: `README.md`
- Modify: `e2e/release.spec.ts`

- [ ] Update buyer-facing documentation conservatively: record implemented hardening, browser-local storage constraints, optional BYOK AI consent, absence of cloud sync/accounts, and explicitly deferred rich-text/template-builder work.
- [ ] Record the two SVG issues as fixed only after the browser console test passes; do not assert unrun results.
- [ ] Add a release test matrix covering landing, `/app`, `/templates`, `/acquire`, invalid-route recovery, consent cancellation/confirmation, desktop/mobile overflow, keyboard flow, and Recovery Center safeguards.
- [ ] Run in the current session: `npm ci` if dependency integrity requires it; `npm run typecheck`; `npm run lint`; `npm test`; browser tests with mocked provider requests; `npm run build`; preview smoke tests; `npm run package:acquisition`; and package validation.
- [ ] Deploy only the current non-production Vercel demo project after all checks pass; verify rendered identity, routes, headers, mobile layout, and anonymous-access behavior. Do not alter the original production project or `master`.
- [ ] Copy the validated buyer ZIP to the required outputs folder and record exact file count, size, and SHA-256 in the QA report.
- [ ] Commit: `docs: refresh buyer evidence after review remediation`

## Final verification and handoff

- [ ] Confirm the working branch remains `hardening/qa-remediation-multiprovider-ai` and `master` was not modified.
- [ ] Report each command’s actual result, all reviewable commit IDs, changed files, Vercel preview URL/access limitation, and buyer ZIP path/file count/size/SHA-256.
- [ ] State remaining limitations explicitly: local browser storage is device/browser scoped, cloud sync and collaboration are not included, AI is optional BYOK with per-request consent, and rich-text/template-builder functionality remains deferred.

## Out of scope for this hardening release

- Persistent API-key storage or an “encrypted vault.”
- Accounts, cloud synchronization, multi-user collaboration, billing, or backend migration.
- Rich-text editing and a full template-builder product.
- A mobile lockout/read-only restriction that would regress the current responsive workspace.

**Approval gate:** Implement Tasks 1–5 as one focused hardening release only after the user approves this plan.
