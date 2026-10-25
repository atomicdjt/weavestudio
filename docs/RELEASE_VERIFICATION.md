# Release verification protocol

Reproduce current engineering verification under Node 24:

```sh
npm ci
npx playwright install chromium
npm run verify
```

The runner executes production dependency auditing, TS/TSX tests, lint,
TypeScript, production build, desktop/mobile browser regressions, route/dialog
accessibility, document validation, and package hygiene. Each check runs once.
The separate `npm run verify:buyer` command remains available.

It writes `release/VERIFICATION.json` with the exact checked-out commit, UTC
start/end times, Node version, platform, every command/exit code, CI run URL,
and whether the source was dirty. CI uploads the receipt with the package
manifest. A dirty receipt characterizes a working tree, not a published commit.

## Candidate and production identity

The 12 October 2026 quality repair is a candidate until independently reviewed
and merged. Read its receipt and PR checks for current results. Historical
release checklists and frozen test counts are separate evidence.

Production inspected on 12 October 2026:

- URL: https://weavestudio-nine.vercel.app/
- Source: `main` at `f74c835e0953a135f7aefef1a64a68d0d0cd9d0f`
- Vercel deployment: `dpl_8p5eSou5k4GptwTSZRtSPNt4ubRg`
- State: READY at inspection, not a future health guarantee.

The historical v1.0.0 tag, current production, local verification, preview
deployment, independent approval, and merge are distinct evidence.

## Scope and remaining validation

OpenAI/Gemini requests are mocked in QA; no live key, paid call, or participant
data is used. Core composition remains deterministic and local. Browser QA uses
Chromium desktop and phone-sized emulation, not physical devices or native iOS
Safari. Automated accessibility does not replace screen-reader/user validation.
Task completion and time saved remain unmeasured; see the
[study protocol](research/STUDY_PROTOCOL.md).

PDF is a paginated reading view with simplified formatting and limited Unicode.
Markdown and Project JSON are complete handoff/recovery formats. The candidate's
production dependency audit is clean; the full development audit retains two
moderate build-only findings through typography's selector parser. Compatible
fixes pass the same PR gate; an incompatible downgrade is not forced.

## Hosting and release gate

Vercel uses `npm run build`, `dist/`, Node 24, and the SPA rewrite. No environment
variable is required for the core workflow. Assets must load first: there is no
offline installation/service-worker guarantee. Optional AI and explicitly loaded
remote images require networking.

Merge requires independent approval and required checks. Tie the resulting
production deployment to its merged commit and perform live checks before
calling that release production-verified.
