# Test Strategy

## Tooling

- Vitest runs unit and component tests in both `.ts` and `.tsx` files.
- Playwright runs browser checks in desktop and phone-sized Chromium configurations, plus automated accessibility checks.
- Oxlint checks source; TypeScript runs through `npm run typecheck`.
- `npm run verify` is the current one-pass release gate and writes exact commit-bound evidence to `release/VERIFICATION.json`.

## Coverage

| Area | Level | Candidate coverage |
|------|-------|--------------------|
| Source splitting and deliverable section assignment | Unit | Implemented, including explicit ownership, category fallback, and exact heading matching. |
| Workspace storage, migration, import, backup, and snapshots | Unit and browser | Failure rollback, exact owned bytes, strict schema checks, snapshot restore feedback, and recovery paths. |
| AI adapter and draft targeting | Unit and browser | Responses REST envelopes, refusal/errors, cancellation, delayed replies, workspace/node/input revision changes, and stale Apply. |
| Primary template handoffs | Browser | Every primary template is completed, validated, generated, and exported as Markdown and Project JSON. |
| PDF and remote-image behavior | Browser | Long documents retain final content across pages; remote images require explicit activation. |
| Navigation and accessibility | Browser | Routes and primary dialog/sheet states use automated axe checks and keyboard-oriented assertions. |
| Live provider behavior and user task outcomes | Human/live service | Not measured by this candidate. Provider calls use test doubles; participant completion and time saved need consenting users and completed study ledgers. |
| Native mobile and screen reader behavior | Manual | Not established by browser emulation or automated accessibility checks. |

## Commands

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run verify
```

Use the receipt for counts, skips, platform, and exact source identity; do not copy a fixed test count into this document.
