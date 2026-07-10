import type {
  AppEdge,
  AppNode,
  DeliverableDraft,
  ProjectExportFile,
  WorkspaceDocument,
  WorkspaceIndex,
} from '../types';
import { WORKSPACE_SCHEMA_VERSION } from '../types';

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; partial?: Partial<T> };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNodeArray = (value: unknown): value is AppNode[] => {
  if (!Array.isArray(value)) return false;
  return value.every(
    (node) =>
      isObject(node) &&
      typeof node.id === 'string' &&
      isObject(node.position) &&
      typeof (node.position as { x?: unknown }).x === 'number' &&
      typeof (node.position as { y?: unknown }).y === 'number' &&
      isObject(node.data),
  );
};

const isEdgeArray = (value: unknown): value is AppEdge[] => {
  if (!Array.isArray(value)) return false;
  return value.every(
    (edge) =>
      isObject(edge) &&
      typeof edge.id === 'string' &&
      typeof edge.source === 'string' &&
      typeof edge.target === 'string',
  );
};

const parseDeliverableDraft = (value: unknown): DeliverableDraft | undefined => {
  if (!isObject(value)) return undefined;
  if (typeof value.title !== 'string' || typeof value.markdown !== 'string') return undefined;
  return {
    title: value.title,
    markdown: value.markdown,
    userEdited: Boolean(value.userEdited),
  };
};

export const validateWorkspaceDocument = (value: unknown): ValidationResult<WorkspaceDocument> => {
  if (!isObject(value)) return { ok: false, error: 'Workspace must be an object.' };

  if (!isNodeArray(value.nodes) || !isEdgeArray(value.edges)) {
    return {
      ok: false,
      error: 'Workspace nodes/edges are missing or invalid.',
      partial: value as Partial<WorkspaceDocument>,
    };
  }

  const schemaVersion =
    typeof value.schemaVersion === 'number' ? value.schemaVersion : WORKSPACE_SCHEMA_VERSION;

  if (schemaVersion > WORKSPACE_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Workspace schema version ${schemaVersion} is newer than this app supports (${WORKSPACE_SCHEMA_VERSION}).`,
    };
  }

  const id = typeof value.id === 'string' && value.id ? value.id : null;
  if (!id) return { ok: false, error: 'Workspace id is required.' };

  const name = typeof value.name === 'string' && value.name.trim() ? value.name.trim() : 'Untitled workspace';
  const now = new Date().toISOString();

  const doc: WorkspaceDocument = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id,
    name,
    templateId: typeof value.templateId === 'string' || value.templateId === null ? (value.templateId as string | null) : null,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
    sourceMaterial: typeof value.sourceMaterial === 'string' ? value.sourceMaterial : '',
    nodes: value.nodes,
    edges: value.edges,
    deliverableDraft: parseDeliverableDraft(value.deliverableDraft),
    viewport:
      isObject(value.viewport) &&
      typeof value.viewport.x === 'number' &&
      typeof value.viewport.y === 'number' &&
      typeof value.viewport.zoom === 'number'
        ? { x: value.viewport.x, y: value.viewport.y, zoom: value.viewport.zoom }
        : undefined,
    meta: isObject(value.meta) ? value.meta : undefined,
  };

  return { ok: true, data: doc };
};

export const validateWorkspaceIndex = (value: unknown): ValidationResult<WorkspaceIndex> => {
  if (!isObject(value)) return { ok: false, error: 'Workspace index must be an object.' };
  if (!Array.isArray(value.workspaces)) return { ok: false, error: 'Workspace index is missing workspaces[].' };

  const workspaces = value.workspaces
    .filter(isObject)
    .filter((entry) => typeof entry.id === 'string' && typeof entry.name === 'string')
    .map((entry) => ({
      id: entry.id as string,
      name: entry.name as string,
      updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : new Date().toISOString(),
      templateId:
        typeof entry.templateId === 'string' || entry.templateId === null
          ? (entry.templateId as string | null)
          : null,
    }));

  return {
    ok: true,
    data: {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      activeWorkspaceId:
        typeof value.activeWorkspaceId === 'string' || value.activeWorkspaceId === null
          ? (value.activeWorkspaceId as string | null)
          : workspaces[0]?.id ?? null,
      workspaces,
    },
  };
};

export const validateProjectExportFile = (value: unknown): ValidationResult<ProjectExportFile> => {
  if (!isObject(value)) return { ok: false, error: 'Import file must be a JSON object.' };

  // New project format
  if (value.format === 'weavestudio-project') {
    const workspaceResult = validateWorkspaceDocument(value.workspace);
    if (!workspaceResult.ok) return { ok: false, error: workspaceResult.error };
    return {
      ok: true,
      data: {
        format: 'weavestudio-project',
        formatVersion: 1,
        exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : new Date().toISOString(),
        workspace: workspaceResult.data,
      },
    };
  }

  // Bare workspace document
  const bare = validateWorkspaceDocument(value);
  if (bare.ok) {
    return {
      ok: true,
      data: {
        format: 'weavestudio-project',
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        workspace: bare.data,
      },
    };
  }

  // Legacy output-panel JSON with nodes/edges
  if (isNodeArray(value.nodes) && isEdgeArray(value.edges)) {
    const now = new Date().toISOString();
    const workspace: WorkspaceDocument = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      id: typeof value.id === 'string' ? value.id : `imported_${Date.now()}`,
      name: typeof value.title === 'string' ? value.title : 'Imported workflow',
      templateId: null,
      createdAt: now,
      updatedAt: now,
      sourceMaterial: '',
      nodes: value.nodes,
      edges: value.edges,
    };
    return {
      ok: true,
      data: {
        format: 'weavestudio-project',
        formatVersion: 1,
        exportedAt: now,
        workspace,
      },
    };
  }

  return { ok: false, error: bare.error || 'Unrecognized project file format.' };
};

export const isLegacyLocalStorageBackup = (value: unknown): value is Record<string, string> => {
  if (!isObject(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => key.startsWith('weavestudio_') && typeof value[key] === 'string');
};
