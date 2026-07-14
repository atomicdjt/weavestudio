# WeaveStudio Commercial Architecture Audit

**Audit date:** 2026-07-14  
**Verified baseline:** `a6f8d97a421e433bfce124c0734f117d4b41f7fa`  
**Current public demo:** https://weavestudio-demo.vercel.app  
**Scope:** Phase 0 architecture and acquisition readiness only. No commercial application code was added.

## Executive finding

WeaveStudio is a functional Vite/React single-page application with a mature local-first workflow editor and a defensible safety boundary. It is transferable as a software asset today. It is **not** yet a SaaS platform: there is no server, database, authentication, cloud persistence, billing, collaboration, analytics, or managed AI proxy. Those absences are product facts, not defects in local mode.

The correct commercialization approach is an additive cloud mode. Local mode must remain usable without registration, network access, or cloud persistence. A signed-in user must explicitly choose which local projects to upload.

## Current architecture

| Area | Current state | Commercial implication |
| --- | --- | --- |
| Runtime | Vite 8, React 19, TypeScript 6, Tailwind 4 | Suitable UI foundation; no server runtime exists. |
| Routing | React Router browser routes | Add server/API routes through a separate backend or framework migration; preserve SPA routes. |
| Canvas | `@xyflow/react`, controlled parent document state | Retain existing `WorkspaceDocument` schema and add revision metadata for cloud documents. |
| Persistence | Browser `localStorage`, owned-key backup/restore and migration helpers | Strong guest/local mode; cloud sync must never replace browser recovery without confirmation. |
| AI | Direct OpenAI/Gemini BYOK in browser, explicit consent, volatile key state | Keep BYOK. Managed AI requires a server proxy, authentication, metering, limits, and provider secrets. |
| Export | JSON, Markdown, PDF and full local backup | Good portability baseline; add cloud-account export separately. |
| Tests | Vitest plus Playwright desktop/mobile | Good foundation; commercial phase needs database, authorization, webhook, and multi-session test layers. |
| Deployment | Static Vercel deployment | No server database or secure webhook endpoint currently deployed. |
| Observability | Error boundary and user-facing recovery messaging | Add server logs, error monitoring, health checks, and redaction only with cloud mode. |

## Security and migration posture

Strengths: explicit AI consent before provider dispatch; volatile API-key handling; scoped owned-key backup/clear; corrupt-import protection; accessible custom confirmation dialogs; undo/redo and recovery checkpoints; no bundled service secrets.

Risks before cloud mode: any client-side ownership claim is not authorization; direct BYOK requests are subject to provider/browser constraints; local storage is neither encrypted nor durable; static hosting cannot verify Stripe webhooks or protect cloud data.

Migration rule: retain `WorkspaceDocument` as the portable canonical payload. Cloud records store a schema version, workspace/project identifiers, owner/workspace relationship, monotonically increasing revision, encrypted-at-rest provider defaults where applicable, and immutable version snapshots. Never auto-upload a guest project after sign-in.

## Recommended target architecture

| Concern | Recommendation | Rationale |
| --- | --- | --- |
| Application/API | Next.js application shell or a small Vercel-compatible API service beside the existing client | Secure server actions/endpoints are required for auth, database access, Stripe, and managed AI. A migration should be incremental behind an API boundary. |
| Database | PostgreSQL with Drizzle ORM and formal SQL migrations | Portable schema, buyer familiarity, strong constraints, and no ORM lock-in of the data model. |
| Initial hosted database/auth/realtime | Supabase, using Postgres, Auth, RLS, Storage only if required, and Realtime only after asynchronous collaboration is proven | Fast operational start while retaining a portable Postgres schema and export path. |
| Alternative | Neon Postgres + Better Auth/Auth.js + a separate realtime provider | More composable and portable operationally, but more assembly and support burden. |
| Authentication | Supabase Auth with email magic link/password recovery and optional Google/GitHub OAuth | Supports secure sessions and email flows; do not add every OAuth provider at launch. |
| Billing | Stripe Checkout, Customer Portal, server-side webhook verification, configuration-driven entitlements | Established buyer familiarity; payment redirects never grant access. |
| Email | Resend or Postmark for transactional mail | Keep messages limited to auth, invitations, sharing, and billing events; no marketing system in scope. |
| Errors | Sentry with PII and secret scrubbing | Supports client/server diagnosis without project-content collection. |
| Product analytics | PostHog only after explicit cloud/analytics consent | Track coarse activation events, never workflow content, API keys, prompts, or outputs. |

## Service alternatives and decision points

1. **Supabase vs composable Postgres stack:** approve Supabase if speed and integrated RLS/auth are more valuable than avoiding a single vendor; choose Neon plus discrete services if maximum provider substitution is preferred.
2. **Framework migration:** approve Next.js only when server work begins. Do not force a Vite rewrite solely for Phase 0; preserve the proven local client while APIs are introduced.
3. **Realtime:** start with revision-aware asynchronous collaboration, comments, activity, and conflict copies. Approve realtime edits only after multi-session reliability tests.
4. **Stored AI keys:** do not implement by default. Retain volatile BYOK unless server-side encryption, deletion, rotation, audit, and redaction are approved and tested.
5. **Analytics:** local mode remains telemetry-free by default. Any cloud analytics must be documented and opt-out capable where required.

## Data boundary and access model

- **Local mode:** no account; document, prompt, AI output, and API key remain browser-local unless the user exports or confirms a provider request.
- **Cloud mode:** authenticated users explicitly create/upload cloud projects. Server-side policy derives every tenant and role from session claims and membership records, never request IDs.
- **Roles:** owner, administrator, editor, commenter, viewer. Permission enforcement lives in database/RLS and server endpoints.
- **Sharing:** opaque cryptographically random tokens, explicit scope/expiry/revocation, read-only by default, `noindex`, and conservative cache headers.
- **Synchronization:** revision number plus idempotency key; rejected stale write offers reload, safe copy, or merge workflow. Preserve a local recovery draft before resolution.

## Audit conclusions for a buyer

The current asset is strongest as a local-first workflow product and a commercial foundation. Its commercial roadmap is credible but unimplemented. A buyer should budget for server operations, data-processing terms, email/domain configuration, billing configuration, security review, and ongoing support before exposing cloud mode commercially.

