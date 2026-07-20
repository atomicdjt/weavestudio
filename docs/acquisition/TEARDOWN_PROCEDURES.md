# WeaveStudio Teardown Procedures

This document outlines the steps required for the seller to cleanly remove all personal instances, tokens, and local artifacts after the successful transfer of WeaveStudio to the buyer.

## 1. Vercel Environment Teardown
Once the buyer has confirmed successful deployment on their own Vercel account, tear down the seller's deployments:
1. Log in to Vercel dashboard.
2. Navigate to `weavestudio-nine` project > Settings > Advanced.
3. Click **Delete Project** and confirm.
4. Navigate to `weavestudio-demo` project > Settings > Advanced.
5. Click **Delete Project** and confirm.

## 2. Token and Secrets Revocation
Ensure no seller-owned credentials remain active:
1. If any test AI provider API keys (OpenAI, Anthropic) were provisioned specifically for WeaveStudio testing, delete them from the provider's dashboard.
2. Revoke any GitHub Personal Access Tokens (PATs) that were scoped specifically to the WeaveStudio repository.
3. Remove the repository from any local CI/CD tools or secret managers.

## 3. Local Environment Reset
Delete the local repository and acquisition worktrees to ensure no confidential data is accidentally retained or mixed with future projects:

```powershell
# Remove the acquisition readiness worktree
git worktree remove acquisition-sale-readiness --force

# Delete the canonical repository clone
Remove-Item -Path "C:\Users\Atomic\Projects\weavestudio-canonical" -Recurse -Force

# Delete the local data room staging folder
Remove-Item -Path "C:\Users\Atomic\Projects\weavestudio-data-room" -Recurse -Force
```

## 4. Google Drive Data Room Deletion
1. Verify the buyer has downloaded all closing documents.
2. Delete the `WeaveStudio Data Room` folder from Google Drive.
3. Empty the Google Drive trash.

## 5. Domain and DNS Cleanup (If Applicable)
1. If any custom domains were routed to the Vercel projects, remove the DNS records from the domain registrar.
2. Ensure no subdomains point to deleted Vercel instances to prevent subdomain takeover.
