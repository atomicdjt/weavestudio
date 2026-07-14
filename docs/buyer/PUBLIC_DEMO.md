# Public Demo Deployment

The preview deployment generated from the hardening branch is intentionally not production. Vercel reports it as Ready at:

`https://weavestudio-1vvzapcf0-atomicdjts-projects.vercel.app`

Anonymous verification on 2026-07-13 redirected to Vercel `/login` (`X-Matched-Path: /login`). The preview is therefore deployed but not anonymously accessible until the account-level preview protection setting is changed.

The public demo is served separately at `https://weavestudio-demo.vercel.app/` from the hardening branch. The original production project remains separate and was not changed for this demo release.

If a future Vercel preview is protected, an authorized account owner must open that project’s **Settings → Deployment Protection** and allow public preview access (or create a bypass/share link), then verify in an unsigned-out browser. Do not change the original production project or promote a preview merely to make it public.

After access is enabled, verify `/`, `/app`, `/templates`, `/docs`, and an unknown route; then share the preview URL with buyers.
