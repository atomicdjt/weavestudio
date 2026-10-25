# Technical Debt Register

Candidate review date: 12 October 2026. Status describes the reviewed source branch; deployment status is in `docs/RELEASE_VERIFICATION.md`.

| ID | Item | Severity | Status and evidence |
|----|------|----------|---------------------|
| TD-01 | Canvas interaction buffers and workspace command orchestration share responsibilities across `WorkspacePage` and `WorkflowCanvas` | Medium | Open. The workspace document remains durable authority, and current browser tests cover switching and recovery; extracting command handlers would reduce coupling. |
| TD-02 | Workspace schema versioning | Medium | Mitigated for v1. Documents and backups reject malformed or unsupported schema fields; future versions still need an explicit migration. |
| TD-03 | Optional provider network boundary | Medium | Mitigated. OpenAI/Gemini require explicit consent and user keys; live provider accounts and response quality are not verified. |
| TD-04 | Automated regression coverage | Medium | Mitigated for the documented candidate scope. Vitest discovers TS and TSX; Playwright covers primary template handoffs, recovery, exports, routes, and automated accessibility. Human and live-service validation remain external. |
| TD-05 | Export consistency | Medium | Mitigated. The composer and readiness validator share a section assignment plan; Markdown is the complete text handoff and JSON preserves recovery state. |
| TD-06 | Unreferenced `BuyerPage` component | Low | Open. The source file has no route or import; confirm it is no longer an intended standalone surface before removing it. |
| TD-07 | Inventory-only handoff | Low | Closed. Markdown provides editable complete text, and Project JSON carries a recoverable workspace rather than relying on a node inventory export. |
| TD-08 | Multi-workspace durability | Medium | Mitigated for browser-local use. Save failures surface, writes are verified, and workspace switching flushes the outgoing revision; there is no sync across browsers or devices. |
| TD-09 | Generated `dist/` files in Git | Low | Closed. `dist/` is ignored and no generated build files are tracked. |
| TD-10 | Acquisition content in the primary product flow | Medium | Mitigated. Acquisition material stays on its dedicated route and buyer documentation. |
| TD-11 | Participant evidence | Medium | Open. No participant completion rate or time-saved result is available; the study protocol and blank ledger are ready for consenting participants. |
| TD-12 | Two moderate development-only dependency advisories | Low | Open pending upstream-compatible remediation. The candidate retains the compatible typography toolchain; the production dependency audit is checked by the commit-bound release receipt. |
