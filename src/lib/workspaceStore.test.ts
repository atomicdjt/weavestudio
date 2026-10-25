// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applySnapshotToWorkspace,
  buildProjectExport,
  collectFullBrowserBackup,
  createWorkspace,
  importProjectFile,
  inspectFullBrowserBackup,
  restoreFullBrowserBackup,
  saveWorkspaceDocument,
  saveSnapshot,
} from './workspaceStore';
import { createProvenanceClaim, createSourceFragment, fingerprintText } from './provenance';
import type { ProvenanceGraph, VersionSnapshot, WorkspaceDocument } from '../types';
import { INDEX_KEY, SNAPSHOTS_KEY, workspaceKey } from './migrations';

const ownedBytes = (): Record<string, string> => collectFullBrowserBackup();

const buildTraceableWorkspace = (): WorkspaceDocument => {
  const sourceMaterial = 'Alpha evidence. Beta evidence.';
  const fragment = createSourceFragment({
    sourceMaterial,
    startOffset: 0,
    endOffset: 15,
    id: 'frag_portable',
  });
  const claim = createProvenanceClaim({
    id: 'claim_portable',
    nodeId: 'out_1',
    claimText: 'Alpha conclusion',
    sourceFragmentIds: [fragment.id],
    derivation: 'direct',
  });
  const base = createWorkspace({
    name: 'Portable provenance',
    sourceMaterial,
    nodes: [
      {
        id: 'out_1',
        type: 'output',
        position: { x: 0, y: 0 },
        data: { title: 'Output', description: '', content: 'Alpha conclusion' },
      },
    ],
    edges: [],
  });
  return {
    ...base,
    provenance: {
      version: 1,
      sourceFingerprint: fingerprintText(sourceMaterial),
      fragments: [fragment],
      claims: [claim],
    },
  };
};

describe('full browser backup recovery', () => {
  beforeEach(() => localStorage.clear());

  it('rejects settings-only and malformed-snapshot backups before changing storage', () => {
    localStorage.setItem('weavestudio_tour_dismissed', '1');
    const beforeSettingsOnly = ownedBytes();

    const settingsOnly = inspectFullBrowserBackup(beforeSettingsOnly);
    expect(settingsOnly.ok).toBe(false);
    expect(ownedBytes()).toEqual(beforeSettingsOnly);

    localStorage.clear();
    const workspace = createWorkspace({ name: 'Snapshot source' });
    const backup = ownedBytes();
    backup[SNAPSHOTS_KEY] = JSON.stringify([{ id: 5, nodes: 'not-an-array' }]);
    const beforeMalformed = ownedBytes();

    const malformedSnapshots = inspectFullBrowserBackup(backup);
    expect(malformedSnapshots.ok).toBe(false);
    expect(ownedBytes()).toEqual(beforeMalformed);
    expect(backup[workspaceKey(workspace.id)]).toBeDefined();
  });

  it('rejects corrupt data before changing browser storage', () => {
    localStorage.setItem('weavestudio_marker', 'unchanged');
    const inspected = inspectFullBrowserBackup({ weavestudio_workspace_index: '{bad json' });
    expect(inspected.ok).toBe(false);
    if (!inspected.ok) expect(inspected.error).toMatch(/invalid/i);
    expect(localStorage.getItem('weavestudio_marker')).toBe('unchanged');
  });

  it('stages and restores only owned keys', () => {
    createWorkspace({ name: 'Recovery source' });
    const backup = collectFullBrowserBackup();
    localStorage.setItem('unrelated_key', 'keep');
    localStorage.setItem('weavestudio_marker', 'remove');
    const inspected = inspectFullBrowserBackup(backup);
    expect(inspected.ok).toBe(true);
    if (inspected.ok) expect(restoreFullBrowserBackup(inspected.data).ok).toBe(true);
    expect(localStorage.getItem('unrelated_key')).toBe('keep');
    expect(localStorage.getItem('weavestudio_marker')).toBeNull();
  });

  it('rolls back owned records when a staged restore write fails', () => {
    createWorkspace({ name: 'Restore source' });
    const backup = ownedBytes();
    backup.weavestudio_tour_dismissed = '1';
    localStorage.clear();
    createWorkspace({ name: 'Existing work' });
    localStorage.setItem('weavestudio_tour_dismissed', '0');
    const before = ownedBytes();
    localStorage.setItem('unrelated_key', 'keep');
    const inspected = inspectFullBrowserBackup(backup);
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;

    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    let injected = false;
    setItem.mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'weavestudio_tour_dismissed' && value === '1' && !injected) {
        injected = true;
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    });

    const result = restoreFullBrowserBackup(inspected.data);
    setItem.mockRestore();

    expect(result.ok).toBe(false);
    expect(ownedBytes()).toEqual(before);
    expect(localStorage.getItem('unrelated_key')).toBe('keep');
  });

  it('verifies every restored byte and rolls back when storage silently drops a record', () => {
    const source = createWorkspace({ name: 'Restore source' });
    const backup = ownedBytes();
    localStorage.clear();
    createWorkspace({ name: 'Existing work' });
    const before = ownedBytes();

    const inspected = inspectFullBrowserBackup(backup);
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;

    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    setItem.mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === workspaceKey(source.id) && value === backup[key]) return;
      return originalSetItem.call(this, key, value);
    });

    const result = restoreFullBrowserBackup(inspected.data);
    setItem.mockRestore();

    expect(result.ok).toBe(false);
    expect(ownedBytes()).toEqual(before);
  });

  it('does not report a document save when its matching workspace index write fails', () => {
    const workspace = createWorkspace({ name: 'Durable title' });
    const before = ownedBytes();
    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    setItem.mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === INDEX_KEY && value.includes('Updated title')) {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    });

    const result = saveWorkspaceDocument({ ...workspace, name: 'Updated title' });
    setItem.mockRestore();

    expect(result.status).toBe('quota');
    expect(ownedBytes()).toEqual(before);
  });

  it('preserves every owned byte when storage persistently denies writes to existing records', () => {
    const workspace = createWorkspace({ name: 'Workspace A' });
    createWorkspace({ name: 'Workspace B' });
    saveSnapshot('Existing checkpoint', workspace);
    const before = ownedBytes();
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError');
    });

    const result = saveWorkspaceDocument({ ...workspace, name: 'Edited workspace A' });

    setItem.mockRestore();
    expect(result.status).toBe('error');
    expect(ownedBytes()).toEqual(before);
  });

  it('returns a save failure instead of throwing when reading an existing record is denied', () => {
    const workspace = createWorkspace({ name: 'Protected read' });
    const before = ownedBytes();
    const originalGetItem = Storage.prototype.getItem;
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key: string) {
      if (key === workspaceKey(workspace.id)) throw new DOMException('Storage is blocked', 'SecurityError');
      return originalGetItem.call(this, key);
    });

    const result = saveWorkspaceDocument({ ...workspace, name: 'Edited' });

    getItem.mockRestore();
    expect(result.status).toBe('error');
    expect(ownedBytes()).toEqual(before);
  });
});

describe('project provenance portability', () => {
  beforeEach(() => localStorage.clear());

  it('preserves provenance IDs through project export and validated import', () => {
    const workspace = buildTraceableWorkspace();
    const exported = buildProjectExport(workspace);
    const imported = importProjectFile(exported, 'as-new');

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.workspace.provenance?.fragments.map((item) => item.id)).toEqual(['frag_portable']);
    expect(imported.workspace.provenance?.claims.map((item) => item.id)).toEqual(['claim_portable']);
    expect(imported.workspace.provenance?.sourceFingerprint).toBe(fingerprintText(workspace.sourceMaterial));
  });

  it('rejects a full-browser backup from import-as-new without mutating storage', () => {
    createWorkspace({ name: 'Backup source' });
    const backup = ownedBytes();
    const before = ownedBytes();

    const imported = importProjectFile(backup, 'as-new');

    expect(imported.ok).toBe(false);
    if (!imported.ok) expect(imported.error).toMatch(/restore/i);
    expect(ownedBytes()).toEqual(before);
  });

  it('reports a failed imported document write and restores exact prior bytes', () => {
    const source = createWorkspace({ name: 'Import source' });
    const project = buildProjectExport(source);
    const before = ownedBytes();
    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key.startsWith('weavestudio_v1_ws_') && !Object.prototype.hasOwnProperty.call(before, key)) {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    });

    const result = importProjectFile(project, 'as-new');

    setItem.mockRestore();
    expect(result.ok).toBe(false);
    expect(ownedBytes()).toEqual(before);
  });
});

describe('provenance snapshot portability', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips an edited full draft through project import and a snapshot', () => {
    const workspace = { ...buildTraceableWorkspace(), deliverableDraft: { title: 'Edited draft', markdown: '# Edited\n\nComplete body and final line.', userEdited: true } };
    const imported = importProjectFile(buildProjectExport(workspace), 'as-new');
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error);
    expect(imported.workspace.deliverableDraft).toEqual(workspace.deliverableDraft);
    const snapshot = saveSnapshot('Full draft', imported.workspace);
    const recovered = applySnapshotToWorkspace({ ...imported.workspace, deliverableDraft: undefined }, snapshot);
    expect(recovered.workspace.deliverableDraft).toEqual(workspace.deliverableDraft);
  });

  it('deeply preserves provenance through save and full snapshot restore', () => {
    const workspace = buildTraceableWorkspace();
    const expected: ProvenanceGraph = structuredClone(workspace.provenance!);
    const snapshot = saveSnapshot('Traceable checkpoint', workspace);

    expect(snapshot.provenance).toEqual(expected);
    expect(snapshot.provenance).not.toBe(workspace.provenance);

    const mutated: WorkspaceDocument = { ...workspace, provenance: undefined };
    const restored = applySnapshotToWorkspace(mutated, snapshot);
    expect(restored.legacyIncomplete).toBe(false);
    expect(restored.workspace.provenance).toEqual(expected);
    expect(restored.workspace.provenance).not.toBe(snapshot.provenance);
  });

  it('clears provenance when restoring a pre-provenance full snapshot', () => {
    const workspace = buildTraceableWorkspace();
    const legacyFullSnapshot: VersionSnapshot = {
      id: 'snap_pre_provenance',
      timestamp: 1,
      title: 'Pre provenance',
      snapshotVersion: 2,
      workspaceId: workspace.id,
      nodes: structuredClone(workspace.nodes),
      edges: structuredClone(workspace.edges),
      sourceMaterial: workspace.sourceMaterial,
      deliverableDraft: workspace.deliverableDraft,
      templateId: workspace.templateId,
    };

    const restored = applySnapshotToWorkspace(workspace, legacyFullSnapshot);
    expect(restored.legacyIncomplete).toBe(false);
    expect(restored.workspace.provenance).toBeUndefined();
  });
});
