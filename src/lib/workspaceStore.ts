import type {
  AppEdge,
  AppNode,
  ProjectExportFile,
  SaveStatus,
  VersionSnapshot,
  WorkspaceDocument,
  WorkspaceIndex,
} from '../types';
import { SNAPSHOT_FORMAT_VERSION, WORKSPACE_SCHEMA_VERSION } from '../types';
import { verifyReviewApprovalSignatures } from './reviewState';
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
  validateVersionSnapshot,
  validateWorkspaceDocument,
  validateWorkspaceIndex,
} from './schema';

export type SaveResult = { status: SaveStatus; error?: string };

const ownedKey = (key: string): boolean => key.startsWith('weavestudio_');

const collectOwnedRecords = (): Record<string, string> => {
  const records: Record<string, string> = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && ownedKey(key)) records[key] = localStorage.getItem(key) ?? '';
  }
  return records;
};

const recordsMatch = (actual: Record<string, string>, expected: Record<string, string>): boolean => {
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  return actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index] && actual[key] === expected[key]);
};

const storageFailure = (error: unknown, fallback = 'Could not save to local storage.'): SaveResult => {
  const message = error instanceof Error ? error.message : String(error);
  const errorName = typeof error === 'object' && error !== null && 'name' in error
    ? String((error as { name?: unknown }).name)
    : '';
  if (errorName === 'QuotaExceededError' || /quota|storage is full|storage limit/i.test(message)) {
    return { status: 'quota', error: 'Browser storage is full. Export a backup, then free space or delete old workspaces.' };
  }
  return { status: 'error', error: fallback };
};

const replaceOwnedRecordsUnchecked = (records: Record<string, string>): void => {
  const current = collectOwnedRecords();
  for (const [key, value] of Object.entries(records)) {
    if (current[key] !== value) localStorage.setItem(key, value);
  }
  const afterWrites = collectOwnedRecords();
  for (const [key, value] of Object.entries(records)) {
    if (afterWrites[key] !== value) throw new Error(`Browser storage did not retain ${key}.`);
  }
  for (const key of Object.keys(afterWrites)) {
    if (!Object.prototype.hasOwnProperty.call(records, key)) localStorage.removeItem(key);
  }
  if (!recordsMatch(collectOwnedRecords(), records)) {
    throw new Error('Browser storage did not retain every record.');
  }
};

/**
 * Commit all owned records atomically as far as Web Storage permits. A failed or
 * silently dropped write is detected and the exact previous key/value set is
 * restored before the failure is reported.
 */
const replaceOwnedRecords = (records: Record<string, string>): SaveResult => {
  let previous: Record<string, string> | null = null;
  try {
    previous = collectOwnedRecords();
    replaceOwnedRecordsUnchecked(records);
    return { status: 'saved' };
  } catch (error) {
    if (!previous) return storageFailure(error);
    try {
      replaceOwnedRecordsUnchecked(previous);
    } catch {
      return {
        status: 'error',
        error: 'Could not save browser storage and could not fully restore the previous WeaveStudio records.',
      };
    }
    return storageFailure(error);
  }
};

const writeJson = (key: string, value: unknown): SaveResult => {
  try {
    const records = collectOwnedRecords();
    records[key] = JSON.stringify(value);
    return replaceOwnedRecords(records);
  } catch (error) {
    return storageFailure(error);
  }
};

export const loadIndex = (): WorkspaceIndex => {
  const { index } = ensureMigratedStore();
  return index;
};

export const saveIndex = (index: WorkspaceIndex): SaveResult => writeJson(INDEX_KEY, index);

const persistWorkspaceAndIndex = (
  workspace: WorkspaceDocument,
  index: WorkspaceIndex,
  options: { mirrorLegacyWorkspace?: boolean } = {},
): SaveResult => {
  try {
    const records = collectOwnedRecords();
    records[workspaceKey(workspace.id)] = JSON.stringify(workspace);
    records[INDEX_KEY] = JSON.stringify(index);
    if (options.mirrorLegacyWorkspace) {
      records[LEGACY_WORKSPACE_KEY] = JSON.stringify({ nodes: workspace.nodes, edges: workspace.edges });
    }
    return replaceOwnedRecords(records);
  } catch (error) {
    return storageFailure(error);
  }
};

const failWrite = (result: SaveResult): never => {
  throw new Error(result.error ?? 'Could not save WeaveStudio data.');
};

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
  meta?: WorkspaceDocument['meta'];
  deliverableDraft?: WorkspaceDocument['deliverableDraft'];
  id?: string;
}): WorkspaceDocument => {
  const now = new Date().toISOString();
  const sourceMaterial = options?.sourceMaterial ?? '';
  const doc: WorkspaceDocument = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: options?.id ?? createId('ws'),
    name: options?.name?.trim() || 'Untitled workspace',
    templateId: options?.templateId ?? null,
    createdAt: now,
    updatedAt: now,
    sourceMaterial,
    nodes: structuredClone(options?.nodes ?? []),
    edges: structuredClone(options?.edges ?? []),
    deliverableDraft: options?.deliverableDraft
      ? structuredClone(options.deliverableDraft)
      : undefined,
    meta: {
      appliedSourceFingerprint: sourceMaterial,
      sourceSyncStatus: 'in_sync',
      ...options?.meta,
    },
  };

  const index = loadIndex();
  index.workspaces = [
    { id: doc.id, name: doc.name, updatedAt: doc.updatedAt, templateId: doc.templateId },
    ...index.workspaces.filter((entry) => entry.id !== doc.id),
  ];
  index.activeWorkspaceId = doc.id;
  const result = persistWorkspaceAndIndex(doc, index);
  if (result.status !== 'saved') failWrite(result);
  return doc;
};

/** Stable, idempotent guided-demo creation. Existing user duplicates are intentionally preserved. */
export const getOrCreateGuidedDemo = (factory: () => WorkspaceDocument): WorkspaceDocument => {
  const index = loadIndex();
  for (const entry of index.workspaces) {
    const existing = loadWorkspaceById(entry.id);
    if (existing?.meta?.guidedDemo === true) {
      const result = setActiveWorkspaceId(existing.id);
      if (result.status !== 'saved') failWrite(result);
      return existing;
    }
  }
  const demo = factory();
  return createWorkspace({
    id: 'weavestudio-guided-demo', name: demo.name, templateId: demo.templateId,
    nodes: demo.nodes, edges: demo.edges, sourceMaterial: demo.sourceMaterial,
    deliverableDraft: demo.deliverableDraft, meta: { ...demo.meta, guidedDemo: true },
  });
};

export const saveWorkspaceDocument = (doc: WorkspaceDocument): SaveResult => {
  try {
    const updated: WorkspaceDocument = {
      ...doc,
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    };
    const index = loadIndex();
    const entry = {
      id: updated.id,
      name: updated.name,
      updatedAt: updated.updatedAt,
      templateId: updated.templateId,
    };
    const nextIndex: WorkspaceIndex = {
      ...index,
      workspaces: [entry, ...index.workspaces.filter((item) => item.id !== updated.id)],
      activeWorkspaceId: updated.id,
    };
    return persistWorkspaceAndIndex(updated, nextIndex, { mirrorLegacyWorkspace: true });
  } catch (error) {
    return storageFailure(error);
  }
};

export const setActiveWorkspaceId = (id: string | null): SaveResult => {
  try {
    const index = loadIndex();
    if (id !== null && !index.workspaces.some((entry) => entry.id === id)) {
      return { status: 'error', error: 'Cannot activate a workspace that is not present in the workspace index.' };
    }
    index.activeWorkspaceId = id;
    return saveIndex(index);
  } catch (error) {
    return storageFailure(error);
  }
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
  const index = loadIndex();
  index.workspaces = [
    { id: copy.id, name: copy.name, updatedAt: copy.updatedAt, templateId: copy.templateId },
    ...index.workspaces,
  ];
  index.activeWorkspaceId = copy.id;
  const result = persistWorkspaceAndIndex(copy, index);
  if (result.status !== 'saved') failWrite(result);
  return copy;
};

export const deleteWorkspace = (id: string): SaveResult => {
  try {
    const index = loadIndex();
    index.workspaces = index.workspaces.filter((entry) => entry.id !== id);
    if (index.activeWorkspaceId === id) {
      index.activeWorkspaceId = index.workspaces[0]?.id ?? null;
    }
    const records = collectOwnedRecords();
    delete records[workspaceKey(id)];
    records[INDEX_KEY] = JSON.stringify(index);
    const snaps = getSnapshots().filter((snap) => snap.workspaceId !== id);
    records[SNAPSHOTS_KEY] = JSON.stringify(snaps);
    records[LEGACY_VERSIONS_KEY] = JSON.stringify(snaps);
    return replaceOwnedRecords(records);
  } catch (error) {
    return storageFailure(error);
  }
};

export const renameWorkspace = (id: string, name: string): WorkspaceDocument | null => {
  const doc = loadWorkspaceById(id);
  if (!doc) return null;
  doc.name = name.trim() || doc.name;
  const result = saveWorkspaceDocument(doc);
  if (result.status !== 'saved') failWrite(result);
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
  // Full browser backups replace a complete record set, so they must go through
  // the staged restore UI rather than behaving like a single workspace import.
  if (isLegacyLocalStorageBackup(raw)) {
    return {
      ok: false,
      error: 'This is a full browser backup. Use “Restore full browser backup” so every record is validated before replacing local data.',
    };
  }

  const validated = validateProjectExportFile(raw);
  if (!validated.ok) return { ok: false, error: validated.error };

  try {
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
      const result = saveWorkspaceDocument(merged);
      if (result.status !== 'saved') return { ok: false, error: result.error ?? 'Could not replace the active workspace.' };
      return { ok: true, workspace: merged };
    }

    const asNew: WorkspaceDocument = {
      ...incoming,
      id: createId('ws'),
      name: incoming.name.endsWith('(imported)') ? incoming.name : `${incoming.name} (imported)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const index = loadIndex();
    index.workspaces = [
      { id: asNew.id, name: asNew.name, updatedAt: asNew.updatedAt, templateId: asNew.templateId },
      ...index.workspaces,
    ];
    index.activeWorkspaceId = asNew.id;
    const result = persistWorkspaceAndIndex(asNew, index);
    if (result.status !== 'saved') return { ok: false, error: result.error ?? 'Could not create the imported workspace.' };
    return { ok: true, workspace: asNew };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not import the project.' };
  }
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

export const saveRecoverySnapshot = (title: string, workspace: WorkspaceDocument): { snapshot: VersionSnapshot; result: SaveResult } => {
  try {
    const snapshot = saveSnapshot(title, workspace);
    return { snapshot, result: { status: 'saved' } };
  } catch (error) {
    const now = Date.now();
    return {
      snapshot: {
        id: 'unsaved-recovery-snapshot',
        timestamp: now,
        title,
        nodes: [],
        edges: [],
      },
      result: storageFailure(error, 'Could not save a recovery checkpoint.'),
    };
  }
};

export const saveSnapshot = (
  title: string,
  workspace: WorkspaceDocument,
): VersionSnapshot => {
  const snapshot: VersionSnapshot = {
    id: createId('snap'),
    timestamp: Date.now(),
    title,
    snapshotVersion: SNAPSHOT_FORMAT_VERSION,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceNameAtCreation: workspace.name,
    nodes: structuredClone(workspace.nodes),
    edges: structuredClone(workspace.edges),
    sourceMaterial: workspace.sourceMaterial,
    deliverableDraft: workspace.deliverableDraft
      ? structuredClone(workspace.deliverableDraft)
      : undefined,
    provenance: workspace.provenance ? structuredClone(workspace.provenance) : undefined,
    templateId: workspace.templateId,
    viewport: workspace.viewport ? { ...workspace.viewport } : undefined,
    appliedSourceFingerprint:
      typeof workspace.meta?.appliedSourceFingerprint === 'string'
        ? workspace.meta.appliedSourceFingerprint
        : workspace.sourceMaterial,
  };
  const next = [...getSnapshots(), snapshot];
  const records = collectOwnedRecords();
  records[SNAPSHOTS_KEY] = JSON.stringify(next);
  records[LEGACY_VERSIONS_KEY] = JSON.stringify(next);
  const result = replaceOwnedRecords(records);
  if (result.status !== 'saved') failWrite(result);
  return snapshot;
};

/**
 * Apply a snapshot onto a workspace document.
 * Full snapshots (v2) restore deliverable + source.
 * Legacy snapshots restore graph only and invalidate deliverable.
 */
export const applySnapshotToWorkspace = (
  workspace: WorkspaceDocument,
  snapshot: VersionSnapshot,
): { workspace: WorkspaceDocument; legacyIncomplete: boolean } => {
  const validation = validateVersionSnapshot(snapshot);
  if (!validation.ok) throw new Error(`Invalid snapshot: ${validation.error}`);
  if (snapshot.workspaceId && snapshot.workspaceId !== workspace.id) {
    throw new Error('This snapshot belongs to another workspace. Create a workspace from it instead.');
  }
  const isFull =
    (snapshot.snapshotVersion ?? 1) >= SNAPSHOT_FORMAT_VERSION ||
    snapshot.sourceMaterial !== undefined ||
    snapshot.deliverableDraft !== undefined;

  if (isFull) {
    const nodes = structuredClone(snapshot.nodes);
    const edges = structuredClone(snapshot.edges);
    const sourceMaterial = snapshot.sourceMaterial ?? '';
    return {
      legacyIncomplete: false,
      workspace: {
        ...workspace,
        nodes: verifyReviewApprovalSignatures({ nodes, edges, sourceMaterial }),
        edges,
        sourceMaterial,
        deliverableDraft: snapshot.deliverableDraft
          ? structuredClone(snapshot.deliverableDraft)
          : undefined,
        provenance: snapshot.provenance ? structuredClone(snapshot.provenance) : undefined,
        templateId:
          snapshot.templateId !== undefined ? snapshot.templateId : workspace.templateId,
        viewport: snapshot.viewport ? { ...snapshot.viewport } : workspace.viewport,
        meta: {
          ...workspace.meta,
          appliedSourceFingerprint:
            snapshot.appliedSourceFingerprint ?? snapshot.sourceMaterial ?? '',
          sourceSyncStatus: 'in_sync',
          deliverableNeedsRegen: false,
        },
      },
    };
  }

  // Legacy: nodes/edges only — invalidate deliverable so it cannot stay silently stale
  return {
    legacyIncomplete: true,
    workspace: {
      ...workspace,
      nodes: verifyReviewApprovalSignatures({
        nodes: structuredClone(snapshot.nodes),
        edges: structuredClone(snapshot.edges),
        sourceMaterial: workspace.sourceMaterial,
      }),
      edges: structuredClone(snapshot.edges),
      deliverableDraft: undefined,
      provenance: undefined,
      meta: {
        ...workspace.meta,
        deliverableNeedsRegen: true,
        sourceSyncStatus: 'unknown',
      },
    },
  };
};

export const deleteSnapshot = (id: string): SaveResult => {
  try {
    const next = getSnapshots().filter((snap) => snap.id !== id);
    const records = collectOwnedRecords();
    records[SNAPSHOTS_KEY] = JSON.stringify(next);
    records[LEGACY_VERSIONS_KEY] = JSON.stringify(next);
    return replaceOwnedRecords(records);
  } catch (error) {
    return storageFailure(error);
  }
};

export const clearAllLocalData = (): SaveResult => replaceOwnedRecords({});

/** Export only WeaveStudio-owned records for a portable full-browser backup. */
export const collectFullBrowserBackup = (): Record<string, string> => {
  return collectOwnedRecords();
};

export type FullBrowserBackup = { records: Record<string, string>; workspaceCount: number; snapshotCount: number };

const preferenceKeys = new Set([
  'weavestudio_tour_dismissed',
  'weavestudio_onboarding_dismissed',
  'weavestudio_coach_dismissed',
]);

const isRecognizedBackupKey = (key: string): boolean =>
  key === INDEX_KEY ||
  key === SNAPSHOTS_KEY ||
  key === LEGACY_VERSIONS_KEY ||
  key === LEGACY_WORKSPACE_KEY ||
  key.startsWith('weavestudio_v1_ws_') ||
  preferenceKeys.has(key);

const parseBackupJson = (records: Record<string, unknown>, key: string): { ok: true; data: unknown } | { ok: false } => {
  try {
    return { ok: true, data: JSON.parse(records[key] as string) };
  } catch {
    return { ok: false };
  }
};

/** Validate every owned record before a restore can mutate browser storage. */
export const inspectFullBrowserBackup = (raw: unknown): { ok: true; data: FullBrowserBackup } | { ok: false; error: string } => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Backup must be a JSON object.' };
  const records = raw as Record<string, unknown>;
  const keys = Object.keys(records);
  if (!keys.length || keys.some((key) => !ownedKey(key) || !isRecognizedBackupKey(key) || typeof records[key] !== 'string')) {
    return { ok: false, error: 'Backup contains invalid or non-WeaveStudio records.' };
  }
  const normalizedRecords = { ...(records as Record<string, string>) };

  if (!Object.prototype.hasOwnProperty.call(records, INDEX_KEY)) {
    return { ok: false, error: 'Backup is missing its workspace index and cannot safely replace local data.' };
  }

  const parsedIndex = parseBackupJson(records, INDEX_KEY);
  if (!parsedIndex.ok) return { ok: false, error: 'Backup index contains invalid JSON and was not restored.' };
  const index = validateWorkspaceIndex(parsedIndex.data);
  if (!index.ok) return { ok: false, error: `Backup index is invalid: ${index.error}` };
  if (index.data.workspaces.length === 0) {
    return { ok: false, error: 'Backup has no workspace records and cannot safely replace local data.' };
  }

  const indexedIds = new Set(index.data.workspaces.map((entry) => entry.id));
  for (const entry of index.data.workspaces) {
    const key = workspaceKey(entry.id);
    if (!Object.prototype.hasOwnProperty.call(records, key)) {
      return { ok: false, error: `Backup is missing workspace “${entry.name}”.` };
    }
    const parsedWorkspace = parseBackupJson(records, key);
    if (!parsedWorkspace.ok) return { ok: false, error: `Workspace “${entry.name}” contains invalid JSON.` };
    const valid = validateWorkspaceDocument(parsedWorkspace.data);
    if (!valid.ok) return { ok: false, error: `Workspace “${entry.name}” is invalid: ${valid.error}` };
    if (valid.data.id !== entry.id || valid.data.name !== entry.name) {
      return { ok: false, error: `Workspace “${entry.name}” does not match its index entry.` };
    }
    normalizedRecords[key] = JSON.stringify(valid.data);
  }

  for (const key of keys.filter((item) => item.startsWith('weavestudio_v1_ws_'))) {
    const id = key.slice('weavestudio_v1_ws_'.length);
    if (!indexedIds.has(id)) return { ok: false, error: 'Backup contains an unindexed workspace record.' };
  }

  if (Object.prototype.hasOwnProperty.call(records, LEGACY_WORKSPACE_KEY)) {
    const legacy = parseBackupJson(records, LEGACY_WORKSPACE_KEY);
    if (!legacy.ok || !legacy.data || typeof legacy.data !== 'object') {
      return { ok: false, error: 'Backup legacy workspace record is invalid.' };
    }
    const candidate = legacy.data as { nodes?: unknown; edges?: unknown };
    const valid = validateWorkspaceDocument({ id: 'legacy-backup', nodes: candidate.nodes, edges: candidate.edges });
    if (!valid.ok) return { ok: false, error: `Backup legacy workspace is invalid: ${valid.error}` };
  }

  let snapshotCount = 0;
  for (const key of [SNAPSHOTS_KEY, LEGACY_VERSIONS_KEY]) {
    if (!Object.prototype.hasOwnProperty.call(records, key)) continue;
    const parsedSnapshots = parseBackupJson(records, key);
    if (!parsedSnapshots.ok || !Array.isArray(parsedSnapshots.data)) {
      return { ok: false, error: 'Backup snapshots are invalid.' };
    }
    for (const snapshot of parsedSnapshots.data) {
      const valid = validateVersionSnapshot(snapshot);
      if (!valid.ok) return { ok: false, error: `Backup snapshot is invalid: ${valid.error}` };
      if (valid.data.workspaceId && !indexedIds.has(valid.data.workspaceId)) {
        return { ok: false, error: 'Backup snapshot references an unknown workspace.' };
      }
    }
    if (key === SNAPSHOTS_KEY || !Object.prototype.hasOwnProperty.call(records, SNAPSHOTS_KEY)) {
      snapshotCount = parsedSnapshots.data.length;
    }
  }

  return {
    ok: true,
    data: {
      records: normalizedRecords,
      workspaceCount: index.data.workspaces.length,
      snapshotCount,
    },
  };
};

/** Replace only owned keys after a successful staged inspection. */
export const restoreFullBrowserBackup = (backup: FullBrowserBackup): { ok: true } | { ok: false; error: string } => {
  const inspected = inspectFullBrowserBackup(backup.records);
  if (!inspected.ok) return { ok: false, error: inspected.error };
  const result = replaceOwnedRecords(inspected.data.records);
  if (result.status === 'saved') return { ok: true };
  return {
    ok: false,
    error: result.error ?? 'Could not write the backup. Previous WeaveStudio data was restored.',
  };
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
