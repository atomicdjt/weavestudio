# Buyer Handoff

This document summarizes what is included with the WeaveStudio local-first edition and what a buyer should review before taking it further.

## Included Asset

- React, TypeScript, Vite, Tailwind v4, and `@xyflow/react` source code.
- Local-first workflow canvas with draggable and connectable nodes.
- Standard nodes: Input, Transform, Decision, Review, Output.
- Optional AI Assist node with explicit-consent OpenAI/Gemini BYOK provider adapters.
- Starter templates for proposals, meetings, incidents, research, SOPs, specs, feedback, and optional AI Assist review.
- Local autosave and version snapshots backed by browser localStorage.
- Deterministic Workflow Validator for workflow completeness and export readiness.
- Deterministic markdown, JSON, and print-oriented PDF export paths.
- Product pages, docs page, export page, `/acquire` page, known limitations, roadmap, and acquisition listing copy.

## Current Architecture

- Static frontend only.
- No backend, authentication, account system, cloud sync, or database. The standard workflow needs no external API; optional AI Assist can make a direct browser request to OpenAI or Gemini only after explicit per-request consent.
- No obsolete `reactflow` dependency; canvas uses `@xyflow/react`.
- PDF export uses lazy `jspdf` import to keep the initial app bundle smaller.
- AI Assist includes no bundled API keys and makes no provider call until the user confirms an individual request; supplied keys remain in volatile tab memory.

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

## AI Assist and Proxy Extension Path

The shipped AI Assist already supports direct browser OpenAI/Gemini BYOK requests after explicit consent and routes returned text back as a reviewable draft. A buyer can add a server-side provider proxy later by adding authentication, rate limiting, audit controls, and server-side secret handling. Suggested extension points:

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

1. Run `npm ci`.
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
