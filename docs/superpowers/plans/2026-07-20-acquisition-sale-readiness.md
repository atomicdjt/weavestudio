# WeaveStudio Acquisition Sale Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a reviewable, claim-safe, technically verifiable acquisition package for a fast exclusive WeaveStudio asset sale.

**Architecture:** Add focused buyer and transaction documents under `docs/buyer/`, retain the current deterministic package builder, and add a manual/tag-triggered GitHub Actions workflow that runs the existing verification gate before generating an SBOM, checksums, release summary, and private artifact. No runtime product behavior changes.

**Tech Stack:** Markdown, GitHub Actions, Node.js 24, npm 11, existing Vite/React/TypeScript build, existing Playwright/Vitest verification, npm CycloneDX SBOM.

## Global Constraints

- Work only on `acquisition/sale-readiness-2026-07-20` until review.
- Do not change production aliases, repository visibility, deployments, secrets, pricing pages, or account ownership.
- Do not claim customers, revenue, traction, compliance certification, patent clearance, guaranteed security, or guaranteed commercial results.
- Keep legal documents explicitly marked as draft templates requiring legal review.
- Never include personal identifiers, payment data, credentials, API keys, or private buyer records in the repository.

---

### Task 1: Define the transaction scope

**Files:**
- Create: `docs/buyer/ASSET_SCHEDULE.md`
- Create: `docs/buyer/EXCLUDED_ASSETS.md`
- Create: `docs/buyer/POST_CLOSE_SUPPORT_TERMS.md`

**Interfaces:**
- Consumes: Existing `README.md`, `docs/buyer/EXECUTIVE_SUMMARY.md`, `docs/buyer/FEATURE_REALITY.md`, and `docs/buyer/TRANSFER_CHECKLIST.md`.
- Produces: Stable definitions used by the acquisition brief, agreement template, closing runbook, and diligence index.

- [ ] **Step 1:** Write `ASSET_SCHEDULE.md` with enumerated included repository, code, documentation, deployment, branding, and transition assets.
- [ ] **Step 2:** Write `EXCLUDED_ASSETS.md` with personal accounts, unrelated products, credentials, third-party IP, customers/revenue, domains, and unlimited support excluded.
- [ ] **Step 3:** Write `POST_CLOSE_SUPPORT_TERMS.md` with five business days, three total hours, transfer/setup scope, and explicit exclusions for features and integrations.
- [ ] **Step 4:** Cross-check every statement against the current README and buyer documentation.
- [ ] **Step 5:** Commit with `docs: define acquisition assets and support boundaries`.

### Task 2: Create the buyer-facing sale package

**Files:**
- Create: `docs/buyer/ONE_PAGE_ACQUISITION_BRIEF.md`
- Create: `docs/buyer/DUE_DILIGENCE_INDEX.md`
- Create: `docs/buyer/CLOSING_RUNBOOK.md`

**Interfaces:**
- Consumes: Transaction scope documents from Task 1.
- Produces: The first-read buyer summary, diligence navigation, and operational closing sequence.

- [ ] **Step 1:** Write the acquisition brief with product, buyer value, implemented capabilities, honest boundaries, included assets, and a $6,500 asking price.
- [ ] **Step 2:** Write the diligence index that maps buyer questions to exact repository documents and verification commands.
- [ ] **Step 3:** Write the closing runbook covering headline terms, signature, funded escrow, final verification, GitHub/Vercel transfer, inspection, release, and access removal.
- [ ] **Step 4:** Verify no document discloses the confidential $3,500 floor.
- [ ] **Step 5:** Commit with `docs: add acquisition brief and closing materials`.

### Task 3: Add legally cautious templates

**Files:**
- Create: `docs/buyer/legal/NDA_TEMPLATE.md`
- Create: `docs/buyer/legal/ASSET_PURCHASE_AND_IP_ASSIGNMENT_TEMPLATE.md`

**Interfaces:**
- Consumes: Asset and exclusion schedules plus support terms.
- Produces: Reviewable starting points for PandaDoc or counsel; no self-executing legal action.

- [ ] **Step 1:** Add a short mutual NDA template with permitted-purpose, confidentiality, exclusions, required disclosure, return/destruction, no license, and governing-law placeholders.
- [ ] **Step 2:** Add an asset-purchase/IP-assignment template with price, assets, exclusions, delivery, inspection, acceptance, support, representations, disclaimers, limitation of liability, portfolio attribution, and signatures.
- [ ] **Step 3:** Add a conspicuous legal-review warning to both templates.
- [ ] **Step 4:** Confirm no template contains seller SSN, home address, bank details, buyer identity, or invented legal facts.
- [ ] **Step 5:** Commit with `docs: add draft acquisition legal templates`.

### Task 4: Automate acquisition release evidence

**Files:**
- Create: `.github/workflows/acquisition-release.yml`

**Interfaces:**
- Consumes: Existing `npm run verify:buyer`, `npm run package:acquisition`, release directory, and Node 24 engine.
- Produces: A private GitHub Actions artifact containing the deterministic ZIP, package manifest, CycloneDX SBOM, SHA-256 checksums, and release summary.

- [ ] **Step 1:** Configure `workflow_dispatch` and `v*-acquisition` tag triggers with read-only contents permission.
- [ ] **Step 2:** Check out source and set up Node 24 with npm caching.
- [ ] **Step 3:** Run `npm ci` and `npm run verify:buyer`; allow any failure to stop the workflow.
- [ ] **Step 4:** Run `npm sbom --sbom-format=cyclonedx --sbom-type=application > release/weavestudio-sbom.cdx.json`.
- [ ] **Step 5:** Generate `release/SHA256SUMS.txt` and `release/RELEASE_SUMMARY.md` with commit, ref, run, Node, npm, UTC timestamp, and artifact inventory.
- [ ] **Step 6:** Upload only `release/**` as a private Actions artifact with a 30-day retention period and fail when files are missing.
- [ ] **Step 7:** Commit with `ci: add acquisition release evidence workflow`.

### Task 5: Update buyer navigation

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: All new buyer documents.
- Produces: Discoverable links without changing product positioning or runtime behavior.

- [ ] **Step 1:** Add links for the one-page brief, asset schedule, exclusions, diligence index, closing runbook, and support terms to the Buyer materials section.
- [ ] **Step 2:** Keep legal templates out of the public top-level sales copy; reference them only as draft review materials.
- [ ] **Step 3:** Commit with `docs: link acquisition sale materials`.

### Task 6: Verify and open the pull request

**Files:**
- Review: all files changed by Tasks 1–5.

**Interfaces:**
- Consumes: Completed branch.
- Produces: A reviewable PR with CI and deployment evidence.

- [ ] **Step 1:** Inspect every created file from the branch and scan for placeholders other than intentionally marked contract fields.
- [ ] **Step 2:** Confirm the workflow YAML parses structurally and uses documented npm and GitHub Actions commands.
- [ ] **Step 3:** Open a pull request to `main` describing scope, exclusions, verification, and remaining manual actions.
- [ ] **Step 4:** Wait for GitHub CI and Vercel preview checks; do not merge automatically.
- [ ] **Step 5:** Record any unavailable local verification honestly in the PR.
