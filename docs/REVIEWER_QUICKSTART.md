# Independent reviewer quickstart — WeaveStudio

**Scope:** An evaluation-accessible, **proprietary** local-first workflow canvas. [Live demo](https://weavestudio-nine.vercel.app/) · [License](../LICENSE.md) · [Known limitations](KNOWN_LIMITATIONS.md).

## Local checks

Requires Node.js 24, npm, and a supported Playwright browser:

```bash
git clone https://github.com/atomicdjt/weavestudio.git
cd weavestudio
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
npm audit --audit-level=moderate
npx playwright install chromium
npm run test:browser -- --workers=1
```

Review [the CI workflow](../.github/workflows/ci.yml) for the exact hosted gate. The browser command is serialized because the local test server uses a fixed port and parallel workers can create a false-negative collision. The buyer/acquisition package is a separate deliverable and should be verified with `npm run verify:buyer` and `npm run package:acquisition` only if that packaging scope is under review.

## Manual evidence path

1. Open the **guided demo** in a fresh or disposable browser profile.
2. Paste synthetic source material, add or edit nodes, and generate a deliverable.
3. Inspect claim-to-source links, including **valid/stale/broken/missing** states. Deliberately edit the underlying source and verify that a stale claim is not presented as unchanged evidence.
4. Use Workflow Validator; note that it checks structural readiness, **not** the factual truth of the source.
5. Inspect Markdown/PDF/Project JSON output; re-import an exported project and check the supported fields.
6. Save, reload, restore a snapshot, and export an owned-data backup. `localStorage` does not provide encryption, cross-device sync, or permanence.

Optional AI Assist is BYOK and requires explicit initiation; the normal flow does not silently send source material to OpenAI or Gemini. Use synthetic text and a safe test credential if reviewing provider behavior.

## Important version boundary

[PR #65](https://github.com/atomicdjt/weavestudio/pull/65) was merged into `main` at commit `fae8e7034711cc717128678e9fa8538a9fee254f` and includes the approval-attestation work originally proposed in [PR #64](https://github.com/atomicdjt/weavestudio/pull/64). Re-check the exact current `main` commit before treating any capability or verification result as current; this guide records a reproducible review path, not a release claim.

No independent customer traction, enterprise deployment, privacy certification, or factual correctness of generated content is implied. See [case study](CASE_STUDY.md), [data portability](DATA-PORTABILITY.md), and [privacy](PRIVACY.md).
