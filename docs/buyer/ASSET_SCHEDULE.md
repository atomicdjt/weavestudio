# Schedule A — WeaveStudio Included Assets

> Draft transaction schedule for buyer diligence and legal review. The signed purchase agreement controls if it differs from this document.

## Transaction description

The contemplated transaction is an exclusive transfer of the seller-owned WeaveStudio software asset and associated original intellectual property. It is not a sale of the seller's personal accounts, an operating company, customer relationships, revenue, or unrelated projects.

## Included assets

Subject to the signed agreement and receipt of cleared funds, the included assets are:

1. **Source repository**
   - The `atomicdjt/weavestudio` GitHub repository.
   - The complete Git history, branches, tags, pull requests, issues, and repository documentation that GitHub preserves during an accepted repository transfer.
   - The authoritative editable source on the `main` branch at the final agreed closing commit.

2. **Original application source**
   - Seller-owned React and TypeScript application code.
   - Seller-owned workflow-canvas behavior, workspace behavior, validation rules, template structures, export flows, recovery flows, and consent-gated AI-assistance user experience.
   - Seller-owned styles, components, copy, configuration, tests, and build scripts contained in the repository.

3. **Original product content**
   - Seller-created workflow templates and example content.
   - Seller-created interface text, onboarding text, product explanations, and limitation disclosures.
   - Seller-created screenshots, diagrams, and demonstration materials stored in the repository or specifically listed in the final delivery manifest.

4. **Documentation and buyer materials**
   - README, setup, architecture, maintenance, release, security-reporting, contribution, limitation, and verification documentation.
   - Buyer executive summary, feature-reality matrix, operating plan, transfer checklist, acquisition brief, diligence index, closing runbook, and related buyer materials.
   - Draft legal templates are included only as editable working documents and are not represented as legal advice.

5. **Verification and packaging assets**
   - Unit, browser, build, lint, and type-check configuration and tests.
   - Buyer-verification and deterministic packaging scripts.
   - The final acquisition ZIP, package manifest, release summary, SBOM, and SHA-256 checksum file generated from the agreed closing commit.

6. **Deployment assets**
   - The seller-controlled Vercel projects currently used for the WeaveStudio production and public-demo deployments, if the parties elect project transfer and Vercel permits it.
   - Otherwise, reasonable assistance reconnecting the transferred repository to buyer-owned Vercel projects.
   - Existing `vercel.app` aliases only to the extent Vercel transfers or permits reassignment of them; no independent domain ownership is represented.

7. **Product identity**
   - Seller-owned rights in the `WeaveStudio` product name, original logo treatment, original product copy, and original branding assets included in the repository, to the extent those rights are owned by the seller and are transferable.
   - No representation of trademark registration, global name clearance, or freedom from third-party claims is made unless separately documented in the signed agreement.

8. **Transition assistance**
   - Limited post-close transfer and setup assistance under `POST_CLOSE_SUPPORT_TERMS.md` or the support terms incorporated into the signed agreement.

## Delivery baseline

The delivery baseline must identify:

- Final Git commit SHA.
- Final tag, if used.
- Node and npm versions used for verification.
- Acquisition ZIP filename and SHA-256 hash.
- Package-manifest filename.
- SBOM filename.
- Vercel project names or buyer-owned redeployment route.
- Date and time of final verification in UTC.

## Third-party components

Open-source and third-party packages remain owned by their respective copyright holders and are governed by their own licenses. The buyer receives the seller's transferable rights in the original WeaveStudio materials plus the right to use included third-party components only under the applicable third-party licenses.

## No implied assets

No asset is included merely because it was used during development. Any item not expressly listed in this schedule or the signed agreement is excluded.
