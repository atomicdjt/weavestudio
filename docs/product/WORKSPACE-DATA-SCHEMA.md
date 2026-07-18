# Workspace Data Schema (v1)

```ts
WorkspaceDocument {
  schemaVersion: 1
  id: string
  name: string
  templateId: string | null
  createdAt: string // ISO
  updatedAt: string
  sourceMaterial: string
  nodes: AppNode[]
  edges: AppEdge[]
  deliverableDraft?: { title, markdown, userEdited }
  viewport?: { x, y, zoom }
  meta?: object
}

WorkspaceIndex {
  schemaVersion: 1
  activeWorkspaceId: string | null
  workspaces: { id, name, updatedAt, templateId }[]
}

ProjectExportFile {
  format: 'weavestudio-project'
  formatVersion: 1
  exportedAt: string
  workspace: WorkspaceDocument
}
```

Storage keys: `weavestudio_v1_index`, `weavestudio_v1_ws_{id}`, `weavestudio_v1_snapshots`  
Legacy keys migrated: `weavestudio_workspace`, `weavestudio_versions`
