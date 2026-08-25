# Buyer Handoff

This document summarizes what is included with the WeaveStudio local-first edition and what a buyer should review before taking it further.

## Included Asset

- React, TypeScript, Vite, Tailwind v4, and `@xyflow/react` source code.
- Local-first workflow canvas with draggable and connectable nodes.
- Standard nodes: Input, Transform, Decision, Review, Output.
- Optional AI Assist Blueprint node for future BYOK provider adapters.
- Starter templates for proposals, meetings, incidents, research, SOPs, specs, feedback, and optional AI Assist review.
- Local autosave and version snapshots backed by browser localStorage.
- Deterministic Workflow Validator for workflow completeness and export readiness.
- Deterministic markdown, JSON, and print-oriented PDF export paths.
- Product pages, docs page, export page, `/acquire` page, known limitations, roadmap, and acquisition listing copy.

## Current Architecture

- Static frontend only.
- No backend, authentication, account system, external API, cloud sync, or database.
- No obsolete `reactflow` dependency; canvas uses `@xyflow/react`.
- PDF export uses lazy `jspdf` import to keep the initial app bundle smaller.
- AI Assist Blueprint includes no API keys and does not make provider calls by default.

## Technical Foundation

- React
- TypeScript
- Vite
- Tailwind CSS
- `@xyflow/react`
- localStorage persistence
- modular export utilities
- Markdown export
- JSON export
- PDF/print export

## AI Assist Extension Path

A buyer can wire provider-specific API calls into the AI Assist Blueprint later by adding an adapter module, adding secure BYOK input handling, and routing returned draft content back through a Review node. Suggested extension points:

- `src/types/index.ts` for adapter metadata and node fields.
- `src/components/workspace/WorkspacePanels.tsx` for settings and inspector controls.
- `src/components/canvas/nodes/CustomNodes.tsx` for visual node states.
- `src/lib/processCheck.ts` for readiness rules.
- `src/lib/exporter.ts` if AI-assisted provenance needs to appear in exports.

The current MVP remains deterministic and local-first because no live AI provider is required for the product to run.

## Buyer Fit

- Local-first productivity tool builders.
- Operations consultants and documentation consultants.
- Template sellers who want workflow software around repeatable methods.
- Indie developers evaluating a desktop wrapper or paid template-pack model.

## Deployment Checklist

1. Run `npm install`.
2. Run `npm run build`.
3. Deploy `dist/` to a static host.
4. Configure SPA fallback to `index.html` for direct visits to `/app`, `/templates`, `/exports`, `/docs`, and `/acquire`.
5. Validate rendered pages and core canvas interactions after deployment.

## Known Buyer Review Items

- localStorage is convenient but not durable enough for high-value work without exports.
- The generator structures existing node content; it does not rewrite, fact-check, or infer truth.
- Workflow Validator validates structure and readiness; it does not verify source accuracy.
- The PDF export is intentionally simple and text-oriented.
- Sensitive or regulated workflows need independent review and a stronger storage/security model before production use in those domains.
