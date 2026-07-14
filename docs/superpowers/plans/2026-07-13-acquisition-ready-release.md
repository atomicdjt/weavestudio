# Acquisition-Ready Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a resilient local-first WeaveStudio release, a public preview demo, and a verifiable acquisition handoff package.

**Architecture:** Keep `WorkspacePage` as the document-state owner. Add focused history, dialog, recovery, onboarding, and release-packaging modules around it. Preserve the static, no-account deployment model and make every external AI request consent-gated.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind 4, Vitest, Playwright CLI/browser checks, jsPDF, Vercel preview deployment.

## Global Constraints

- Work only on `hardening/qa-remediation-multiprovider-ai`; do not merge or deploy `master`.
- Use test-first development for every new behavior.
- Never persist API keys or add analytics.
- Keep product claims conservative and make preview deployment non-authoritative.

---

### Task 1: Add bounded workspace history

**Files:** Create `src/lib/workspaceHistory.ts`, `src/lib/workspaceHistory.test.ts`; modify `src/pages/WorkspacePage.tsx`.

- [ ] Write failing tests for record, undo, redo, redo clearing, 80-entry cap, workspace reset, and text coalescing.
- [ ] Run `npm test -- src/lib/workspaceHistory.test.ts` and confirm the missing-module failure.
- [ ] Implement `createWorkspaceHistory(initial, limit = 80)` with `record(next, group?)`, `undo()`, `redo()`, `reset(workspace)`, `canUndo`, and `canRedo`.
- [ ] Record meaningful page-level document mutations, skip viewport/UI changes, wire toolbar buttons and Ctrl/Cmd shortcuts without intercepting native text-field undo.
- [ ] Run focused tests, then `npm test`; commit `feat: add bounded workspace undo redo`.

### Task 2: Harden recovery and portability

**Files:** Modify `src/lib/workspaceStore.ts`, `src/lib/schema.ts`, `src/components/workspace/DataPortabilityModal.tsx`; test `src/lib/workspaceStore.test.ts`.

- [ ] Write failing tests for recovery snapshot creation, malformed backup rejection before mutation, project import as-new, and only-owned-key clearing.
- [ ] Implement staged `inspectFullBrowserBackup`, `restoreFullBrowserBackup`, and `saveRecoverySnapshot`; return sanitized error messages.
- [ ] Split Project JSON import and full backup restore in the UI; show counts, recovery backup action, and explicit completion status.
- [ ] Run focused and full tests; commit `feat: add validated backup recovery`.

### Task 3: Replace native destructive prompts and contain failures

**Files:** Create `src/components/ui/ConfirmDialog.tsx`, `src/components/ui/AppErrorBoundary.tsx`; modify `WorkspacePage.tsx`, `OutputPreviewPanel.tsx`, `DataPortabilityModal.tsx`, `main.tsx`.

- [ ] Write failing component/unit tests for dialog confirm/cancel, Escape close, focus return, and error-boundary recovery render.
- [ ] Implement focus-trapped dialog with `aria-describedby`, Escape, return focus, and explicit destructive styling.
- [ ] Replace native prompts in critical document-destructive flows; add error boundary with reload, home, and safe recovery guidance.
- [ ] Run tests/typecheck; commit `feat: add resilient recovery dialogs`.

### Task 4: Improve responsive and accessible workspace use

**Files:** Modify `WorkspacePage.tsx`, `WorkspacePanels.tsx`, `VersionHistory.tsx`, `index.css`; add focused tests.

- [ ] Write failing tests for mobile workspace controls exposing Palette, Inspector, and Snapshots with accessible names.
- [ ] Implement responsive drawers/sheets, touch-size controls, focus-visible styles, live status messages, skip link, and no-desktop-panel squeeze at tablet/mobile breakpoints.
- [ ] Verify desktop layout remains multi-region and canvas-first; run typecheck/lint/tests; commit `feat: make workspace responsive and accessible`.

### Task 5: Make the golden path self-explanatory

**Files:** Create `src/components/workspace/OnboardingChecklist.tsx`; modify `WorkspacePage.tsx`, `LandingPage.tsx`, `DocsPage.tsx`.

- [ ] Write failing tests for first-run checklist progress and deterministic demo reset.
- [ ] Implement a dismissible local checklist linked to template/demo, source, validate, generate, and export actions; persist only dismissal/progress metadata, not credentials.
- [ ] Add clear demo-safe local-data banner and reset action; update Docs to match behavior.
- [ ] Run tests; commit `feat: add guided first-run workflow`.

### Task 6: Upgrade buyer-facing presentation and exports

**Files:** Modify `LandingPage.tsx`, `exporter.ts`, `OutputPreviewPanel.tsx`; add screenshots and tests.

- [ ] Write failing tests for export filename sanitization and complete project export shape.
- [ ] Improve PDF metadata, title treatment, page numbering, and user-visible export completion/failure states.
- [ ] Add consultant/agency use-case proof, product demo visual, honest security boundary, and clear public-demo CTA to the landing page.
- [ ] Run tests/build; commit `feat: polish buyer-grade demo and exports`.

### Task 7: Add browser regression evidence

**Files:** Add Playwright configuration/scripts and `e2e/*.spec.ts`; modify `package.json`.

- [ ] Add tests for landing to guided demo, route recovery, consent non-dispatch/cancel/confirm, backup dialog cancellation, and responsive viewport smoke checks.
- [ ] Run browser tests against the preview server with provider calls mocked; save accepted screenshots in `docs/screenshots/release-2026-07-13/`.
- [ ] Run all checks; commit `test: cover golden path in browser`.

### Task 8: Build acquisition data room and deterministic release

**Files:** Create `docs/buyer/*`, `scripts/package-release.mjs`, `RELEASE_MANIFEST.md`; update `README.md`, `CHANGELOG.md`, `QA-REMEDIATION-2026-07-13.md`.

- [ ] Document architecture, data model, privacy/security, deployment/maintenance, feature reality, dependencies/IP, buyer FAQ, listing, competition, and outreach sequences.
- [ ] Create exclusion-driven package script which writes manifest, file count, size, and SHA-256.
- [ ] Run package validator and inspect ZIP contents; commit `docs: prepare acquisition handoff package`.

### Task 9: Publish a non-authoritative preview and final verification

**Files:** Modify Vercel configuration only if required for preview safety; add deployment evidence to QA report.

- [ ] Deploy the branch as a preview, never production; capture returned URL.
- [ ] Verify rendered identity, valid and invalid routes, preview headers, consent behavior, desktop and mobile screenshots.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, browser tests, `npm run build`, package script, and record exact results.
- [ ] Commit final documentation-only evidence update.
