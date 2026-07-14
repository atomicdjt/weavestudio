# WeaveStudio acquisition-branch QA Summary

## Verified release evidence

- **Automated tests:** 38 passing Vitest tests across 10 files.
- **Browser tests:** Playwright desktop consent coverage plus desktop/mobile route and mobile-sheet interaction coverage; provider requests are mocked.
- **Lint and typecheck:** clean on the hardening branch.
- **Production build and buyer package:** successful via `npm run verify:buyer`.
- **Preview:** non-production Vercel preview only. Anonymous access is currently blocked by project-level Deployment Protection; see `docs/buyer/PUBLIC_DEMO.md`.

## Major behavior classes verified

- Guided demo creates one workspace without duplication.
- Source-to-node synchronization preserves unrelated node edits and viewport state.
- Manual draft changes are protected by an overwrite confirmation.
- Snapshots restore coherent workspace, source, graph, and deliverable state.
- Deliverable generation avoids duplicate headings and placeholder output.
- Markdown, PDF, and Project JSON export work; Project JSON round-trips workspace state.
- The standard local-first workflow does not make hidden OpenAI or Ollama provider calls.
- Direct application routes recover through the SPA rewrite in local browser tests.

## Expected limitations

WeaveStudio is browser-local by default and requires human review of generated work. Browser `localStorage` is not encrypted or durable cloud storage. Optional live provider requests are user-confirmed, not part of the standard workflow. The product is single-user; it does not provide cloud sync, accounts, collaboration, factual verification, or regulated-professional advice. Dense graph editing remains strongest on desktop, while mobile exposes dedicated Inspector and Snapshot sheets.

Run `npm run verify:buyer` to regenerate current local evidence. Do not treat historical production notes as evidence for the hardening branch.
