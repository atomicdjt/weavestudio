# Source / IP Handoff — WeaveStudio

This document summarizes what is included with the WeaveStudio local-first edition and what a buyer should review before taking it further.

## Core Product Statement

WeaveStudio is a local-first visual workflow canvas that turns messy notes, transcripts, logs, research fragments, and process inputs into repeatable professional deliverables.

WeaveStudio enables professionals to turn variable real-world inputs into structured, traceable deliverables by combining visual workflow design with template reusability, iterative snapshot versioning, and built-in validation checkpoints.

## Included Assets

- React, TypeScript, Vite, Tailwind v4, and `@xyflow/react` source code.
- Local-first workflow canvas with draggable and connectable nodes.
- Standard nodes: Input, Transform, Decision, Review, Output.
- Optional OpenAI/Gemini BYOK assistance with explicit per-request consent and human review before applying a draft.
- Starter templates for proposals, meetings, incidents, research, SOPs, specs, and feedback.
- Local autosave and version snapshots backed by browser localStorage.
- Deterministic Workflow Validator for workflow completeness and export-readiness.
- Deterministic Markdown, JSON, and print-oriented PDF export paths.
- Product pages, docs page, export page, `/acquire` page, known limitations, roadmap, and acquisition listing copy.

## Current Architecture

- Static frontend only.
- No backend, authentication, account system, external API, cloud sync, or database.
- Canvas uses `@xyflow/react` (current maintained package).
- PDF export uses lazy `jspdf` import to keep the initial app bundle smaller.
- AI Assist includes no API keys and makes no provider call until a user confirms that individual request.

## Technical Foundation

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- `@xyflow/react`
- localStorage persistence
- modular export utilities (Markdown, JSON, PDF/print)

## AI Assist Extension Path

A buyer can add a secure server-side provider proxy later by adding authentication, rate limiting, and audit controls. The shipped browser BYOK adapters intentionally remain explicit-consent and human-review-first. Suggested extension points:

- `src/types/index.ts` for adapter metadata and node fields.
- `src/components/workspace/WorkspacePanels.tsx` for settings and inspector controls.
- `src/components/canvas/nodes/CustomNodes.tsx` for visual node states.
- `src/lib/processCheck.ts` for readiness rules.
- `src/lib/exporter.ts` if AI-assisted provenance needs to appear in exports.

The current release remains local-first because no live AI provider is required for the product to run.

## Buyer Fit

- Indie hackers and micro-SaaS builders seeking a local-first workflow foundation.
- Operations consultants and documentation consultants.
- Researchers and technical writers.
- Template sellers who want workflow software around repeatable methods.
- Source-code and IP buyers seeking a complete visual workflow implementation.

## Deployment Checklist

1. Run `npm install`.
2. Run `npm run build`.
3. Deploy `dist/` to a static host.
4. Configure SPA fallback to `index.html` for direct visits to `/app`, `/templates`, `/exports`, `/docs`, and `/acquire`.
5. Validate rendered pages and core canvas interactions after deployment.

## Known Buyer Review Items

- localStorage is convenient but not durable enough for high-value work without exports.
- The generator structures existing node content; it does not rewrite, fact-check, or infer truth.
- Workflow Validator validates structure and export-readiness; it does not verify source accuracy.
- The PDF export is intentionally simple and text-oriented.
- Workflows involving sensitive or regulated data need independent review and a stronger storage and security model before production use in those domains.
