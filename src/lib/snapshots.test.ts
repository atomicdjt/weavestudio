import { describe, expect, it } from 'vitest';
import { applySnapshotToWorkspace } from './workspaceStore';
import type { VersionSnapshot, WorkspaceDocument } from '../types';
import { SNAPSHOT_FORMAT_VERSION, WORKSPACE_SCHEMA_VERSION } from '../types';

const base: WorkspaceDocument = {
  schemaVersion: WORKSPACE_SCHEMA_VERSION,
  id: 'ws1',
  name: 'Active',
  templateId: 'research-brief',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sourceMaterial: 'current source',
  nodes: [
    {
      id: 'n1',
      type: 'input',
      position: { x: 0, y: 0 },
      data: { title: 'In', description: '', content: 'current' },
    },
  ],
  edges: [],
  deliverableDraft: {
    title: 'Stale draft',
    markdown: '# Stale',
    userEdited: true,
  },
};

describe('applySnapshotToWorkspace', () => {
  it('restores full v2 snapshot including deliverable and source', () => {
    const snap: VersionSnapshot = {
      id: 's1',
      timestamp: Date.now(),
      title: 'Checkpoint',
      snapshotVersion: SNAPSHOT_FORMAT_VERSION,
      workspaceId: 'ws1',
      nodes: [
        {
          id: 'n2',
          type: 'output',
          position: { x: 10, y: 10 },
          data: { title: 'Out', description: '', content: 'restored body' },
        },
      ],
      edges: [],
      sourceMaterial: 'snap source',
      deliverableDraft: {
        title: 'Snap title',
        markdown: '# Snap body',
        userEdited: true,
      },
      templateId: 'meeting-action-plan',
      appliedSourceFingerprint: 'snap source',
    };

    const { workspace, legacyIncomplete } = applySnapshotToWorkspace(base, snap);
    expect(legacyIncomplete).toBe(false);
    expect(workspace.sourceMaterial).toBe('snap source');
    expect(workspace.deliverableDraft?.markdown).toBe('# Snap body');
    expect(workspace.nodes[0].id).toBe('n2');
    expect(workspace.templateId).toBe('meeting-action-plan');
    expect(workspace.meta?.deliverableNeedsRegen).toBe(false);
  });

  it('legacy snapshots invalidate deliverable instead of leaving it stale', () => {
    const snap: VersionSnapshot = {
      id: 's-legacy',
      timestamp: Date.now(),
      title: 'Old',
      nodes: [
        {
          id: 'legacy',
          type: 'input',
          position: { x: 1, y: 1 },
          data: { title: 'Legacy', description: '', content: 'from snap' },
        },
      ],
      edges: [],
    };

    const { workspace, legacyIncomplete } = applySnapshotToWorkspace(base, snap);
    expect(legacyIncomplete).toBe(true);
    expect(workspace.nodes[0].id).toBe('legacy');
    expect(workspace.deliverableDraft).toBeUndefined();
    expect(workspace.meta?.deliverableNeedsRegen).toBe(true);
  });
});
