# WeaveStudio Commercial Platform Implementation Plan

**Goal:** Add optional cloud SaaS capabilities without weakening the verified local-first product.

**Architecture:** Keep the current portable `WorkspaceDocument` and local storage workflow intact. Add cloud services behind authenticated server endpoints, Postgres constraints/RLS, revision-aware sync, and configuration-driven entitlements. Commercial code begins only after explicit approval.

**Tech stack:** Existing Vite/React/TypeScript/React Flow client; proposed Postgres + Drizzle migrations; Supabase Auth/RLS initially; Stripe; transactional email; Sentry; optional PostHog.

## Global constraints

- Local mode requires no account and never silently uploads projects, prompts, outputs, keys, or telemetry.
- No plaintext stored API keys; volatile BYOK remains the default.
- Do not alter `master`, existing user data, or the current demo deployment during foundation work.
- Enforce cloud ownership, roles, sharing, billing, and admin access server-side.
- Use formal migrations, TDD, reviewable commits, and current-session test evidence.
- Do not expose managed AI until authentication, metering, spending limits, rate limits, and server secrets are complete.

## Proposed phases and acceptance gates

### Phase 1 — Cloud foundation

Create a server/API boundary, Postgres schema and migrations for users, profiles, workspaces, memberships, projects, workflow documents, revisions, snapshots, invitations, audit events, and preferences. Add email authentication, protected routes, account settings, data export/deletion, and explicit guest-to-account project selection. Acceptance: a guest can retain local work; a signed-in user can selectively upload/open a cloud project; ownership is proven by server policy; clean migrations and integration tests pass.

### Phase 2 — Project and workspace operations

Add project dashboard, search, sort, favorites, archive, collections/tags, loading/empty states, personal/team workspaces, invitations, and role enforcement using `PERMISSION-MATRIX.md`. Add debounced revision-aware saves, idempotency, local recovery draft, retry, and safe stale-write handling. Acceptance: two sessions cannot silently overwrite one another, and offline/local mode still works during cloud failure.

### Phase 3 — Sharing, comments, and history

Add comments, threads, resolution, activity events, read-only viewer, opaque revocable links, expiry, `noindex`, and version previews/restores that create a new revision. Start asynchronous collaboration first; evaluate realtime only after multi-session reliability and permission tests. Acceptance: unauthorized users cannot read/edit, restore never destroys later history, and share tokens are revocable.

### Phase 4 — AI platform

Extract provider adapters for OpenAI/Gemini with cancellation, timeout, retry, structured errors, output validation/history, preview-before-apply, and local volatile BYOK preservation. Add a managed proxy only after authentication, entitlement, rate limit, usage ledger, and spending controls. Acceptance: no provider request occurs before consent; no secret appears in client, export, analytics, or logs; failed calls remain recoverable.

### Phase 5 — Billing

Add configuration-driven Free/Professional/Team limits, Stripe Checkout, portal, webhook signature verification, idempotent event processing, and server-side entitlements. Use test mode first. Acceptance: only verified webhook state grants/revokes entitlements; cancellation and failure flows are tested; no client redirect changes billing state.

### Phase 6 — Activation and content

Add local-vs-account mode choice, explicit sync consent, resettable onboarding, commercial templates, project dashboard empty states, and limited transactional notifications. Acceptance: a new user reaches a meaningful local or cloud workflow without forced signup or intrusive dialogs.

### Phase 7 — API/admin/analytics

Add scoped revocable API tokens, limited project/template endpoints, signed webhooks, delivery logs, least-privilege admin operations, feature flags, and only the privacy-minimal events in `ANALYTICS-EVENT-CATALOG.md`. Acceptance: scopes, rate limits, audit trail, and redaction tests pass.

### Phase 8 — production hardening

Perform threat model, dependency/secret audit, CSP/header validation, migration rollback/recovery tests, error monitoring, backups/runbooks, large-workflow profiling, WCAG review, Chromium/Firefox/WebKit tests, and release package update. Acceptance: no unresolved critical security findings; documentation accurately matches verified behavior.

## Operating costs and lock-in

Use development/free tiers only during proof work. Before production, document actual provider prices, limits, data residency, export procedure, and replacement path. Postgres schema/migrations and export formats remain portable; Stripe, email, error monitoring, and analytics are replaceable integrations behind service interfaces.

## Decisions requiring approval before Phase 1

1. Supabase integrated stack versus Neon/Postgres plus discrete auth/realtime services.
2. Next.js migration versus a separate Vercel-compatible API service.
3. Cloud hosting/data region and privacy terms.
4. Email provider/domain configuration and transactional sender identity.
5. Stripe account, legal entity, tax obligations, plans, and pricing.
6. Whether realtime collaboration and stored AI keys are ever in scope.

## Test and rollback strategy

Add unit tests for migrations, permissions, serialization, conflicts, entitlements, provider adapters, and webhooks; integration tests against disposable Postgres; multi-user E2E; and browser coverage for local mode/offline failure. Every migration has an up/down or documented forward-fix strategy, backup verification, and staged deployment. Roll back feature flags before destructive schema action.

**Approval gate:** Do not begin Phase 1 until the user selects the services and approves this plan.

