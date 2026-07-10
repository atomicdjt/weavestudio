# Release Verification

## Release scope

- **Release:** WeaveStudio v1.0.0
- **Authoritative branch:** `master`
- **Production URL:** [https://weavestudio-nine.vercel.app/](https://weavestudio-nine.vercel.app/)
- **Production-tested base commit:** `742a017388547e1e89b996c8d01bea9e79f9a55d`

## Local validation

- [x] `npm ci`
- [x] `npm test` - 33 tests passing
- [x] `npm run lint` - zero errors and zero warnings
- [x] `npm run typecheck` - zero TypeScript errors
- [x] `npm run build` - successful production build

## Product behavior verified

- [x] Core routes render and direct refreshes use the SPA rewrite.
- [x] Guided demo creates exactly one workspace.
- [x] Source synchronization preserves unrelated node edits and canvas viewport.
- [x] Process Check completes structural and export-readiness checks.
- [x] Deliverable generation completes without duplicate generated headings.
- [x] Manual draft edits require confirmation before overwrite.
- [x] Snapshots restore coherent workspace state.
- [x] Markdown, PDF, and Project JSON exports work; Project JSON re-imports.
- [x] The standard workflow makes no hidden provider request.

## Optional AI boundary

AI Assist is an optional blueprint. The offline/mock path is the default. A live provider request can occur only after explicit confirmation and may send the configured prompt/context to that provider. No API key is bundled; keys are not written to browser `localStorage`.

## Deployment configuration

- Build command: `npm run build`
- Output directory: `dist/`
- Hosting: Vercel static deployment with SPA rewrite in `vercel.json`
- No environment configuration is required for the standard workflow.

## Release gate

This document records verified checks; it is not a guarantee of future deployment health. Final merge, production verification, tagging, and GitHub Release publication remain separately approval-gated.
