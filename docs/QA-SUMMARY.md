# WeaveStudio v1.0.0 QA Summary

## Verified release evidence

- **Automated tests:** 33 passing tests across 8 Vitest files.
- **Lint:** clean with zero errors and zero warnings from `npm run lint`.
- **Typecheck:** clean with `npm run typecheck` (`tsc -b`).
- **Production build:** successful with `npm run build`.
- **Independent remediation QA:** PASS.
- **Independent production smoke test:** PRODUCTION PASS.
- **Verified production URL:** [https://weavestudio-nine.vercel.app/](https://weavestudio-nine.vercel.app/)
- **Verified production-tested commit:** `742a017388547e1e89b996c8d01bea9e79f9a55d`.

## Major behavior classes verified

- Guided demo creates one workspace without duplication.
- Source-to-node synchronization preserves unrelated node edits and viewport state.
- Manual draft changes are protected by an overwrite confirmation.
- Snapshots restore coherent workspace, source, graph, and deliverable state.
- Deliverable generation avoids duplicate headings and placeholder output.
- Markdown, PDF, and Project JSON export work; Project JSON round-trips workspace state.
- The standard local-first workflow does not make hidden OpenAI or Ollama provider calls.
- Direct application routes refresh through the production SPA rewrite.

## Expected limitations

WeaveStudio is browser-local by default and requires human review of generated work. Browser `localStorage` is not encrypted or durable cloud storage. Optional live provider requests are user-confirmed, not part of the standard workflow. The product is single-user and desktop-oriented; it does not provide cloud sync, accounts, collaboration, factual verification, or regulated-professional advice.

Raw internal QA evidence is intentionally excluded from the repository and retained outside it at `C:\Users\Atomic\Desktop\WeaveStudio-QA-Evidence-20260710\Repository-Archive`.
