# Feature Reality Matrix — WeaveStudio

Candidate review date: 12 October 2026. This describes the reviewed source branch, not the production site. See `docs/RELEASE_VERIFICATION.md` for the commit-bound receipt and release boundaries.

| Capability | Candidate status | Evidence boundary |
|------------|------------------|-------------------|
| Primary templates and guided demo | Implemented | Data-driven template definitions; all primary templates exercised through generated Markdown and JSON handoff flows. |
| Source paste, Apply, and Split | Implemented | Split cancellation and failed operations preserve owned storage bytes in automated tests. |
| Canvas and workspace records | Implemented | Multiple workspaces, autosave, snapshots, import, and restore have focused tests; workspace switches flush pending edits. |
| Validator and review readiness | Implemented | Required output sections and review-path coverage are checked against the same section plan used by generation. |
| Deliverable generation | Implemented | Local deterministic composition; it does not verify facts or certify an analysis. |
| Markdown and project JSON | Complete handoff formats | Markdown carries complete editable text; Project JSON carries the recoverable workspace, source, draft, and provenance. |
| PDF | Reading view with limits | Long wrapped blocks paginate and retain their ending text; typography and Unicode support are simplified. |
| Browser backup restore | Implemented | Recognized records are validated before replacement, writes are verified, and changed records roll back on failure. |
| Optional AI | Implemented with provider limits | OpenAI and Gemini use user keys and explicit request consent. Automated tests cover realistic response envelopes and stale/cancelled results; no live account or paid response was checked. |
| Markdown remote images | Explicit opt-in | External images stay inert until the user loads each image; allowed requests omit the referrer. |
| Automated quality suite | Implemented | Vitest includes TS and TSX; Playwright covers desktop and phone-sized Chromium, primary handoffs, recovery, exports, routes, and automated accessibility checks. See the receipt for exact counts and declared platform skips. |
| Local-first privacy | Implemented with limits | Workspace data remains in browser storage; there is no account or cloud workspace sync. Startup still needs static assets unless the browser already has them cached. |
| Participant task completion and time saved | Not measured | No consenting participants or existing anonymized timing data were available. Blank instruments are in `docs/research/`. |
| Production release | Not changed by this candidate | Production still identifies the deployed commit recorded in the release-verification document until a reviewed merge and deployment occur. |
