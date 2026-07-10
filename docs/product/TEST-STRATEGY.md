# Test Strategy

## Tooling

- **Unit / integration:** Vitest (`npm test`)
- **E2E:** Playwright recommended next (not required for first green unit suite)
- **Lint:** oxlint  
- **Typecheck:** `tsc -b` via `npm run build`

## Priority coverage

| Area | Level | Status |
|------|-------|--------|
| structureSource splitters | Unit | Implemented |
| deliverableEngine composition | Unit | Implemented |
| schema / project import validation | Unit | Implemented |
| template registry | Unit | Implemented |
| workspace migrations | Unit | Expand |
| autosave / multi-workspace | Integration | Expand |
| golden path UI | E2E | Planned |
| zero unexpected network on golden path | E2E | Planned |
| PDF smoke | Manual / light unit | Manual |

## Commands

```bash
npm test
npm run build
npm run lint
```
