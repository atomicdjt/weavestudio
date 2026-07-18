# WeaveStudio Consolidated Release QA Summary

## Scope

This summary applies to the authoritative `master` release after the July 14, 2026 consolidation. It describes repository and automated-test evidence; it does not claim independent certification, production-scale usage, revenue, customers, or regulated compliance.

## Verified release evidence

- **Automated tests:** 38 passing Vitest tests across 10 files in the consolidated release evidence.
- **Browser coverage:** Playwright desktop and mobile consent coverage, route smoke coverage, and mobile-sheet interaction coverage; external provider requests are mocked.
- **Lint and typecheck:** clean in the acquisition hardening verification used for consolidation.
- **Production build and buyer package:** completed successfully through `npm run verify:buyer` before consolidation.
- **Deployment checks:** both the primary WeaveStudio Vercel project and public demo reported successful status checks after the consolidated release was merged.
- **Release authority:** `master` is the single editable source of truth. Generated ZIPs and deployment artifacts are derivative outputs.

## Major behavior classes verified

- Guided demo creates one workspace without duplication.
- Guided-demo reset asks before replacing a non-demo workspace; cancellation preserves the active workspace.
- Source-to-node synchronization preserves unrelated node edits and viewport state.
- Manual draft changes are protected by an overwrite confirmation.
- Snapshots restore coherent workspace, source, graph, and deliverable state.
- Undo/redo is bounded, workspace-scoped, and available through toolbar and keyboard controls.
- Deliverable generation avoids duplicate headings and placeholder output.
- Markdown, PDF, and Project JSON export work; Project JSON round-trips workspace state.
- Owned-data backup, validated restore, import-as-new, scoped clearing, and storage-pressure guidance are implemented.
- The standard local-first workflow does not make hidden OpenAI or Gemini requests.
- Optional OpenAI/Gemini requests require explicit per-request confirmation and return reviewable output before application.
- Direct application routes recover through the SPA rewrite in browser tests.
- Route-level code splitting keeps the initial application bundle separate from workspace and PDF tooling.

## Expected limitations

WeaveStudio is browser-local by default and requires human review of generated work. Browser `localStorage` is not encrypted or durable cloud storage. Optional live-provider requests are user-confirmed and are not required for the standard workflow. The product is single-user; it does not provide cloud sync, accounts, collaboration, billing, factual verification, or regulated-professional advice. Dense graph editing remains strongest on desktop, while mobile exposes dedicated Inspector and Snapshot sheets.

Run `npm run verify:buyer` from the authoritative branch to regenerate current local verification evidence. Historical branch-specific or production notes should not be treated as stronger evidence than the current default branch.