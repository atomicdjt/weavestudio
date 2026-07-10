# WeaveStudio

**Turn fragmented information into a structured, reusable deliverable workflow.**

WeaveStudio is a local-first visual workflow canvas for professionals who convert messy notes, transcripts, logs, research fragments, and discovery inputs into repeatable deliverables.

It is a static browser app. There is no backend, account system, cloud database, or required external API for the golden path.

## Golden path

1. Choose a professional workflow template.
2. Paste unstructured source material.
3. Convert material into editable canvas nodes.
4. Organize, connect, classify, and revise.
5. Generate a template-structured deliverable.
6. Preview and export (Markdown, PDF, project JSON).
7. Save and reopen the named workspace.

## Core capabilities (implemented)

- Visual workflow canvas (`@xyflow/react`)
- Five primary templates + expandable legacy pack
- Source ingest panel with split-into-nodes
- Named workspaces with autosave + visible save status
- Version snapshots
- Workflow Validator (structural / export-readiness)
- Template-structured deliverable engine with editable draft
- Markdown, PDF, and re-importable project JSON
- Optional AI Assist blueprint (Mock offline; live provider calls require explicit consent)

## Tech stack

- React 19 · TypeScript · Vite · Tailwind CSS v4
- React Router · `@xyflow/react` · `jspdf` · `react-markdown`

## Routes

| Path | Purpose |
|------|---------|
| `/` | Product home / onboarding CTAs |
| `/app` | Workspace canvas |
| `/templates` | Template gallery |
| `/docs` | Usage guide |
| `/acquire` | Optional source/IP handoff page (not primary chrome) |

## Local development

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

## Privacy (honest)

- Golden-path work stays in the browser (localStorage + file downloads you initiate).
- Optional AI “Run live provider” may send prompt/context to a user-configured URL only after confirmation.
- API keys for AI Assist are session-only (not written to localStorage).
- Clearing browser data can destroy local workspaces — export important projects.

## Project layout

- `src/pages` — routes
- `src/components/canvas` — React Flow canvas + nodes
- `src/components/workspace` — inspector, source ingest, export, portability
- `src/data/templates` — data-driven templates
- `src/lib` — storage, schema, deliverable engine, validator, structure
- `docs/audit` · `docs/product` — product audit and specifications

## License

License placeholder — **owner approval required** before selecting MIT, proprietary, or other terms.
