import { describe, expect, it } from 'vitest';
import { applySnapshotToWorkspace } from './workspaceStore';
import type { VersionSnapshot, WorkspaceDocument } from '../types';
import { SNAPSHOT_FORMAT_VERSION, WORKSPACE_SCHEMA_VERSION } from '../types';

const base: WorkspaceDocument = {
  schemaVersion: WORKSPACE_SCHEMA_VERSION,
  id: 'ws-review',
  name: 'Active',
  templateId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sourceMaterial: 'current source',
  nodes: [],
  edges: [],
};

describe('snapshot review decision preservation', () => {
  it('restores approved review state from a full snapshot', () => {
    const snap: VersionSnapshot = {
      id: 'review-snapshot',
      timestamp: Date.now(),
      title: 'Approved review checkpoint',
      snapshotVersion: SNAPSHOT_FORMAT_VERSION,
      workspaceId: base.id,
      nodes: [
        {
          id: 'review',
          type: 'review',
          position: { x: 0, y: 0 },
          data: {
            title: 'Human review',
            description: '',
            content: 'Verify assumptions.',
            status: 'approved',
            reviewRequired: true,
          },
        },
      ],
      edges: [],
      sourceMaterial: 'snap source',
    };

    const { workspace } = applySnapshotToWorkspace(base, snap);
    expect(workspace.nodes[0].data.status).toBe('approved');
  });
});
