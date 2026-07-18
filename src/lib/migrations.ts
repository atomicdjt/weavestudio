import type { AppEdge, AppNode, VersionSnapshot, WorkspaceDocument, WorkspaceIndex } from '../types';
import { WORKSPACE_SCHEMA_VERSION } from '../types';
import { createId } from './ids';
import { validateWorkspaceDocument } from './schema';

export const LEGACY_WORKSPACE_KEY = 'weavestudio_workspace';
export const LEGACY_VERSIONS_KEY = 'weavestudio_versions';
export const INDEX_KEY = 'weavestudio_v1_index';
export const workspaceKey = (id: string) => `weavestudio_v1_ws_${id}`;
export const SNAPSHOTS_KEY = 'weavestudio_v1_snapshots';

type LegacyWorkspacePayload = { nodes: AppNode[]; edges: AppEdge[] };

const isLegacyWorkspace = (value: unknown): value is LegacyWorkspacePayload => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<LegacyWorkspacePayload>;
  return Array.isArray(payload.nodes) && Array.isArray(payload.edges);
};

export const migrateLegacyWorkspace = (
  legacy: LegacyWorkspacePayload,
  options?: { name?: string; templateId?: string | null },
): WorkspaceDocument => {
  const now = new Date().toISOString();
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: createId('ws'),
    name: options?.name ?? 'Migrated workspace',
    templateId: options?.templateId ?? null,
    createdAt: now,
    updatedAt: now,
    sourceMaterial: extractSourceFromNodes(legacy.nodes),
    nodes: structuredClone(legacy.nodes),
    edges: structuredClone(legacy.edges),
  };
};

const extractSourceFromNodes = (nodes: AppNode[]): string => {
  const input = nodes.find((node) => node.type === 'input');
  return input?.data?.content ?? '';
};

export const readLegacyWorkspaceFromStorage = (): WorkspaceDocument | null => {
  try {
    const raw = localStorage.getItem(LEGACY_WORKSPACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isLegacyWorkspace(parsed) || parsed.nodes.length === 0) return null;
    return migrateLegacyWorkspace(parsed);
  } catch {
    return null;
  }
};

export const readLegacySnapshots = (): VersionSnapshot[] => {
  try {
    const raw = localStorage.getItem(LEGACY_VERSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as VersionSnapshot[]) : [];
  } catch {
    return [];
  }
};

export const ensureMigratedStore = (): { index: WorkspaceIndex; active: WorkspaceDocument | null } => {
  try {
    const existingIndexRaw = localStorage.getItem(INDEX_KEY);
    if (existingIndexRaw) {
      const parsed = JSON.parse(existingIndexRaw) as WorkspaceIndex;
      if (parsed && Array.isArray(parsed.workspaces)) {
        let active: WorkspaceDocument | null = null;
        if (parsed.activeWorkspaceId) {
          const wsRaw = localStorage.getItem(workspaceKey(parsed.activeWorkspaceId));
          if (wsRaw) {
            const result = validateWorkspaceDocument(JSON.parse(wsRaw));
            if (result.ok) active = result.data;
          }
        }
        return { index: parsed, active };
      }
    }

    // Migrate legacy single workspace
    const migrated = readLegacyWorkspaceFromStorage();

    if (migrated) {
      const index: WorkspaceIndex = {
        schemaVersion: WORKSPACE_SCHEMA_VERSION,
        activeWorkspaceId: migrated.id,
        workspaces: [
          {
            id: migrated.id,
            name: migrated.name,
            updatedAt: migrated.updatedAt,
            templateId: migrated.templateId,
          },
        ],
      };
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
      localStorage.setItem(workspaceKey(migrated.id), JSON.stringify(migrated));

      // Migrate snapshots if present
      const legacySnaps = readLegacySnapshots();
      if (legacySnaps.length > 0) {
        const tagged = legacySnaps.map((snap) => ({ ...snap, workspaceId: migrated.id }));
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(tagged));
      }

      return { index, active: migrated };
    }

    const emptyIndex: WorkspaceIndex = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      activeWorkspaceId: null,
      workspaces: [],
    };
    localStorage.setItem(INDEX_KEY, JSON.stringify(emptyIndex));
    return { index: emptyIndex, active: null };
  } catch {
    return {
      index: { schemaVersion: WORKSPACE_SCHEMA_VERSION, activeWorkspaceId: null, workspaces: [] },
      active: null,
    };
  }
};
