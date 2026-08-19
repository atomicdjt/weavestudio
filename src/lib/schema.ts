import type {
  AppEdge,
  AppNode,
  DeliverableDraft,
  ProjectExportFile,
  ProvenanceClaim,
  ProvenanceDerivation,
  ProvenanceGraph,
  SourceFragment,
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

const DERIVATIONS = new Set<ProvenanceDerivation>([
  'direct',
  'transformed',
  'manual',
  'ai-assisted',
]);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const hasUniqueIds = (items: Array<{ id: string }>): boolean =>
  new Set(items.map((item) => item.id)).size === items.length;

const parseSourceFragment = (value: unknown): SourceFragment | null => {
  if (!isObject(value)) return null;
  if (typeof value.id !== 'string' || !value.id.trim()) return null;
  if (!Number.isInteger(value.startOffset) || !Number.isInteger(value.endOffset)) return null;
  const startOffset = value.startOffset as number;
  const endOffset = value.endOffset as number;
  if (startOffset < 0 || endOffset < startOffset) return null;
  if (
    typeof value.quote !== 'string' ||
    typeof value.quoteFingerprint !== 'string' ||
    typeof value.sourceFingerprint !== 'string'
  ) {
    return null;
  }
  return {
    id: value.id,
    startOffset,
    endOffset,
    quote: value.quote,
    quoteFingerprint: value.quoteFingerprint,
    sourceFingerprint: value.sourceFingerprint,
  };
};

const parseProvenanceClaim = (value: unknown): ProvenanceClaim | null => {
  if (!isObject(value)) return null;
  if (typeof value.id !== 'string' || !value.id.trim()) return null;
  if (typeof value.nodeId !== 'string' || !value.nodeId.trim()) return null;
  if (typeof value.claimText !== 'string' || !value.claimText.trim()) return null;
  if (typeof value.claimFingerprint !== 'string') return null;
  if (!isStringArray(value.sourceFragmentIds) || !isStringArray(value.viaNodeIds)) return null;
  if (typeof value.derivation !== 'string' || !DERIVATIONS.has(value.derivation as ProvenanceDerivation)) {
    return null;
  }
  return {
    id: value.id,
    nodeId: value.nodeId,
    claimText: value.claimText,
    claimFingerprint: value.claimFingerprint,
    sourceFragmentIds: [...value.sourceFragmentIds],
    viaNodeIds: [...value.viaNodeIds],
    derivation: value.derivation as ProvenanceDerivation,
  };
};

const parseProvenanceGraph = (value: unknown): ValidationResult<ProvenanceGraph> => {
  if (!isObject(value)) return { ok: false, error: 'Workspace provenance must be an object.' };
  if (value.version !== 1 || typeof value.sourceFingerprint !== 'string') {
    return { ok: false, error: 'Workspace provenance version or source fingerprint is invalid.' };
  }
  if (!Array.isArray(value.fragments) || !Array.isArray(value.claims)) {
    return { ok: false, error: 'Workspace provenance must contain fragments[] and claims[].' };
  }

  const fragments: SourceFragment[] = [];
  for (const raw of value.fragments) {
    const fragment = parseSourceFragment(raw);
    if (!fragment) return { ok: false, error: 'Workspace provenance contains an invalid source fragment.' };
    fragments.push(fragment);
  }
  if (!hasUniqueIds(fragments)) {
    return { ok: false, error: 'Workspace provenance contains duplicate source fragment ids.' };
  }

  const claims: ProvenanceClaim[] = [];
  for (const raw of value.claims) {
    const claim = parseProvenanceClaim(raw);
    if (!claim) return { ok: false, error: 'Workspace provenance contains an invalid claim.' };
    claims.push(claim);
  }
  if (!hasUniqueIds(claims)) {
    return { ok: false, error: 'Workspace provenance contains duplicate claim ids.' };
  }

  const fragmentIds = new Set(fragments.map((fragment) => fragment.id));
  if (claims.some((claim) => claim.sourceFragmentIds.some((id) => !fragmentIds.has(id)))) {
    return { ok: false, error: 'Workspace provenance claim references an unknown source fragment.' };
  }

  return {
    ok: true,
    data: {
      version: 1,
      sourceFingerprint: value.sourceFingerprint,
      fragments,
      claims,
    },
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

  let provenance: ProvenanceGraph | undefined;
  if (Object.prototype.hasOwnProperty.call(value, 'provenance') && value.provenance !== undefined) {
    const provenanceResult = parseProvenanceGraph(value.provenance);
    if (!provenanceResult.ok) return { ok: false, error: provenanceResult.error };
    provenance = provenanceResult.data;
  }

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
    provenance,
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
