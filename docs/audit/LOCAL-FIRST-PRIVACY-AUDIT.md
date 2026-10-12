# Local-First Privacy Audit

Review date: 12 October 2026. This summarizes the candidate implementation; consult the release receipt before attributing it to production.

## Stored in this browser

- Workspace graphs, source material, drafts, provenance, preferences, and snapshots use browser local storage.
- Template content and deterministic deliverable composition run in the app.
- Markdown, PDF, and Project JSON are generated in the browser. Downloads move to the location the user chooses.
- There is no account, backend workspace database, cloud sync, or collaboration service in this product.

## Network activity

- The static application files come from the configured host. Core workflow operations run locally after those assets load. There is no service worker or offline-startup guarantee.
- An OpenAI or Gemini request sends the user-confirmed prompt and selected AI node context to the configured provider. A user key stays in tab memory and is not written to local storage.
- Markdown images from another host remain unloaded until the user activates that image. The image request omits the referrer.
- Static hosting serves the application; it does not receive workspace records through an app API.

## Limits and safeguards

- Local storage is readable by scripts running in the same origin, is not encrypted, and can be cleared by the browser or the user.
- AI requires a user-supplied key and explicit per-request confirmation. Apply is bound to the original workspace, node, and input revision; stale or cancelled results are not applied.
- Export important work as Markdown or Project JSON. Markdown is the complete editable text handoff; Project JSON is the recoverable workspace handoff. PDF is a simplified reading view.
- Automated tests do not establish live provider availability, physical-device behavior, screen-reader usability, or user-study outcomes.
