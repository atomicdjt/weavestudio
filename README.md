# WeaveStudio

**WeaveStudio is a local-first visual workflow canvas that turns messy notes, transcripts, logs, research fragments, and process inputs into repeatable professional deliverables.**

WeaveStudio enables professionals to turn variable real-world inputs into structured, traceable deliverables by combining visual workflow design with template reusability, iterative snapshot versioning, and built-in validation checkpoints.

It is a static browser app. There is no backend, account system, external API dependency, cloud sync, database requirement, or authentication layer in this release.

## Core Capabilities

- Visual workflow canvas powered by `@xyflow/react`.
- Typed nodes for input, transform, decision, review, optional AI Assist Blueprint, and output steps.
- Local template gallery for common workflow starters.
- Browser localStorage autosave for the current workspace.
- Local version snapshots with save, restore, and delete actions.
- Deterministic Workflow Validator for workflow completeness, review checkpoints, and export-readiness.
- Output preview generated from current workflow nodes.
- Markdown, JSON, and print-oriented PDF exports.
- `/acquire` source/IP acquisition page.

## AI Assist Blueprint

AI Assist is an optional blueprint node, not a live AI integration. It is BYOK-ready for a future buyer or maintainer who wants to wire provider-specific adapters later. The current release includes no bundled API keys, makes no external provider calls, and does not save API keys to localStorage.

Extension points:

- `src/types/index.ts` for node data fields.
- `src/components/workspace/WorkspacePanels.tsx` for inspector fields.
- `src/components/canvas/nodes/CustomNodes.tsx` for node rendering.
- `src/lib/processCheck.ts` for deterministic readiness checks.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4 using `@tailwindcss/vite`
- React Router
- `@xyflow/react`
- `jspdf` loaded lazily for PDF export
- Browser `localStorage`

## Routes

- `/` — product overview
- `/app` — workflow canvas
- `/templates` — template gallery
- `/exports` — export documentation
- `/docs` — usage guide
- `/acquire` — source/IP acquisition page
- `/buyer` — redirects to `/acquire`

## Local Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Release Notes

- This is an assistive workflow tool, not a legal, medical, financial, compliance, or security product.
- Output generation is deterministic local formatting. It does not verify facts, infer truth, or make correctness guarantees.
- Browser localStorage can be cleared by the user, browser settings, private browsing, or device cleanup tools. Export important work.
- Static hosting works on Netlify, Vercel, Cloudflare Pages, GitHub Pages, or equivalent hosts. Configure SPA fallback to `index.html` for deep routes.

## Acquisition Package

See the following files for IP acquisition details:

- [SOURCE_IP_HANDOFF.md](./SOURCE_IP_HANDOFF.md)
- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)
- [ROADMAP.md](./ROADMAP.md)
- [ACQUISITION_LISTING.md](./ACQUISITION_LISTING.md)
- [OUTREACH_MESSAGES.md](./OUTREACH_MESSAGES.md)
