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
  saveSnapshot,
} from './workspaceStore';
import { createProvenanceClaim, createSourceFragment, fingerprintText } from './provenance';
import type { ProvenanceGraph, VersionSnapshot, WorkspaceDocument } from '../types';

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
    localStorage.setItem('weavestudio_marker', JSON.stringify({ state: 'before' }));
    localStorage.setItem('unrelated_key', 'keep');
    const inspected = inspectFullBrowserBackup({
      weavestudio_workspace_index: JSON.stringify({ version: 2, activeWorkspaceId: null, workspaces: [] }),
      weavestudio_marker: JSON.stringify({ state: 'after' }),
    });
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;

    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    let injected = false;
    setItem.mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'weavestudio_marker' && value.includes('after') && !injected) {
        injected = true;
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    });

    const result = restoreFullBrowserBackup(inspected.data);
    setItem.mockRestore();

    expect(result.ok).toBe(false);
    expect(localStorage.getItem('weavestudio_marker')).toBe(JSON.stringify({ state: 'before' }));
    expect(localStorage.getItem('unrelated_key')).toBe('keep');
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
});

describe('provenance snapshot portability', () => {
  beforeEach(() => localStorage.clear());

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
