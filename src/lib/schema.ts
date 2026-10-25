import type {
  AppEdge,
  AppNode,
  DeliverableDraft,
  ProjectExportFile,
  ProvenanceClaim,
  ProvenanceDerivation,
  ProvenanceGraph,
  SourceFragment,
  VersionSnapshot,
  WorkspaceDocument,
  WorkspaceIndex,
} from '../types';
import { SNAPSHOT_FORMAT_VERSION, WORKSPACE_SCHEMA_VERSION } from '../types';
import { verifyReviewApprovalSignatures } from './reviewState';

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; partial?: Partial<T> };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const VALID_NODE_TYPES = new Set<string>([
  'input',
  'transform',
  'decision',
  'review',
  'aiAssist',
  'output',
]);

const VALID_NODE_CATEGORIES = new Set<string>([
  'source',
  'evidence',
  'action',
  'risk',
  'decision',
  'conclusion',
  'open_question',
  'output',
  'other',
]);

const VALID_NODE_STATUSES = new Set<string>([
  'pending',
  'approved',
  'rejected',
  'running',
  'complete',
  'needs_review',
  'warning',
  'incomplete',
  'ready',
]);
const VALID_SOURCE_SYNC_STATUSES = new Set<string>(['in_sync', 'source_ahead', 'canvas_ahead', 'unknown']);

const hasUniqueCaseInsensitiveIds = (items: Array<{ id: string }>) =>
  new Set(items.map((item) => item.id.toLowerCase())).size === items.length;

const isValidNodeData = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  if (
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.content !== 'string'
  ) {
    return false;
  }
  if (value.category !== undefined && (typeof value.category !== 'string' || !VALID_NODE_CATEGORIES.has(value.category))) {
    return false;
  }
  if (value.status !== undefined && (typeof value.status !== 'string' || !VALID_NODE_STATUSES.has(value.status))) {
    return false;
  }
  if (value.reviewRequired !== undefined && typeof value.reviewRequired !== 'boolean') return false;
  if (value.provider !== undefined && value.provider !== 'openai' && value.provider !== 'gemini') return false;
  return ['baseUrl', 'modelName', 'promptInstruction', 'expectedInput', 'expectedOutput', 'providerNote']
    .every((key) => value[key] === undefined || typeof value[key] === 'string');
};

const isNodeArray = (value: unknown): value is AppNode[] => {
  if (!Array.isArray(value)) return false;
  return value.every(
    (node) =>
      isObject(node) &&
      typeof node.id === 'string' &&
      node.id.trim() !== '' &&
      typeof node.type === 'string' &&
      VALID_NODE_TYPES.has(node.type) &&
      isObject(node.position) &&
      typeof (node.position as { x?: unknown }).x === 'number' &&
      typeof (node.position as { y?: unknown }).y === 'number' &&
      Number.isFinite((node.position as { x: number }).x) &&
      Number.isFinite((node.position as { y: number }).y) &&
      isObject(node.data),
  );
};

const isEdgeArray = (value: unknown): value is AppEdge[] => {
  if (!Array.isArray(value)) return false;
  return value.every(
    (edge) =>
      isObject(edge) &&
      typeof edge.id === 'string' &&
      edge.id.trim() !== '' &&
      typeof edge.source === 'string' &&
      edge.source.trim() !== '' &&
      typeof edge.target === 'string' &&
      edge.target.trim() !== '',
  );
};

const parseDeliverableDraft = (value: unknown): ValidationResult<DeliverableDraft> => {
  if (!isObject(value) || typeof value.title !== 'string' || typeof value.markdown !== 'string') {
    return { ok: false, error: 'Workspace deliverable draft is invalid.' };
  }
  if (value.userEdited !== undefined && typeof value.userEdited !== 'boolean') {
    return { ok: false, error: 'Workspace deliverable draft edit state is invalid.' };
  }
  return {
    ok: true,
    data: {
      title: value.title,
      markdown: value.markdown,
      userEdited: Boolean(value.userEdited),
    },
  };
};

const parseViewport = (value: unknown): { x: number; y: number; zoom: number } | null => {
  if (!isObject(value)) return null;
  if (typeof value.x !== 'number' || typeof value.y !== 'number' || typeof value.zoom !== 'number') return null;
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y) || !Number.isFinite(value.zoom)) return null;
  return { x: value.x, y: value.y, zoom: value.zoom };
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

  if (!hasUniqueCaseInsensitiveIds(value.nodes)) {
    return {
      ok: false,
      error: 'Workspace contains duplicate node IDs.',
      partial: value as Partial<WorkspaceDocument>,
    };
  }

  if (!hasUniqueCaseInsensitiveIds(value.edges)) {
    return {
      ok: false,
      error: 'Workspace contains duplicate edge IDs.',
      partial: value as Partial<WorkspaceDocument>,
    };
  }

  if (value.nodes.some((node) => !isValidNodeData(node.data))) {
    return {
      ok: false,
      error: 'Workspace node data is invalid.',
      partial: value as Partial<WorkspaceDocument>,
    };
  }

  const nodeIds = new Set(value.nodes.map((n) => n.id));
  if (value.edges.some((edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target))) {
    return {
      ok: false,
      error: 'Workspace edges reference non-existent nodes.',
      partial: value as Partial<WorkspaceDocument>,
    };
  }

  if (Object.prototype.hasOwnProperty.call(value, 'schemaVersion') && (
    typeof value.schemaVersion !== 'number' || !Number.isInteger(value.schemaVersion) || value.schemaVersion < 1
  )) {
    return { ok: false, error: 'Workspace schema version is invalid.' };
  }
  if (value.name !== undefined && typeof value.name !== 'string') {
    return { ok: false, error: 'Workspace name is invalid.' };
  }
  if (value.templateId !== undefined && value.templateId !== null && typeof value.templateId !== 'string') {
    return { ok: false, error: 'Workspace template id is invalid.' };
  }
  if (value.createdAt !== undefined && typeof value.createdAt !== 'string') {
    return { ok: false, error: 'Workspace creation time is invalid.' };
  }
  if (value.updatedAt !== undefined && typeof value.updatedAt !== 'string') {
    return { ok: false, error: 'Workspace update time is invalid.' };
  }
  if (Object.prototype.hasOwnProperty.call(value, 'sourceMaterial') && typeof value.sourceMaterial !== 'string') {
    return { ok: false, error: 'Workspace source material is invalid.' };
  }

  const schemaVersion = typeof value.schemaVersion === 'number' ? value.schemaVersion : WORKSPACE_SCHEMA_VERSION;

  if (schemaVersion > WORKSPACE_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Workspace schema version ${schemaVersion} is newer than this app supports (${WORKSPACE_SCHEMA_VERSION}).`,
    };
  }

  const id = typeof value.id === 'string' && value.id.trim() ? value.id : null;
  if (!id) return { ok: false, error: 'Workspace id is required.' };

  let provenance: ProvenanceGraph | undefined;
  if (Object.prototype.hasOwnProperty.call(value, 'provenance') && value.provenance !== undefined) {
    const provenanceResult = parseProvenanceGraph(value.provenance);
    if (!provenanceResult.ok) return { ok: false, error: provenanceResult.error };
    provenance = provenanceResult.data;
  }

  let deliverableDraft: DeliverableDraft | undefined;
  if (Object.prototype.hasOwnProperty.call(value, 'deliverableDraft') && value.deliverableDraft !== undefined) {
    const draftResult = parseDeliverableDraft(value.deliverableDraft);
    if (!draftResult.ok) return { ok: false, error: draftResult.error };
    deliverableDraft = draftResult.data;
  }

  let viewport: { x: number; y: number; zoom: number } | undefined;
  if (Object.prototype.hasOwnProperty.call(value, 'viewport') && value.viewport !== undefined) {
    viewport = parseViewport(value.viewport) ?? undefined;
    if (!viewport) return { ok: false, error: 'Workspace viewport is invalid.' };
  }

  if (Object.prototype.hasOwnProperty.call(value, 'meta') && !isObject(value.meta)) {
    return { ok: false, error: 'Workspace metadata is invalid.' };
  }
  if (isObject(value.meta) && (
    (value.meta.guidedDemo !== undefined && typeof value.meta.guidedDemo !== 'boolean') ||
    (value.meta.sourceUserTouched !== undefined && typeof value.meta.sourceUserTouched !== 'boolean') ||
    (value.meta.appliedSourceFingerprint !== undefined && typeof value.meta.appliedSourceFingerprint !== 'string') ||
    (value.meta.sourceSyncStatus !== undefined && (
      typeof value.meta.sourceSyncStatus !== 'string' || !VALID_SOURCE_SYNC_STATUSES.has(value.meta.sourceSyncStatus)
    )) ||
    (value.meta.deliverableNeedsRegen !== undefined && typeof value.meta.deliverableNeedsRegen !== 'boolean')
  )) {
    return { ok: false, error: 'Workspace metadata contains an invalid field.' };
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
    nodes: verifyReviewApprovalSignatures({
      nodes: value.nodes,
      edges: value.edges,
      sourceMaterial: typeof value.sourceMaterial === 'string' ? value.sourceMaterial : '',
    }),
    edges: value.edges,
    deliverableDraft,
    provenance,
    viewport,
    meta: isObject(value.meta) ? value.meta : undefined,
  };

  return { ok: true, data: doc };
};

export const validateVersionSnapshot = (value: unknown): ValidationResult<VersionSnapshot> => {
  if (!isObject(value)) return { ok: false, error: 'Snapshot must be an object.' };
  if (typeof value.id !== 'string' || !value.id.trim()) return { ok: false, error: 'Snapshot id is invalid.' };
  if (typeof value.title !== 'string' || !value.title.trim()) return { ok: false, error: 'Snapshot title is invalid.' };
  if (typeof value.timestamp !== 'number' || !Number.isFinite(value.timestamp)) {
    return { ok: false, error: 'Snapshot timestamp is invalid.' };
  }

  if (
    (value.workspaceId !== undefined && (typeof value.workspaceId !== 'string' || !value.workspaceId.trim())) ||
    (value.workspaceName !== undefined && typeof value.workspaceName !== 'string') ||
    (value.workspaceNameAtCreation !== undefined && typeof value.workspaceNameAtCreation !== 'string') ||
    (value.sourceMaterial !== undefined && typeof value.sourceMaterial !== 'string') ||
    (value.appliedSourceFingerprint !== undefined && typeof value.appliedSourceFingerprint !== 'string') ||
    (value.templateId !== undefined && value.templateId !== null && typeof value.templateId !== 'string') ||
    (value.snapshotVersion !== undefined && (
      typeof value.snapshotVersion !== 'number' ||
      !Number.isInteger(value.snapshotVersion) ||
      value.snapshotVersion < 1 ||
      value.snapshotVersion > SNAPSHOT_FORMAT_VERSION
    ))
  ) {
    return { ok: false, error: 'Snapshot metadata is invalid.' };
  }
  if (value.snapshotVersion === SNAPSHOT_FORMAT_VERSION && (
    typeof value.workspaceId !== 'string' ||
    typeof value.sourceMaterial !== 'string'
  )) {
    return { ok: false, error: 'Full snapshot is missing its workspace or source material.' };
  }

  // Approval attestations are bound to the snapshot's source material, not the
  // workspace that happens to receive the snapshot later. Validate the graph
  // with that exact source so a valid signed snapshot remains valid and a stale
  // one is normalized to pending during inspection.
  const graph = validateWorkspaceDocument({
    id: `snapshot-${value.id}`,
    nodes: value.nodes,
    edges: value.edges,
    sourceMaterial: typeof value.sourceMaterial === 'string' ? value.sourceMaterial : '',
  });
  if (!graph.ok) return { ok: false, error: `Snapshot graph is invalid: ${graph.error}` };

  let deliverableDraft: DeliverableDraft | undefined;
  if (value.deliverableDraft !== undefined) {
    const draft = parseDeliverableDraft(value.deliverableDraft);
    if (!draft.ok) return { ok: false, error: draft.error };
    deliverableDraft = draft.data;
  }

  let provenance: ProvenanceGraph | undefined;
  if (value.provenance !== undefined) {
    const parsedProvenance = parseProvenanceGraph(value.provenance);
    if (!parsedProvenance.ok) return { ok: false, error: parsedProvenance.error };
    provenance = parsedProvenance.data;
  }

  let viewport: { x: number; y: number; zoom: number } | undefined;
  if (value.viewport !== undefined) {
    viewport = parseViewport(value.viewport) ?? undefined;
    if (!viewport) return { ok: false, error: 'Snapshot viewport is invalid.' };
  }

  return {
    ok: true,
    data: {
      id: value.id,
      timestamp: value.timestamp,
      title: value.title,
      nodes: graph.data.nodes,
      edges: graph.data.edges,
      workspaceId: value.workspaceId as string | undefined,
      workspaceName: value.workspaceName as string | undefined,
      workspaceNameAtCreation: value.workspaceNameAtCreation as string | undefined,
      snapshotVersion: value.snapshotVersion as number | undefined,
      sourceMaterial: value.sourceMaterial as string | undefined,
      deliverableDraft,
      provenance,
      templateId: value.templateId as string | null | undefined,
      viewport,
      appliedSourceFingerprint: value.appliedSourceFingerprint as string | undefined,
    },
  };
};

export const validateWorkspaceIndex = (value: unknown): ValidationResult<WorkspaceIndex> => {
  if (!isObject(value)) return { ok: false, error: 'Workspace index must be an object.' };
  if (Object.prototype.hasOwnProperty.call(value, 'schemaVersion') && (
    typeof value.schemaVersion !== 'number' || !Number.isInteger(value.schemaVersion) ||
    value.schemaVersion < 1 || value.schemaVersion > WORKSPACE_SCHEMA_VERSION
  )) {
    return { ok: false, error: 'Workspace index schema version is invalid or unsupported.' };
  }
  if (!Array.isArray(value.workspaces)) return { ok: false, error: 'Workspace index is missing workspaces[].' };

  if (value.workspaces.some(
    (entry) =>
      !isObject(entry) ||
      typeof entry.id !== 'string' ||
      !entry.id.trim() ||
      typeof entry.name !== 'string' ||
      !entry.name.trim() ||
      typeof entry.updatedAt !== 'string' ||
      (entry.templateId !== undefined && entry.templateId !== null && typeof entry.templateId !== 'string'),
  )) {
    return { ok: false, error: 'Workspace index contains an invalid workspace entry.' };
  }

  const workspaces = value.workspaces.map((entry) => {
    const record = entry as Record<string, unknown>;
    return {
      id: record.id as string,
      name: record.name as string,
      updatedAt: record.updatedAt as string,
      templateId:
        typeof record.templateId === 'string' || record.templateId === null
          ? (record.templateId as string | null)
          : null,
    };
  });
  if (!hasUniqueCaseInsensitiveIds(workspaces)) {
    return { ok: false, error: 'Workspace index contains duplicate workspace ids.' };
  }
  if (
    value.activeWorkspaceId !== undefined &&
    value.activeWorkspaceId !== null &&
    (typeof value.activeWorkspaceId !== 'string' || !workspaces.some((entry) => entry.id === value.activeWorkspaceId))
  ) {
    return { ok: false, error: 'Workspace index active workspace is invalid.' };
  }

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
    if (value.formatVersion !== undefined && value.formatVersion !== 1) {
      return { ok: false, error: 'Project export format version is unsupported.' };
    }
    if (value.exportedAt !== undefined && typeof value.exportedAt !== 'string') {
      return { ok: false, error: 'Project export timestamp is invalid.' };
    }
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

  // The historical output-panel export was a title/nodes/edges object. Do not
  // reinterpret a malformed current document as that older, lossy format.
  const documentFields = [
    'schemaVersion', 'id', 'name', 'templateId', 'createdAt', 'updatedAt',
    'sourceMaterial', 'deliverableDraft', 'provenance', 'viewport', 'meta', 'format',
  ];
  const isLegacyOutputExport =
    typeof value.title === 'string' &&
    isNodeArray(value.nodes) &&
    isEdgeArray(value.edges) &&
    !documentFields.some((field) => Object.prototype.hasOwnProperty.call(value, field));
  if (isLegacyOutputExport) {
    const now = new Date().toISOString();
    const candidate = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      id: `imported_${Date.now()}`,
      name: value.title as string,
      templateId: null,
      createdAt: now,
      updatedAt: now,
      sourceMaterial: '',
      nodes: (value.nodes as AppNode[]).map((node) => ({
        ...node,
        data: {
          ...node.data,
          title: node.data.title ?? `New ${node.type} step`,
          description: node.data.description ?? '',
          content: node.data.content ?? '',
        },
      })),
      edges: value.edges as AppEdge[],
    };
    const validated = validateWorkspaceDocument(candidate);
    if (!validated.ok) return { ok: false, error: `Legacy project is invalid: ${validated.error}` };
    return {
      ok: true,
      data: {
        format: 'weavestudio-project',
        formatVersion: 1,
        exportedAt: now,
        workspace: validated.data,
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
