# Draft Software Asset Purchase and Intellectual-Property Assignment Agreement

> **Legal-review warning:** This document is a general starting template, not legal advice and not a signed agreement. All bracketed fields, representations, liability provisions, tax treatment, governing law, escrow terms, and intellectual-property language should be reviewed by qualified counsel for the actual parties and transaction.

This Software Asset Purchase and Intellectual-Property Assignment Agreement (the **Agreement**) is entered into as of **[Effective Date]** by and between:

- **[Seller Name]**, an individual located in [State/Country] (**Seller**); and
- **[Buyer Legal Name]**, a **[jurisdiction and entity type]** (**Buyer**).

Seller and Buyer are each a **Party** and together the **Parties**.

## 1. Transaction

Seller agrees to sell, assign, transfer, and deliver to Buyer, and Buyer agrees to purchase from Seller, the seller-owned WeaveStudio assets identified in **Schedule A — Included Assets** (the **Purchased Assets**) for the Purchase Price and on the terms of this Agreement.

This is an asset purchase. Buyer is not acquiring Seller's personal accounts, an ownership interest in a business entity, customers, revenue, employees, unrelated projects, or any asset identified in **Schedule B — Excluded Assets**.

## 2. Purchase price and escrow

1. **Purchase Price.** Buyer will pay Seller **USD $[Purchase Price]**.
2. **Escrow.** The Parties will use **[Escrow Provider]** under mutually approved transaction instructions consistent with this Agreement.
3. **Funding.** Buyer will fund 100% of the Purchase Price before Seller is required to transfer repository or deployment ownership.
4. **Fees.** Escrow and payment fees will be paid by **[Buyer / Seller / split as follows]**.
5. **Disbursement.** The escrow provider will release funds after Buyer accepts the Purchased Assets or the Inspection Period expires under the escrow instructions, subject to any valid unresolved rejection under Section 7.
6. **No informal payment evidence.** Seller is not required to rely on screenshots, pending-payment notices, checks, cryptocurrency promises, or communications not independently confirmed by the escrow provider.

## 3. Included and excluded assets

1. **Schedule A.** The Purchased Assets are those listed in `docs/buyer/ASSET_SCHEDULE.md`, as finalized and attached to this Agreement.
2. **Schedule B.** Excluded assets and retained rights are those listed in `docs/buyer/EXCLUDED_ASSETS.md`, as finalized and attached to this Agreement.
3. **Third-party materials.** Open-source and third-party software, services, trademarks, fonts, icons, and other materials remain owned by their respective owners and are governed by their applicable licenses and terms. Seller assigns only rights Seller owns and has authority to transfer.
4. **No implied assets.** No asset transfers unless expressly included in Schedule A.

## 4. Intellectual-property assignment

Effective only after Seller receives the Purchase Price through the agreed escrow process, Seller hereby assigns to Buyer all of Seller's transferable right, title, and interest in and to the original copyrightable software, documentation, original visual assets, original product copy, original templates, original branding, and other seller-owned intellectual property included in the Purchased Assets, including the right to modify, reproduce, distribute, sublicense, commercialize, and create derivative works, subject to third-party rights and licenses.

To the extent permitted by applicable law, Seller waives and agrees not to assert moral rights in the transferred original works, except for the limited attribution and archival rights expressly retained in Schedule B.

No patent, registered trademark, domain, regulatory approval, certification, or third-party intellectual-property right transfers unless expressly listed in Schedule A.

## 5. Closing conditions

Seller's obligation to complete delivery is conditioned on:

1. execution of this Agreement by both Parties;
2. confirmation from the escrow provider that the full Purchase Price has cleared;
3. Buyer providing accurate destination GitHub and hosting account information;
4. Buyer being able and ready to accept the repository and project transfers; and
5. no legal order prohibiting the transaction.

Buyer's obligation to release the Purchase Price is conditioned only on delivery and objective acceptance under this Agreement, not on future revenue, user adoption, financing, integration success, or product-market fit.

## 6. Delivery

After confirmation of cleared funding, Seller will deliver or transfer, as applicable:

1. access to or ownership of the agreed GitHub repository at the Closing Commit;
2. the final acquisition package and associated manifest, SBOM, release summary, and SHA-256 checksums;
3. the buyer and transfer documentation included in Schedule A;
4. the existing seller-controlled Vercel projects if transfer is selected and permitted, or reasonable assistance with buyer-owned redeployment;
5. original editable branding and demonstration assets specifically listed in Schedule A; and
6. the limited transition assistance described in `POST_CLOSE_SUPPORT_TERMS.md`.

The delivery record will identify:

- repository;
- authoritative branch;
- Closing Commit SHA;
- acquisition tag, if any;
- workflow-run identifier;
- acquisition ZIP filename and SHA-256;
- package manifest and SBOM filenames;
- production and demo deployment identifiers; and
- delivery timestamp in UTC.

## 7. Inspection and acceptance

1. **Inspection Period.** Buyer has **three business days** after material delivery is complete to inspect the Purchased Assets.
2. **Acceptance criteria.** Unless modified in an attached schedule, Buyer will determine whether:
   - the agreed repository and Closing Commit were delivered;
   - the material files listed in Schedule A are present;
   - `npm ci` completes in the agreed supported environment;
   - `npm run verify:buyer` completes against the unmodified Closing Commit;
   - the acquisition ZIP hash matches the delivered checksum;
   - Buyer can create a production build; and
   - Buyer can deploy the static application through the documented Vercel route or an equivalent supported static host.
3. **Acceptance.** Buyer accepts the Purchased Assets by written acceptance, authorizing escrow release, commercially using or materially modifying the source, or allowing the Inspection Period to expire without a valid rejection.
4. **Valid rejection.** A rejection must be sent in writing during the Inspection Period and identify the exact failed acceptance criterion, environment, commands, logs, and whether the Closing Commit was modified.
5. **Correction opportunity.** Seller will have **[two business days]** to reproduce and correct a seller-controlled delivery or verification defect, and the Inspection Period will resume for the corrected item.
6. **Non-defects.** Enhancement requests, design preferences, buyer-specific integrations, future commercial results, changes made by Buyer, and post-closing third-party changes are not acceptance defects unless expressly added to the acceptance schedule.

## 8. Transition support

Seller will provide the limited support stated in `docs/buyer/POST_CLOSE_SUPPORT_TERMS.md`, as attached or incorporated into this Agreement:

- five business days;
- no more than three total hours;
- transfer, setup, documented verification, and repository-orientation assistance only; and
- no obligation for new features, integrations, commercialization, ongoing maintenance, or support beyond the stated period.

Additional work requires a separate written agreement. Seller is not obligated to accept additional work.

## 9. Seller representations

Seller represents to Buyer, as of signing and closing, that:

1. Seller has authority to enter into this Agreement and transfer the seller-owned Purchased Assets.
2. To Seller's knowledge, Seller created or validly owns the original materials identified as seller-owned in Schedule A.
3. To Seller's knowledge, Seller has not granted another party a conflicting exclusive ownership interest in the seller-owned Purchased Assets.
4. Seller has disclosed the material known product limitations in the repository documentation and due-diligence materials.
5. Seller will not intentionally include passwords, private keys, API secrets, recovery codes, or unnecessary personal data in the final delivery package.
6. WeaveStudio is offered as a software asset without customers, revenue, subscriptions, employees, or operating-business liabilities unless expressly disclosed in writing.
7. Seller has not knowingly made a false claim of certification, regulatory approval, customer traction, revenue, patent protection, or guaranteed commercial performance in the transaction materials.

Except for the express representations in this Agreement, Seller makes no representation concerning patent clearance, trademark clearance, regulatory compliance, fitness for a regulated use, uninterrupted operation, absence of every possible vulnerability or infringement claim, or future commercial results.

## 10. Buyer representations

Buyer represents that:

1. Buyer has authority and financial capacity to enter into and perform this Agreement.
2. The person signing for Buyer is authorized to bind Buyer.
3. Buyer has independently evaluated the Purchased Assets, documentation, limitations, third-party dependencies, and proposed use.
4. Buyer will comply with applicable third-party licenses and provider terms.
5. Buyer will not use the transaction to obtain Seller's personal accounts, credentials, unrelated source code, or information not included in Schedule A.
6. Buyer is not relying on a promise of revenue, financing, user adoption, regulatory approval, or business success not expressly written in this Agreement.

## 11. Assumption of liabilities

Buyer assumes no Seller liability except obligations arising after closing from Buyer's ownership, modification, operation, distribution, licensing, hosting, marketing, or commercialization of the Purchased Assets.

Seller retains liabilities arising from Seller's conduct before closing, except that Buyer accepts the documented condition and limitations of the Purchased Assets subject to the express acceptance criteria and representations in this Agreement.

## 12. As-is condition and disclaimers

Except for the express representations and acceptance criteria in this Agreement, the Purchased Assets are transferred **as is**, **as available**, and in their documented condition at the Closing Commit.

Seller disclaims implied warranties to the maximum extent permitted by applicable law, including implied warranties of merchantability, fitness for a particular purpose, noninfringement, uninterrupted operation, security, and future commercial success.

This disclaimer does not eliminate any express obligation in this Agreement or any liability that applicable law does not permit the Parties to disclaim.

## 13. Limitation of liability

> **Counsel-review required:** Liability caps and exclusions vary materially by jurisdiction and transaction.

Except for fraud, willful misconduct, breach of confidentiality, unauthorized use before closing, or obligations that applicable law does not permit to be limited:

1. neither Party will be liable for indirect, incidental, special, punitive, exemplary, or consequential damages, or lost profits, revenue, goodwill, or business opportunity; and
2. each Party's aggregate liability arising from this Agreement will not exceed the Purchase Price actually paid.

## 14. Taxes

Each Party is responsible for its own income, legal, accounting, and advisory costs. **[Buyer/Seller]** will be responsible for any sales, use, transfer, or similar transaction tax legally imposed on the transfer, excluding taxes based on the other Party's net income.

The Parties will reasonably cooperate on tax forms and transaction records. Neither Party is providing tax advice to the other.

## 15. Confidentiality and announcements

The Parties will comply with **[the NDA dated ___ / the confidentiality terms below]**.

Neither Party may publicly announce the transaction, price, or the other Party's identity without prior written approval, except when legally required. After closing, Seller may identify himself as WeaveStudio's original creator and state that the product was sold or acquired only to the extent permitted by Schedule B and any agreed announcement language.

## 16. Further assurances

After closing, each Party will execute reasonable additional documents and take reasonable actions necessary to confirm the transfers expressly required by this Agreement, provided those actions do not materially expand that Party's obligations or require uncompensated services beyond the agreed support terms.

## 17. Records and access

Seller may retain a private archival copy solely for legal, tax, evidentiary, and record-retention purposes. Seller will not distribute, sublicense, commercially reuse, or relaunch the transferred exclusive source after closing.

Buyer will remove Seller from buyer-owned repositories, hosting teams, and data rooms after the agreed support period unless continued access is agreed in writing.

## 18. General terms

1. **Governing law.** This Agreement is governed by the laws of **[State/Country]**, without regard to conflict-of-law rules.
2. **Dispute forum.** The Parties agree to **[exclusive courts / arbitration process]** in **[location]**.
3. **Notices.** Formal notices must be sent to the addresses and emails in the signature block.
4. **Assignment.** Buyer may assign this Agreement to an affiliate or successor that assumes all obligations. Any other assignment requires written consent. Seller may assign the right to receive payment but not performance obligations without Buyer consent.
5. **Entire agreement.** This Agreement and attached schedules are the complete agreement concerning the transaction and supersede prior proposals and discussions.
6. **Order of precedence.** The signed Agreement controls over schedules; finalized attached schedules control over repository working copies.
7. **Amendments and waivers.** Amendments and waivers must be in a writing signed by both Parties.
8. **Severability.** An unenforceable provision will be modified to the minimum extent necessary, and the remainder will continue.
9. **Counterparts and electronic signatures.** This Agreement may be signed electronically and in counterparts.
10. **Independent parties.** The Parties are independent contractors. No partnership, employment, agency, fiduciary, or joint venture is created.
11. **No third-party beneficiaries.** No person other than the Parties and permitted successors has rights under this Agreement.

## 19. Schedules

- **Schedule A:** Included Assets — finalized version of `docs/buyer/ASSET_SCHEDULE.md`.
- **Schedule B:** Excluded Assets and Retained Rights — finalized version of `docs/buyer/EXCLUDED_ASSETS.md`.
- **Schedule C:** Closing Commit, Release Evidence, and Delivery Record.
- **Schedule D:** Post-Close Support Terms — finalized version of `docs/buyer/POST_CLOSE_SUPPORT_TERMS.md`.
- **Schedule E:** Any transaction-specific acceptance criteria or exceptions.

## Signatures

### Seller

**[Seller Name]**  
Signature: ______________________________  
Date: __________________  
Email: **[Seller Email]**  
Notice address: **[Seller Notice Address]**

### Buyer

**[Buyer Legal Name]**  
By: ______________________________  
Name: **[Name]**  
Title: **[Title]**  
Date: __________________  
Email: **[Buyer Email]**  
Notice address: **[Buyer Notice Address]**
