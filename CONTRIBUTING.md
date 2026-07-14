# Contributing to WeaveStudio

## Scope

Keep changes local-first, accessible, typed, and backward-compatible with existing browser-stored projects. Do not add cloud persistence, analytics, persisted API keys, billing, or provider secrets without an approved commercial architecture decision.

## Before opening a pull request

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
```

Use a focused branch, add tests before behavior changes, and document visible product or data-model changes. Do not commit `.env` files, API keys, build output, node modules, or private user data.

## Pull requests

Explain the user-visible outcome, data-migration impact, privacy/security boundary, verification commands actually run, and any intentional limitation. Preserve the explicit consent requirement before external AI requests and the human-review-before-apply behavior.

