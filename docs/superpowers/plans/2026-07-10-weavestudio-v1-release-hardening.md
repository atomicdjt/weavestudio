# WeaveStudio v1.0.0 Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare, validate, review, and publish the controlled proprietary WeaveStudio v1.0.0 release without changing its independently QA-verified product behavior.

**Architecture:** Keep WeaveStudio a static, local-first React/Vite application. This release changes repository hygiene, CI, ownership documentation, and release presentation only; it must not add services, storage, accounts, analytics, or unconsented provider activity. Execute all changes in the isolated `release/v1.0.0-hardening` worktree, then merge only with explicit owner approval.

**Tech Stack:** React 19, TypeScript 6 project references, Vite 8, Vitest 4, Oxlint, GitHub Actions, Vercel static hosting.

## Global Constraints

- Authoritative branch: `master`; production-tested base commit: `742a017388547e1e89b996c8d01bea9e79f9a55d`.
- Preserve `v1.0.0-rc.1`, `weavestudio-qa-pass-20260710`, legacy `main`, all existing deployments, and the private-repository setting.
- Do not merge `main`; selectively reimplement only the audit-approved ownership notice, standalone typecheck script, and CI changes.
- Do not expose, commit, package, or print secrets or environment values. Stop for history-remediation direction if a secret is found.
- Do not change verified workflow behavior unless a release-blocking defect is reproduced and covered by a failing regression test first.
- Keep the golden path local-first: no backend, database, authentication, analytics, cloud storage, or required external API.
- Optional provider requests must remain consent-gated; localStorage remains unencrypted and requires human review of generated output.
- Do not push, merge, tag `v1.0.0`, or publish the GitHub release without the owner approvals specified in Tasks 8 and 10.

---

## Audited File Map

| Path | Release responsibility |
| --- | --- |
| `.gitignore` | Prevent internal evidence, temporary test outputs, local Vercel metadata, build output, dependencies, and environment files from recurring in Git. |
| `WeaveStudio-current-safe-checkpoint.zip`, `ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.json`, `ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.md` | Internal tracked artifacts to copy to the external QA archive, then remove in an ordinary forward commit. |
| `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Proprietary package metadata and a standalone `tsc -b` typecheck command aligned with TypeScript project references. |
| `.github/workflows/ci.yml` | Required GitHub validation for test, lint, typecheck, and build on `master` pull requests, `master` pushes, and manual dispatch. |
| `LICENSE.md`, `README.md`, `docs/QA-SUMMARY.md`, `RELEASE_VERIFICATION.md`, `KNOWN_LIMITATIONS.md`, `CHANGELOG.md` | Proprietary ownership, release presentation, verified status, transparent limitations, and v1.0.0 notes. |
| `docs/screenshots/*.png` | Three to five reviewed, production-representative product screenshots used by the README. |
| `docs/FINAL-RELEASE-REPORT-v1.0.0.md` | Post-merge release record, completed only with verified production and GitHub-release facts. |
| `vercel.json` | Existing SPA-refresh rewrite; inspect only unless deployment verification exposes a release-blocking defect. |

## Task 0: Record the audited release-hardening plan

**Files:**
- Create: `docs/superpowers/plans/2026-07-10-weavestudio-v1-release-hardening.md`

- [ ] **Step 1: Validate the plan artifact.**

  Run: `git diff --check; rg -n -i 'T(O)DO|T(B)D|impl(e)ment later|fill in det(a)ils|add appropriate error h(andling)|write tests for the a(bove)|similar to t(ask)' docs/superpowers/plans/2026-07-10-weavestudio-v1-release-hardening.md`

  Expected: no whitespace errors and no placeholder matches.

- [ ] **Step 2: Commit the plan before release implementation.**

  Run: `git add docs/superpowers/plans/2026-07-10-weavestudio-v1-release-hardening.md; git commit -m 'docs: add WeaveStudio v1.0.0 release hardening plan'`

  Expected: the audit plan is reviewable on the release branch and no application behavior changes.

## Legacy `main` Decision Record

| Commit | Useful change | Already on `master` | Action | Reason |
| --- | --- | --- | --- | --- |
| `c64f778c3cb7dd21792d1465e0879447b5f4570e` | Adds a concise All Rights Reserved ownership notice. | No | Reimplement | The wording is compatible after adding the owner-required access, commercial-agreement, and non-contract clarifications. |
| `f6a89f0b4427120ee4f89141df6ea64110923248` | Adds `typecheck: tsc -b`; temporarily changed React DOM type version. | Partial | Selectively port | `tsc -b` is correct for the current project references; master already has compatible React 19 type packages, so do not copy the stale dependency delta. |
| `5ae60e51aa28c234ac25b40543313f6ee3479b5b` | Adds initial CI. | No | Reimplement | The legacy file omits tests, runs Node 22, lacks required triggers/concurrency, and is too broad on branch scope. |
| `46faad12795443d0308f8fd1d198e857075844f9` | Reverts React DOM types to `^19.2.3`. | Yes | Omit | Master already uses `@types/react-dom` `^19.2.3`, which is compatible with React 19 and the current lockfile. |

## Task 1: Preserve internal evidence and harden ignores

**Files:**
- Modify: `.gitignore`
- Delete: `WeaveStudio-current-safe-checkpoint.zip`
- Delete: `ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.json`
- Delete: `ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.md`
- External copy only: `C:\Users\Atomic\Desktop\WeaveStudio-QA-Evidence-20260710\Repository-Archive\`

- [ ] **Step 1: Re-run the high-confidence secret scan before copying artifacts.**

  Run: `git grep -Il -E 'github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY' -- . ':!*.zip'`

  Expected: no output. If output is nonempty, stop and report file/category without printing a value.

- [ ] **Step 2: Create the external archive and copy the three tracked internal artifacts.**

  Run: `New-Item -ItemType Directory -Force -LiteralPath 'C:\Users\Atomic\Desktop\WeaveStudio-QA-Evidence-20260710\Repository-Archive'; Copy-Item -LiteralPath @('WeaveStudio-current-safe-checkpoint.zip','ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.json','ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.md') -Destination 'C:\Users\Atomic\Desktop\WeaveStudio-QA-Evidence-20260710\Repository-Archive' -Force`

  Expected: exactly three external copies; the repository copies remain until the next step.

- [ ] **Step 3: Verify external evidence copies are present and nonzero.**

  Run: `Get-ChildItem -LiteralPath 'C:\Users\Atomic\Desktop\WeaveStudio-QA-Evidence-20260710\Repository-Archive' -File | Where-Object Name -in 'WeaveStudio-current-safe-checkpoint.zip','ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.json','ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.md' | Select-Object Name,Length`

  Expected: each named file exists with `Length` greater than zero.

- [ ] **Step 4: Add narrow ignore rules and remove only the repository copies.**

  Add these lines to `.gitignore`:

  ```gitignore
  WeaveStudio-current-safe-checkpoint.zip
  WeaveStudio-backup-*.zip
  *-backup-*.zip
  *-checkpoint-*.zip
  ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.*
  WEAVESTUDIO-*-QA-REPORT-*.md
  WEAVESTUDIO-PROD-SCREENSHOTS/
  playwright-report/
  test-results/
  coverage/
  .env
  .env.*
  !.env.example
  .vercel/
  ```

  Run: `Remove-Item -LiteralPath 'WeaveStudio-current-safe-checkpoint.zip','ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.json','ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.md'`

  Expected: only the three tracked artifacts are deleted; no blanket `*.zip` rule is added.

- [ ] **Step 5: Verify ignores and commit the cleanup.**

  Run: `git check-ignore -v node_modules dist .env .vercel playwright-report test-results coverage WeaveStudio-current-safe-checkpoint.zip WeaveStudio-backup-20260710.zip; git check-ignore -q intended-release-package.zip; if ($LASTEXITCODE -eq 0) { throw 'Intentional release package was incorrectly ignored.' }`

  Expected: all listed internal/local paths except `intended-release-package.zip` are ignored; the intentional package path has no matching rule.

  Run: `git add .gitignore; git rm -- 'WeaveStudio-current-safe-checkpoint.zip' 'ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.json' 'ANTIGRAVITY_PROJECT_CONTEXT_EXPORT.md'; git commit -m 'chore: remove internal artifacts and harden repository ignores'`

  Expected: one forward-only cleanup commit with no history rewrite.

## Task 2: Add standalone typecheck and complete CI

**Files:**
- Modify: `package.json`
- Modify only if npm changes it: `package-lock.json`
- Create: `.github/workflows/ci.yml`
- Inspect: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`

- [ ] **Step 1: Confirm the existing project-reference checker is the correct no-output command.**

  Run: `npx tsc -b --pretty false`

  Expected: exit code 0 and no application build output. `tsBuildInfoFile` remains under ignored `node_modules/.tmp` and both referenced configurations retain `noEmit: true`.

- [ ] **Step 2: Add the minimal script through npm metadata tooling.**

  Run: `npm pkg set scripts.typecheck='tsc -b'`

  Expected `package.json` scripts contain exactly `"typecheck": "tsc -b"`; package metadata remains private and no Git tag is created.

- [ ] **Step 3: Add the release CI workflow.**

  Create `.github/workflows/ci.yml` with this complete contract:

  ```yaml
  name: WeaveStudio CI

  on:
    push:
      branches: [master]
    pull_request:
      branches: [master]
    workflow_dispatch:

  permissions:
    contents: read

  concurrency:
    group: weavestudio-ci-${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true

  jobs:
    validate:
      runs-on: ubuntu-latest
      timeout-minutes: 10
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 24.x
            cache: npm
        - run: npm ci
        - run: npm test
        - run: npm run lint
        - run: npm run typecheck
        - run: npm run build
  ```

  Expected: CI does not run on legacy `main`, includes tests, and uses only `contents: read` permissions.

- [ ] **Step 4: Perform the CI command sequence from a clean install.**

  Run: `npm ci; npm test; npm run lint; npm run typecheck; npm run build`

  Expected: 33 tests pass, zero lint errors/warnings, zero type errors, and a successful Vite production build.

- [ ] **Step 5: Commit CI changes.**

  Run: `git add package.json package-lock.json .github/workflows/ci.yml; git commit -m 'ci: add complete WeaveStudio release validation'`

  Expected: only package/lock changes produced by the npm command plus the CI workflow are included.

## Task 3: Establish proprietary ownership

**Files:**
- Create: `LICENSE.md`
- Modify: `package.json`
- Modify only if npm changes it: `package-lock.json`
- Modify: `README.md`, `docs/product/COMMERCIAL-PACKAGING-PLAN.md`
- Inspect: all tracked Markdown and TypeScript/TSX copy for license claims

- [ ] **Step 1: Write the proprietary notice.**

  Create `LICENSE.md` containing: copyright © 2026 David Turner; all rights reserved; no permission to copy, modify, distribute, sublicense, sell, publish, or commercially use source/IP without written authorization; private-repository access does not grant a license; commercial licensing/acquisition requires a separate written agreement; and a statement that the notice is not a substitute for a separately negotiated commercial agreement.

  Expected: no MIT, Apache, GPL, BSD, Creative Commons, or open-source grant appears.

- [ ] **Step 2: Set npm metadata without creating a tag.**

  Run: `npm pkg set version=1.0.0 license=UNLICENSED private=true`

  Expected: `package.json` contains `version: 1.0.0`, `license: UNLICENSED`, and `private: true`; package-lock root metadata is synchronized if npm updates it; no tag is created.

- [ ] **Step 3: Replace the README placeholder and commercial-plan placeholder.**

  Replace the README license placeholder with `[Proprietary — All Rights Reserved](LICENSE.md)`. Replace the commercial-plan placeholder with the same ownership position, retaining any accurate acquisition guidance.

  Expected: no tracked file describes WeaveStudio as open source, public domain, MIT, freely redistributable, or license-pending.

- [ ] **Step 4: Scan and commit.**

  Run: `git grep -n -i -E 'license placeholder|MIT License|Apache License|GNU (GENERAL|GPL)|BSD License|Creative Commons|public domain|freely redistributable'`

  Expected: no output.

  Run: `git add LICENSE.md package.json package-lock.json README.md docs/product/COMMERCIAL-PACKAGING-PLAN.md; git commit -m 'docs: establish proprietary WeaveStudio licensing'`

## Task 4: Prepare release documentation and screenshots

**Files:**
- Create: `docs/screenshots/weavestudio-home.png`, `docs/screenshots/weavestudio-workspace.png`, `docs/screenshots/weavestudio-templates.png`, `docs/screenshots/weavestudio-deliverable.png`, `docs/screenshots/weavestudio-exports.png`
- Modify: `README.md`, `docs/QA-SUMMARY.md`, `RELEASE_VERIFICATION.md`, `KNOWN_LIMITATIONS.md`, `CHANGELOG.md`
- Inspect: `src/pages/LandingPage.tsx`, `src/pages/WorkspacePage.tsx`, `src/pages/TemplatesGallery.tsx`, `src/pages/ExportsCenter.tsx`, `src/pages/DocsPage.tsx`

- [ ] **Step 1: Establish the screenshot source.**

  Inspect `C:\Users\Atomic\Desktop\WEAVESTUDIO-PROD-SCREENSHOTS`. The audit found the directory exists but contains zero files, so capture fresh screenshots from the verified production application in a clean browser context at `/`, `/app`, `/templates`, the deliverable view, and `/exports`. Do not use local file paths, account chrome, tokens, unrelated tabs, or QA-only controls in the captures.

  Expected: each image is visibly representative of the production UI and exposes no personal or secret information.

- [ ] **Step 2: Copy only approved product captures to the repository.**

  Store the reviewed images under `docs/screenshots/` using the five exact filenames listed above. Prefer the strongest three to five; omit any capture that does not pass the privacy review.

  Expected: all README image links resolve inside the repository and retain real, unfalsified product UI.

- [ ] **Step 3: Rewrite README around verified product facts.**

  Include, in order: title and concise positioning; `https://weavestudio-nine.vercel.app/`; v1.0.0 status; hero image; problem/promise; golden path; implemented capabilities; product tour; local-first architecture; consent-gated optional-AI boundary; development/verification commands; export/persistence; limitations; privacy/human review; `LICENSE.md`; and production deployment information.

  Use the exact promise “Turn fragmented information into a structured, reusable deliverable workflow.” State that the golden path is browser-local and that optional live provider requests occur only after explicit consent. State that browser localStorage is not encrypted or durable cloud storage and generated work requires human review.

- [ ] **Step 4: Update release documents.**

  Create `docs/QA-SUMMARY.md` with: 33 automated tests; clean lint; successful build; independent remediation QA PASS; independent production smoke-test PRODUCTION PASS; verified production URL and commit; major tested defect classes; and expected limitations, without embedding raw QA evidence.

  Update `RELEASE_VERIFICATION.md` to remove stale “Simulate AI” and absolute no-live-call language, retain the actual consent-gated optional-provider boundary, and describe the verified checks without “production ready” marketing claims. Update `KNOWN_LIMITATIONS.md` to use current “Process Check” terminology and retain storage, review, export, single-user, and desktop-first limitations. Move all current CHANGELOG release notes under `## [1.0.0] - 2026-07-10` and leave an empty `## [Unreleased]` above it. Remove already-fixed defects from active limitation lists.

- [ ] **Step 5: Validate rendered documentation and commit.**

  Run: `npm run build; Start-Process -FilePath npm -ArgumentList 'run','preview','--','--host','127.0.0.1','--port','4173' -WorkingDirectory (Get-Location) -WindowStyle Hidden`

  Expected: production preview starts and all README screenshot paths return HTTP 200.

  Run: `git add README.md docs/screenshots docs/QA-SUMMARY.md RELEASE_VERIFICATION.md KNOWN_LIMITATIONS.md CHANGELOG.md; git commit -m 'docs: prepare WeaveStudio v1.0.0 presentation'`

## Task 5: Final local release verification

**Files:**
- Inspect only: all changed files, `vercel.json`, `package.json`, test sources, and `docs/screenshots/`

- [ ] **Step 1: Install and run the complete release command set.**

  Run: `npm ci; npm test; npm run lint; npm run typecheck; npm run build`

  Expected: every test runs and passes (33 expected unless a test is added with a documented reason), lint is clean, typecheck is clean, and build succeeds.

- [ ] **Step 2: Test the production preview in an isolated browser context.**

  Run: `Start-Process -FilePath npm -ArgumentList 'run','preview','--','--host','127.0.0.1','--port','4173' -WorkingDirectory (Get-Location) -WindowStyle Hidden`

  Verify: homepage; exactly one guided-demo workspace; source edit/out-of-sync state; source application preserving unrelated node edits and viewport; Process Check completion; deliverable generation; manual-draft overwrite confirmation; coherent snapshots; Markdown/PDF/Project JSON export; JSON import round trip; no duplicate headings/placeholders; no provider call in the normal workflow; SPA direct-route refresh; and README screenshot rendering.

  Expected: all checks pass with no unexpected browser-console errors or failed network requests.

- [ ] **Step 3: Verify release diff hygiene.**

  Run: `git diff --check; git status --short; git diff --stat master...HEAD; git diff --name-only master...HEAD`

  Expected: no whitespace errors; only intended source/docs/config files; no `dist`, `node_modules`, `.env`, `.vercel`, QA exports, backup archives, raw artifacts, or browser-test output staged.

## Task 6: Push and open the release pull request

**Files:**
- No file changes.

- [ ] **Step 1: Push the isolated branch without force.**

  Run: `git push -u origin release/v1.0.0-hardening`

  Expected: a normal remote branch update; no master update and no force-push.

- [ ] **Step 2: Open the pull request.**

  Create a PR from `release/v1.0.0-hardening` to `master` titled `release: prepare WeaveStudio v1.0.0`. Include purpose, cleanup and archive path, CI/typecheck, proprietary licensing, screenshots/README, files removed, test/lint/typecheck/build/browser results, limitations, confirmation that `main` was not merged, no Vercel setting change, and rollback by reverting the three release commits.

- [ ] **Step 3: Wait for and inspect checks.**

  Wait for GitHub Actions and Vercel Preview. If a check fails, inspect its actual log, fix only the root cause in a focused commit, rerun Task 5 completely, push normally, and wait again.

- [ ] **Step 4: Produce the pre-merge report and stop.**

  Report branch, head SHA, PR URL/number, commit list, file list, check results, preview URL, limitations, and recommendation. Request explicit owner approval before a normal merge commit.

## Task 7: Merge and verify production — owner approval required

**Files:**
- Create after merged deployment verification: `docs/FINAL-RELEASE-REPORT-v1.0.0.md` only through a separate non-destructive documentation follow-up if final facts cannot be committed before the merge.

- [ ] **Step 1: Reconfirm immutable PR state.**

  Verify PR head SHA and every required status check are unchanged and green immediately before merge.

- [ ] **Step 2: Merge normally and verify master.**

  Merge with a normal merge commit; pull `master`; confirm clean status; run `npm test; npm run lint; npm run typecheck; npm run build`.

  Expected: no force update, no change to Vercel settings, and master passes the full command set.

- [ ] **Step 3: Verify production deployment.**

  Wait for the Vercel deployment sourced from merged `master` to be `READY` and assigned to `https://weavestudio-nine.vercel.app/`. Run the abbreviated production smoke test: HTTP success, direct refresh, one guided-demo workspace, sync/viewport retention, generation, draft protection, coherent snapshots, all three exports, no duplicate headings, no hidden provider call, no new console errors, and no critical failed network request.

  Expected: production smoke test passes. If it fails, do not publish; document failure and prepare a corrective or rollback PR.

## Task 8: Publish final tag and GitHub Release — owner approval required

**Files:**
- Create/update after verified production and publication: `docs/FINAL-RELEASE-REPORT-v1.0.0.md`

- [ ] **Step 1: Stop for a second explicit owner approval.**

  Report the exact production-tested `master` SHA, Vercel identity, smoke-test result, and confirmation that `v1.0.0-rc.1` and `weavestudio-qa-pass-20260710` remain intact. Do not create a tag or release before written approval.

- [ ] **Step 2: Tag and push the verified production commit.**

  Run: `git tag -a v1.0.0 <production-master-sha> -m 'WeaveStudio v1.0.0 - independently QA verified and production tested'; git push origin v1.0.0; git ls-remote --tags origin v1.0.0`

  Expected: annotated `v1.0.0` resolves to the production-tested commit; no existing tag is altered.

- [ ] **Step 3: Publish the final GitHub Release.**

  Create a non-prerelease, latest release titled `WeaveStudio v1.0.0`. Generate notes from the final changelog and verified scope: overview, capabilities, verification, production URL, limitations, and proprietary-license statement. Do not attach raw QA reports/context exports or a custom source ZIP.

- [ ] **Step 4: Write the final release report from verified facts.**

  Create `docs/FINAL-RELEASE-REPORT-v1.0.0.md` with authoritative repository, default branch, final commit SHA, tag, release URL, live URL, Vercel deployment identity, CI/test/lint/typecheck/build/production-smoke results, license status, external archive path, limitations, rollback instructions, and follow-up recommendations. If the report needs to be committed, use a separate normal documentation PR after the tagged production release so the release tag continues to identify the exact tested application commit.

## Rollback

- Do not rewrite history, delete tags, delete branches, delete releases, or alter Vercel aliases.
- If the release PR has not merged, close it or leave it open; no production state changes.
- If a merged change must be undone, create a normal revert commit/PR for the relevant release commit(s), re-run Task 5, merge it normally, and verify the Vercel deployment.
- If production fails before publication, do not create `v1.0.0` or a final GitHub Release; retain `v1.0.0-rc.1` and report the exact failing check.

## Plan Self-Review

- [x] Every requested phase has a task, acceptance criteria, exact file targets, commands, intended commit messages, approval gates, and rollback instructions.
- [x] The plan selectively ports legacy changes without merging `main`.
- [x] The plan preserves the verified local-first behavior and explicitly checks release hygiene, browser behavior, CI, preview, and production.
- [x] No placeholder, speculative feature, secret value, or history-rewrite action is included.
