# WeaveStudio Buyer Due-Diligence Index

This index gives a prospective buyer a direct path from common diligence questions to the relevant evidence. It does not replace independent buyer review.

## Start here

| Buyer question | Primary evidence |
|---|---|
| What is WeaveStudio? | `README.md`, `docs/buyer/EXECUTIVE_SUMMARY.md`, `docs/buyer/ONE_PAGE_ACQUISITION_BRIEF.md` |
| What is actually implemented? | `docs/buyer/FEATURE_REALITY.md`, live demo, source review |
| What is included in the purchase? | `docs/buyer/ASSET_SCHEDULE.md` |
| What is excluded? | `docs/buyer/EXCLUDED_ASSETS.md` |
| What are the product limitations? | `KNOWN_LIMITATIONS.md`, `docs/buyer/FEATURE_REALITY.md` |
| How does a buyer verify the release? | `README.md`, `docs/buyer/TRANSFER_CHECKLIST.md`, `scripts/verify-buyer.mjs` |
| How is the package produced? | `scripts/package-release.mjs`, `scripts/create-deterministic-zip.py`, `.github/workflows/acquisition-release.yml` |
| How does ownership transfer work operationally? | `docs/buyer/TRANSFER_CHECKLIST.md`, `docs/buyer/CLOSING_RUNBOOK.md` |
| What support is included? | `docs/buyer/POST_CLOSE_SUPPORT_TERMS.md` |
| What should the buyer do after acquisition? | `docs/buyer/OPERATING_PLAN_90_DAYS.md` |

## Product diligence

### Golden-path verification

1. Open the production or public-demo deployment.
2. Choose a template or guided demo.
3. Add or edit source material.
4. Apply source material to workflow nodes.
5. Organize, connect, and classify the workflow.
6. Run Workflow Validator.
7. Generate and edit the deliverable.
8. Export Markdown, PDF, and project JSON.
9. Re-import project JSON as a new workspace.
10. Export and validate an owned-data backup.

### Product boundaries to verify

- Workspaces are browser-local.
- `localStorage` is not encrypted or durable cloud storage.
- The application is single-user and does not include accounts, cloud sync, real-time collaboration, or billing.
- PDF output is text-oriented rather than a full visual-layout engine.
- Optional AI requests require explicit user confirmation and a user-provided provider key.
- AI output and generated deliverables require human review.

## Technical diligence

### Supported verification path

From a clean clone of the agreed commit:

```bash
node --version
npm --version
npm ci
npm run verify:buyer
```

`verify:buyer` runs:

1. Type checking.
2. Linting.
3. Unit tests.
4. Production build.
5. Browser tests.
6. Deterministic acquisition package generation.

The acquisition release workflow additionally generates:

- CycloneDX SBOM.
- SHA-256 checksum inventory.
- Release summary containing commit, ref, run, runtime, timestamp, and artifact listing.
- Private GitHub Actions artifact containing the `release/` directory.

### Technical records to retain at closing

- Final commit SHA and branch.
- Final acquisition tag, if used.
- GitHub Actions run URL and result.
- Vercel production and public-demo deployment identifiers.
- Node and npm versions.
- ZIP filename and SHA-256.
- Package manifest.
- SBOM.
- Release summary.

## Intellectual-property diligence

A buyer should review:

- `LICENSE.md` for the current proprietary repository notice.
- `package.json` and lockfile for declared dependencies.
- The SBOM generated from the closing commit.
- `ASSET_SCHEDULE.md` and `EXCLUDED_ASSETS.md` for ownership boundaries.
- Git history for authorship and contribution history.
- Any seller representations in the final signed agreement.

The seller should not represent ownership of third-party libraries, fonts, icons, provider services, or other material governed by third-party licenses.

## Commercial diligence

The current asset does not include:

- Customers.
- Revenue.
- Active-user or retention metrics.
- Subscription contracts.
- Employees or contractors.
- Certified compliance posture.
- A guaranteed commercialization result.

The buyer should value the transaction as an acquisition of a completed, tested, documented product foundation and development-time acceleration—not as a revenue multiple transaction.

## Access levels

### Public review

May include:

- Public demo.
- Public acquisition page.
- One-page brief.
- README and public screenshots.
- Executive summary and feature-reality matrix.

### Qualified buyer review

May include:

- Architecture and maintenance information.
- Known limitations.
- Transfer checklist.
- Verification summary.
- Asset and exclusion schedules.
- Closing and support terms.

### Controlled source review

Before sharing private source or nonpublic artifacts, confirm:

- Buyer identity and legal entity.
- Product-use or integration thesis.
- Decision authority.
- Indicative price compatibility.
- Target closing timeline.
- Agreed confidentiality terms when appropriate.

### Funded closing

Repository ownership, deployment ownership, editable branding assets, and final private package should transfer only after the signed agreement and confirmed cleared escrow funding.

## Buyer acceptance test

Unless modified by the signed agreement, objective acceptance should confirm:

1. Buyer receives access to the agreed repository and closing commit.
2. Required files listed in the asset schedule are present.
3. `npm ci` completes in the agreed supported environment.
4. `npm run verify:buyer` completes against the unmodified closing commit.
5. The acquisition ZIP hash matches the delivered checksum.
6. The buyer can create a production build.
7. The buyer can deploy the static application using the documented Vercel route or an equivalent static host.

Commercial preference, roadmap requests, buyer's remorse, or failure to achieve future revenue are not technical acceptance defects.
