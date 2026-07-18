# Local-First Privacy Audit

## Stays on device (default)

- Workspace graphs, source material, deliverable drafts, snapshots
- Template data (bundled)
- Markdown / PDF / JSON generation (client-side)
- User-initiated downloads

## Can leave the device

1. **Optional AI live provider** — only after explicit confirmation; sends prompt + input context to configured URL  
2. **Exports the user downloads** — files on disk  
3. **Hosting the SPA** — static assets only, not user content  

## Claims that are true

- No backend account or cloud workspace sync in this product  
- No bundled API keys  
- Golden path works offline  

## Claims that are not absolute

- “Data never leaves the device” — false if the user runs live AI Assist  
- “Local storage is secure” — localStorage is not encrypted and is clearable  

## Mitigations implemented

- Consent dialog before live AI `fetch`  
- Mock offline as primary AI control  
- API keys in React session state only  
- Honest README / Docs / KNOWN_LIMITATIONS  
