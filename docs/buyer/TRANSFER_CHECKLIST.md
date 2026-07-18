# Buyer Transfer Checklist

## Ten-minute technical verification

1. Clone the repository and run `npm ci`.
2. Run `npm run verify:buyer`; it runs type, lint, unit, browser, build, and package checks.
3. Start `npm run dev`, open the printed local URL, then test `/`, `/app`, `/templates`, `/docs`, and an invalid route.
4. Open the guided demo, edit source material, validate, generate, export a project JSON, and re-import it as a new workspace.
5. Open Data portability and confirm full backup export/restore is available.

## Ownership transfer

- Transfer the GitHub repository and confirm Actions secrets are unnecessary for the shipped local-first app.
- In Vercel, transfer the **weavestudio** project or reconnect the buyer-owned repository. Preview deployments are sufficient; do not promote an old deployment to production.
- Review **Settings → Deployment Protection**. Preview protection is account-controlled and currently blocks anonymous demonstration; create a buyer-safe bypass/share link or allow public preview access only when desired.
- Configure any buyer-owned domain separately. This package does not claim ownership of a domain.

## Day-one operations

- Use `npm run verify:buyer` before a release and retain the resulting ZIP hash.
- Export browser-local work before clearing browser data, changing devices, or testing a migration.
- Keep provider keys in a password manager; WeaveStudio intentionally does not persist them.
- Review `docs/buyer/FEATURE_REALITY.md` before adding customer, AI proxy, collaboration, or compliance claims.

## Rollback

Deploy a prior verified commit as a new Vercel preview, validate it, then update the buyer-owned production alias only after approval. Browser-local workspace data is not changed by a static deployment rollback.
