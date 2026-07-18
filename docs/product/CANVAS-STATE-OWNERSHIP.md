# Canvas state ownership

## Authority

| Concern | Owner |
|---------|--------|
| Workspace document (nodes, edges, source, draft, viewport, meta) | `WorkspacePage` → `workspaceStore` |
| React Flow drag/connect interaction buffers | `WorkflowCanvas` internal `useNodesState` / `useEdgesState` |
| External structural updates | Parent bumps `graphEpoch`; canvas applies via `setNodes`/`setEdges` **without remount** |
| Workspace switch | `workspaceId` change + `graphEpoch`; fitView only on workspace change |

## Forbidden

- Using `key={canvasKey}` / remounting `ReactFlowProvider` for Apply-to-Input, split, or node edits.
- Creating a second durable copy of the graph outside the workspace document.

## Source sync meta

- `meta.appliedSourceFingerprint` — last source string applied to the Input node.
- `sourceSyncStatus` — `in_sync` | `source_ahead` | `canvas_ahead`.
- Apply/Split never run silently when they would overwrite manual content without confirm.
