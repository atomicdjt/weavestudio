# WeaveStudio Acquisition Closing Runbook

This runbook describes the recommended operational sequence for a clean exclusive asset sale. The signed agreement and escrow instructions control if they differ.

## Closing principles

- Do not transfer ownership based on a payment screenshot, pending payment, check image, overpayment request, cryptocurrency promise, or informal assurance.
- Use a signed agreement and confirmed cleared escrow funding.
- Keep objective acceptance criteria separate from future product or revenue expectations.
- Transfer projects into buyer-owned accounts; never transfer the seller's personal accounts.
- Record exact commit, package, checksum, deployment, and acceptance evidence.

## Phase 1 — Agree headline terms

Confirm in writing:

- Seller and buyer legal names.
- Purchase price and currency.
- Buyer-paid, seller-paid, or split escrow fees.
- Included assets and excluded assets.
- Whether existing Vercel projects will transfer or the buyer will redeploy.
- Three-business-day inspection period unless otherwise agreed.
- Objective acceptance criteria.
- Included transition support.
- Target signing, funding, delivery, and release dates.
- Any confidentiality or public-announcement restrictions.

Do not grant exclusivity without a defined expiration date and meaningful buyer commitment.

## Phase 2 — Buyer qualification

Before private source access, confirm:

1. Buyer legal entity and authorized representative.
2. Buyer product or portfolio use case.
3. Decision authority.
4. Indicative purchase-price compatibility.
5. Target closing timeframe.
6. Required source-review scope.
7. Required post-close support.

Use the public demo and public buyer documents before granting source access.

## Phase 3 — Confidential review

When justified, sign an NDA or include confidentiality in the purchase agreement. Share only the diligence material needed for the current stage.

Recommended staged access:

1. Public demo and brief.
2. Executive, feature-reality, limitation, and transfer documents.
3. Controlled source access for a qualified buyer.
4. Final package and ownership transfer after signed agreement and confirmed funding.

Log every person granted access and revoke unnecessary access promptly.

## Phase 4 — Sign the definitive agreement

The final agreement should incorporate or attach:

- `ASSET_SCHEDULE.md`.
- `EXCLUDED_ASSETS.md`.
- `POST_CLOSE_SUPPORT_TERMS.md`.
- Purchase price and payment method.
- Delivery and inspection process.
- Acceptance criteria.
- Seller and buyer representations.
- As-is and documented-condition language.
- Liability and indemnity terms.
- Portfolio attribution rights.
- Confidentiality and announcement terms.
- Governing law and dispute process.

Draft templates in `docs/buyer/legal/` require legal review and completion of transaction-specific fields.

## Phase 5 — Open and fund escrow

Recommended escrow terms:

- Transaction description: exclusive acquisition of WeaveStudio software source code and associated seller-owned intellectual property.
- Buyer funds 100% of the purchase price.
- Buyer pays the escrow fee when commercially achievable.
- Inspection period: three business days.
- Delivery: electronic repository, deployment, and package transfer.
- Release: buyer acceptance or expiration of the agreed inspection period under the escrow instructions.

Do not begin final ownership transfer until the escrow provider confirms cleared funds.

## Phase 6 — Freeze the closing release

After funding confirmation:

1. Stop nonessential source changes.
2. Identify the final `main` commit.
3. Create the agreed acquisition tag if used.
4. Run the acquisition release workflow.
5. Confirm all verification jobs pass.
6. Record the GitHub Actions run URL.
7. Record the Vercel deployment tied to the closing commit.
8. Download and preserve the release artifact.
9. Verify the acquisition ZIP checksum independently.
10. Complete the closing evidence record.

The closing evidence record must contain:

- Repository and branch.
- Commit SHA and tag.
- Workflow run identifier and result.
- Node and npm versions.
- UTC verification timestamp.
- ZIP filename, size, and SHA-256.
- Package-manifest filename.
- SBOM filename.
- Production and demo deployment identifiers.

## Phase 7 — Transfer GitHub repository

Before initiating transfer:

- Confirm the buyer's exact GitHub user or organization.
- Confirm no conflicting repository name exists in the destination.
- Confirm the buyer is ready to accept the transfer promptly.
- Preserve the seller's legal archive and closing checksum record.
- Confirm whether issues, pull requests, releases, and Actions history should remain.

After transfer:

- Buyer accepts the transfer.
- Buyer verifies repository visibility and permissions.
- Buyer verifies default branch and branch protections.
- Buyer verifies Actions settings and dependency alerts.
- Seller remains a collaborator only for the agreed support period, then is removed.

## Phase 8 — Transfer or recreate Vercel projects

### Preferred project-transfer route

1. Buyer creates or identifies its destination Vercel team.
2. Transfer `weavestudio` and `weavestudio-demo` if Vercel permits the transfer.
3. Buyer verifies project settings, Git connection, aliases, deployment protection, and production branch.
4. Buyer triggers a deployment from the transferred repository.
5. Buyer confirms both production and demo routes.
6. Seller access is removed after support.

### Buyer-owned redeployment fallback

1. Buyer imports the transferred GitHub repository into buyer-owned Vercel.
2. Buyer selects the documented Vite/static configuration.
3. Buyer deploys the unmodified closing commit.
4. Buyer verifies `/`, `/app`, `/templates`, `/docs`, the guided demo, export, and invalid-route behavior.
5. Buyer creates buyer-owned aliases or a buyer-owned domain.
6. Existing seller deployments remain available only for the agreed inspection window, then are archived or removed as agreed.

## Phase 9 — Deliver the final package

Deliver through the agreed secure route:

- Acquisition ZIP.
- `PACKAGE_MANIFEST.json`.
- CycloneDX SBOM.
- `SHA256SUMS.txt`.
- `RELEASE_SUMMARY.md`.
- Signed agreement and schedules.
- Transfer checklist.
- Support contact and expiration date.

Do not send credentials or personal account recovery information in the package.

## Phase 10 — Buyer inspection

The buyer should test the unmodified closing commit and package against the signed acceptance criteria.

A valid defect notice should identify:

- The exact failed criterion.
- Environment and commands used.
- Relevant logs or screenshots.
- Whether the closing commit was modified.
- A reasonable opportunity for the seller to reproduce or correct a seller-controlled transfer defect.

The following are not acceptance defects unless expressly written into the agreement:

- A request for new features.
- A request for different design or product strategy.
- A buyer-specific integration.
- Commercial underperformance.
- A third-party service or dependency change after closing.
- A failure introduced by buyer modification.

## Phase 11 — Acceptance and payment release

After acceptance:

1. Buyer confirms acceptance through the escrow provider.
2. Escrow releases funds.
3. Seller saves the closing statement and payment record.
4. Seller issues a simple receipt if requested.
5. The limited support period begins or continues as defined in the agreement.

## Phase 12 — Post-close cleanup

After the support period:

- Remove seller access from buyer repositories, Vercel teams, data rooms, and communication systems.
- Revoke temporary share links and source-review invitations.
- Confirm buyer control of production deployments.
- Preserve the signed agreement, schedules, escrow statement, closing evidence, and tax records.
- Keep only the archival copy permitted by the agreement.
- Update public portfolio language to `Acquired` or `Sold` only if permitted by the announcement terms.
- Do not distribute or commercially reuse transferred exclusive source.

## Abort conditions

Pause or terminate the transaction when:

- Buyer identity or authority cannot be verified.
- Buyer requests credentials, personal-account transfer, remote access, or security codes.
- Buyer asks to bypass escrow after agreeing to it.
- Funding cannot be independently confirmed.
- Buyer introduces materially broader IP, indemnity, support, noncompete, or refund obligations without review.
- Buyer requests false invoices, false valuation statements, misrepresentation of revenue, or concealment of transaction facts.
- The final verification gate fails and the failure cannot be resolved before closing.
