# Public Demo Deployment

The preview deployment generated from the hardening branch is intentionally not production. Vercel reports it as Ready at:

`https://weavestudio-iwhgi2r0x-atomicdjts-projects.vercel.app`

The team currently applies Vercel Deployment Protection to preview URLs. To share this demo publicly without touching production, an authorized account owner must open the Vercel project **weavestudio**, open **Settings → Deployment Protection**, and allow public access for preview deployments (or create a bypass/share link), then verify the URL in an unsigned-out browser. Do not promote the deployment and do not modify `master`.

After access is enabled, verify `/`, `/app`, `/templates`, `/docs`, and an unknown route; then share the preview URL with buyers.
