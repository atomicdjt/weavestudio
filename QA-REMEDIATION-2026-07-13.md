# QA remediation

Implemented: consent-gated OpenAI/Gemini requests, canonical guided-demo reuse, SPA not-found recovery, scoped snapshots, byte-accurate owned-storage reporting, typed destructive clear confirmation, masked volatile keys, and review-before-apply AI output.

Browser coverage now uses Playwright with mocked provider requests for desktop consent behavior and desktop/mobile route smoke coverage. Preview deployment evidence is recorded in `docs/buyer/PUBLIC_DEMO.md`; deployment protection currently blocks anonymous rendered-app verification.
