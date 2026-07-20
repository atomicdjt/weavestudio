# WeaveStudio Post-Close Support Terms

> Draft commercial terms for buyer diligence and legal review. The signed purchase agreement controls if it differs from this document.

## Included transition support

Unless otherwise agreed in writing, the acquisition includes:

- A support window beginning when the buyer receives the transferred repository and ending five business days later.
- Up to three total hours of seller time during that window.
- Asynchronous email support and, when reasonably necessary, one scheduled screen-sharing session.
- Reasonable assistance with:
  - Accepting the GitHub repository transfer.
  - Identifying the authoritative closing commit and release artifacts.
  - Running the documented install, verification, build, and preview commands.
  - Understanding the repository structure and buyer documentation.
  - Transferring the existing Vercel projects or reconnecting the repository to buyer-owned Vercel projects.
  - Verifying the documented production and public-demo routes after transfer.
  - Locating the package manifest, SBOM, checksums, known limitations, and feature-reality matrix.

## Response expectations

- Support is provided on a commercially reasonable, best-effort basis during the stated support window.
- The seller is not required to remain continuously available or provide emergency, on-call, weekend, or holiday coverage.
- The parties should consolidate questions where practical so the limited support time is used efficiently.
- Time spent in meetings, screen sharing, investigation, written responses, or buyer-requested reproduction counts toward the three-hour limit.

## Excluded work

Included support does not cover:

- New features, redesigns, roadmap implementation, or buyer-specific product changes.
- Authentication, cloud synchronization, collaboration, billing, database, server, AI proxy, analytics, or third-party integration development.
- Migration of buyer or customer data.
- Infrastructure beyond the documented static Vercel deployment path.
- Security audits, penetration testing, compliance assessments, legal review, patent review, trademark clearance, tax advice, or regulatory analysis.
- Training buyer employees beyond the transfer walkthrough and existing documentation.
- Support for modified code, dependencies, hosting, configuration, or environments changed by the buyer after delivery.
- Commercialization, marketing, sales, customer support, fundraising, or revenue-generation services.

## Acceptance defects versus enhancement requests

A reported issue qualifies for included transfer assistance only when it concerns a failure of the delivered asset to meet an explicit acceptance criterion in the signed agreement, such as:

- Missing agreed files.
- Mismatched release checksum.
- Inability to access the transferred repository due to a seller-controlled transfer error.
- Failure of the documented buyer-verification command in the agreed supported environment when run against the unmodified closing commit.

A request is an enhancement—not an acceptance defect—when it asks for behavior, integrations, compatibility, design, or commercial results beyond the documented product and signed acceptance criteria.

## Additional services

Any work beyond the included window, time limit, or scope requires a separate written agreement defining deliverables, schedule, fees, acceptance, and intellectual-property treatment. The seller has no obligation to accept additional work.

## End of access

At the end of the support period, the buyer should remove the seller from buyer-owned repositories, hosting teams, data rooms, and other accounts unless continued access is expressly agreed in writing.
