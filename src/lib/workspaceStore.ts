import type {
  AppEdge,
  AppNode,
  ProjectExportFile,
  SaveStatus,
  VersionSnapshot,
  WorkspaceDocument,
  WorkspaceIndex,
} from '../types';
import { WORKSPACE_SCHEMA_VERSION } from '../types';
import { createId } from './ids';
import {
  ensureMigratedStore,
  INDEX_KEY,
  LEGACY_VERSIONS_KEY,
  LEGACY_WORKSPACE_KEY,
  SNAPSHOTS_KEY,
  workspaceKey,
} from './migrations';
import {
  isLegacyLocalStorageBackup,
  validateProjectExportFile,
  validateWorkspaceDocument,
  validateWorkspaceIndex,
} from './schema';

export type SaveResult = { status: SaveStatus; error?: string };

const writeJson = (key: string, value: unknown): SaveResult => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { status: 'saved' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('quota') || message.toLowerCase().includes('storage')) {
      return { status: 'quota', error: 'Browser storage is full. Export a backup, then free space or delete old workspaces.' };
    }
    return { status: 'error', error: 'Could not save to local storage.' };
  }
};

export const loadIndex = (): WorkspaceIndex => {
  const { index } = ensureMigratedStore();
  return index;
};

export const saveIndex = (index: WorkspaceIndex): SaveResult => writeJson(INDEX_KEY, index);

export const loadWorkspaceById = (id: string): WorkspaceDocument | null => {
  try {
    const raw = localStorage.getItem(workspaceKey(id));
    if (!raw) return null;
    const result = validateWorkspaceDocument(JSON.parse(raw));
    return result.ok ? result.data : null;
  } catch {
    return null;
  }
};

export const getActiveWorkspace = (): WorkspaceDocument | null => {
  const { active, index } = ensureMigratedStore();
  if (active) return active;
  if (index.activeWorkspaceId) return loadWorkspaceById(index.activeWorkspaceId);
  return null;
};

export const createWorkspace = (options?: {
  name?: string;
  templateId?: string | null;
  nodes?: AppNode[];
  edges?: AppEdge[];
  sourceMaterial?: string;
}): WorkspaceDocument => {
  const now = new Date().toISOString();
  const doc: WorkspaceDocument = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: createId('ws'),
    name: options?.name?.trim() || 'Untitled workspace',
    templateId: options?.templateId ?? null,
    createdAt: now,
    updatedAt: now,
    sourceMaterial: options?.sourceMaterial ?? '',
    nodes: structuredClone(options?.nodes ?? []),
    edges: structuredClone(options?.edges ?? []),
  };

  const index = loadIndex();
  index.workspaces = [
    { id: doc.id, name: doc.name, updatedAt: doc.updatedAt, templateId: doc.templateId },
    ...index.workspaces.filter((entry) => entry.id !== doc.id),
  ];
  index.activeWorkspaceId = doc.id;
  writeJson(workspaceKey(doc.id), doc);
  saveIndex(index);
  return doc;
};

export const saveWorkspaceDocument = (doc: WorkspaceDocument): SaveResult => {
  const updated: WorkspaceDocument = {
    ...doc,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  const result = writeJson(workspaceKey(updated.id), updated);
  if (result.status === 'saved') {
    const index = loadIndex();
    const entry = {
      id: updated.id,
      name: updated.name,
      updatedAt: updated.updatedAt,
      templateId: updated.templateId,
    };
    const others = index.workspaces.filter((item) => item.id !== updated.id);
    index.workspaces = [entry, ...others];
    index.activeWorkspaceId = updated.id;
    saveIndex(index);

    // Keep legacy key in sync for older tools/backups
    try {
      localStorage.setItem(
        LEGACY_WORKSPACE_KEY,
        JSON.stringify({ nodes: updated.nodes, edges: updated.edges }),
      );
    } catch {
      /* ignore mirror failure */
    }
  }
  return result;
};

export const setActiveWorkspaceId = (id: string | null): void => {
  const index = loadIndex();
  index.activeWorkspaceId = id;
  saveIndex(index);
};

export const duplicateWorkspace = (id: string): WorkspaceDocument | null => {
  const source = loadWorkspaceById(id);
  if (!source) return null;
  const now = new Date().toISOString();
  const copy: WorkspaceDocument = {
    ...structuredClone(source),
    id: createId('ws'),
    name: `${source.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
  writeJson(workspaceKey(copy.id), copy);
  const index = loadIndex();
  index.workspaces = [
    { id: copy.id, name: copy.name, updatedAt: copy.updatedAt, templateId: copy.templateId },
    ...index.workspaces,
  ];
  index.activeWorkspaceId = copy.id;
  saveIndex(index);
  return copy;
};

export const deleteWorkspace = (id: string): void => {
  try {
    localStorage.removeItem(workspaceKey(id));
  } catch {
    /* ignore */
  }
  const index = loadIndex();
  index.workspaces = index.workspaces.filter((entry) => entry.id !== id);
  if (index.activeWorkspaceId === id) {
    index.activeWorkspaceId = index.workspaces[0]?.id ?? null;
  }
  saveIndex(index);

  // Drop related snapshots
  const snaps = getSnapshots().filter((snap) => snap.workspaceId !== id);
  writeJson(SNAPSHOTS_KEY, snaps);
};

export const renameWorkspace = (id: string, name: string): WorkspaceDocument | null => {
  const doc = loadWorkspaceById(id);
  if (!doc) return null;
  doc.name = name.trim() || doc.name;
  saveWorkspaceDocument(doc);
  return loadWorkspaceById(id);
};

export const buildProjectExport = (doc: WorkspaceDocument): ProjectExportFile => ({
  format: 'weavestudio-project',
  formatVersion: 1,
  exportedAt: new Date().toISOString(),
  workspace: structuredClone(doc),
});

export const importProjectFile = (
  raw: unknown,
  mode: 'replace-active' | 'as-new' = 'as-new',
): { ok: true; workspace: WorkspaceDocument } | { ok: false; error: string } => {
  // Full localStorage backup (legacy portability)
  if (isLegacyLocalStorageBackup(raw)) {
    try {
      for (const [key, value] of Object.entries(raw)) {
        if (key.startsWith('weavestudio_') && typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      }
      const { active } = ensureMigratedStore();
      if (active) return { ok: true, workspace: active };
      return { ok: false, error: 'Backup imported but no workspace was found.' };
    } catch {
      return { ok: false, error: 'Failed to import legacy backup.' };
    }
  }

  const validated = validateProjectExportFile(raw);
  if (!validated.ok) return { ok: false, error: validated.error };

  const incoming = validated.data.workspace;
  if (mode === 'replace-active') {
    const active = getActiveWorkspace();
    const targetId = active?.id ?? createId('ws');
    const merged: WorkspaceDocument = {
      ...incoming,
      id: targetId,
      updatedAt: new Date().toISOString(),
      createdAt: active?.createdAt ?? incoming.createdAt,
    };
    saveWorkspaceDocument(merged);
    return { ok: true, workspace: merged };
  }

  const asNew: WorkspaceDocument = {
    ...incoming,
    id: createId('ws'),
    name: incoming.name.endsWith('(imported)') ? incoming.name : `${incoming.name} (imported)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeJson(workspaceKey(asNew.id), asNew);
  const index = loadIndex();
  index.workspaces = [
    { id: asNew.id, name: asNew.name, updatedAt: asNew.updatedAt, templateId: asNew.templateId },
    ...index.workspaces,
  ];
  index.activeWorkspaceId = asNew.id;
  saveIndex(index);
  return { ok: true, workspace: asNew };
};

export const getSnapshots = (): VersionSnapshot[] => {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY) ?? localStorage.getItem(LEGACY_VERSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as VersionSnapshot[]) : [];
  } catch {
    return [];
  }
};

export const saveSnapshot = (
  title: string,
  nodes: AppNode[],
  edges: AppEdge[],
  workspaceId?: string,
): VersionSnapshot => {
  const snapshot: VersionSnapshot = {
    id: createId('snap'),
    timestamp: Date.now(),
    title,
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
    workspaceId,
  };
  const next = [...getSnapshots(), snapshot];
  writeJson(SNAPSHOTS_KEY, next);
  try {
    localStorage.setItem(LEGACY_VERSIONS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return snapshot;
};

export const deleteSnapshot = (id: string): void => {
  const next = getSnapshots().filter((snap) => snap.id !== id);
  writeJson(SNAPSHOTS_KEY, next);
  try {
    localStorage.setItem(LEGACY_VERSIONS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

export const clearAllLocalData = (): void => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith('weavestudio_')) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

export const downloadProjectJson = (doc: WorkspaceDocument): void => {
  const payload = buildProjectExport(doc);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stem = doc.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  anchor.href = url;
  anchor.download = `${stem || 'weavestudio'}-${new Date().toISOString().slice(0, 10)}.weavestudio.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const createEmptyWorkspaceDocument = (name = 'Blank workspace'): WorkspaceDocument => {
  const now = new Date().toISOString();
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: createId('ws'),
    name,
    templateId: null,
    createdAt: now,
    updatedAt: now,
    sourceMaterial: '',
    nodes: [],
    edges: [],
  };
};

// Re-export validation for callers
export { validateWorkspaceDocument, validateWorkspaceIndex };
