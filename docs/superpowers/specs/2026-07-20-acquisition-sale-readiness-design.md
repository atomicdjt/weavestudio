# WeaveStudio Fast Asset Sale Readiness Design

## Objective

Prepare WeaveStudio for a fast, low-friction exclusive source-code and intellectual-property asset sale while minimizing seller cost, buyer uncertainty, transaction friction, and accidental overcommitment.

## Approved commercial model

- Public asking price: $6,500.
- Normal target close: $5,000–$5,750.
- Seven-day clean-close offer: $4,500.
- Confidential absolute floor: [REDACTED], accepted only for fully funded escrow, buyer-paid fees, a three-business-day inspection period, no custom development, and tightly limited transition support.
- Primary route: direct strategic outreach to previously researched workflow, client-portal, documentation, proposal, no-code, and automation software companies.
- Passive route: one free marketplace listing where available.
- Payment route: buyer-funded third-party escrow.

## Scope

### Repository deliverables

1. Complete asset and exclusion schedules.
2. Add a claim-safe one-page acquisition brief.
3. Add a diligence index and closing runbook.
4. Add draft transaction templates clearly marked for legal review.
5. Add post-close support boundaries.
6. Add an acquisition release workflow that verifies the product, generates the deterministic package, creates a CycloneDX SBOM, records checksums, and uploads private workflow artifacts.
7. Preserve the existing product behavior and local-first architecture.

### External deliverables

1. Create a private acquisition data-room structure.
2. Reuse the existing strict acquirer audit as the outreach CRM source.
3. Prepare a controlled Gmail-draft workflow with duplicate suppression; never auto-send acquisition outreach.
4. Record a short walkthrough and create a public showcase after local execution.
5. Set up e-signature and escrow accounts manually.

## Architecture

The canonical repository remains the source of truth. New acquisition documents live under `docs/buyer/`, implementation records live under `docs/superpowers/`, and the release workflow lives under `.github/workflows/`. The release workflow is manually dispatched or tag-triggered, runs the existing buyer verification pipeline, generates buyer artifacts, and never deploys, publishes, transfers ownership, sends email, or changes account settings.

## Safety constraints

- Work only on an isolated branch and open a pull request.
- Do not modify runtime product behavior unless a verified defect blocks acquisition.
- Do not make revenue, customer, traction, compliance, security-certification, patent-clearance, or guaranteed-value claims.
- Do not expose personal secrets, API keys, credentials, private source packages, or buyer data.
- Do not transfer GitHub/Vercel ownership, change repository visibility, send outreach, sign legal documents, create escrow transactions, or release funds without explicit seller action.
- Legal templates are starting points for professional review, not legal advice.
- The public repository may remain visible until the seller deliberately creates a public-showcase/private-canonical split.

## Acceptance criteria

- All new documentation is internally consistent with the existing README, feature-reality matrix, known limitations, executive summary, and transfer checklist.
- A buyer can identify exactly what is included and excluded.
- A buyer can understand the asking price, diligence path, acceptance test, support limit, and closing sequence.
- The acquisition workflow fails if verification or packaging fails.
- The workflow produces a deterministic source package, package manifest, SBOM, checksums, and release summary as a private GitHub Actions artifact.
- Existing CI and production deployments remain unaffected until the branch is reviewed and merged.
