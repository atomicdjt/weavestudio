# WeaveStudio Quality Remediation Design

## Purpose

This design turns the 12 October 2026 evidence-led audit into an implementation
release. It preserves the local-first model, retains review gates, and avoids
claiming that any remote provider, export, or recovered document is more
reliable than it has been demonstrated to be.

## Non-negotiable outcomes

1. A malformed, partial, or failed import/restore must not silently overwrite
   existing WeaveStudio records. Full browser backups use a dedicated restore
   path; ordinary project import always creates one project workspace.
2. Every persistence write reports its failure to its caller. A multi-record
   write either restores prior bytes or reports that it could not do so.
3. Template output assigns a node once, using explicit node IDs first, then
   categories, then types only for uncategorized nodes. Required sections are
   represented in readiness feedback.
4. An optional-AI result may only be applied to the workspace/node/revision for
   which it was requested. OpenAI Responses REST payloads, provider refusal,
   cancellation, authentication, and rate-limit outcomes receive useful
   behavior.
5. Markdown and JSON remain complete handoff formats. PDF line layout cannot
   write below a page footer. Undo has explicit command boundaries rather than
   an unbounded shared mutation bucket.
6. The primary experience meets its stated local-first/privacy scope:
   inaccessible colors are repaired, route/dialog coverage is executable,
   remote Markdown images need an explicit user action, and production
   dependency remediation is reviewed like any other product change.
7. Documentation describes only shipped providers and current verification
   protocol. Participant study materials are supplied without fabricating
   external product evidence.

## Scope rulings

- A full browser backup must contain a valid current index and every indexed
  workspace. Settings-only data cannot be used to replace all WeaveStudio
  records, because accepting it would erase recoverable work.
- The product accepts historical project/snapshot data where migration is
  explicit, but malformed nested node data, snapshots, and record references
  are rejected before a restore.
- No analytics beacon or unconsented external request is introduced to measure
  task time. The repository supplies consent-aware facilitation templates for
  a real study.
- Dependency changes remain subject to the repository's GitHub review gate;
  this branch may demonstrate compatibility but cannot self-approve or merge.

## Acceptance evidence

The release requires unit tests that recreate every identified failure mode,
Playwright checks for persistence and UI-safe behavior, full `npm run verify`,
`npm audit --omit=dev`, and a fresh preview deployment check before the
pull request is considered ready for human review.
