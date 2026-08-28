import { describe, expect, it } from 'vitest';
import { validateProjectExportFile } from './schema';
import { WORKSPACE_SCHEMA_VERSION } from '../types';
import { invalidateApprovedReviews } from './reviewState';

const exportedWorkspace = {
  schemaVersion: WORKSPACE_SCHEMA_VERSION,
  id: 'review-workspace',
  name: 'Review workspace',
  templateId: null,
  createdAt: '2026-08-18T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
  sourceMaterial: 'source',
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
};

describe('review decision portability', () => {
  it('preserves approved review state through project import validation', () => {
    const result = validateProjectExportFile({
      format: 'weavestudio-project',
      formatVersion: 1,
      exportedAt: '2026-08-18T00:00:00.000Z',
      workspace: exportedWorkspace,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.workspace.nodes[0].data.status).toBe('approved');
    }
  });

  it('re-evaluates a legacy approved review after loading and editing an ancestor', () => {
    const legacyWorkspace = {
      ...exportedWorkspace,
      nodes: [
        {
          id: 'input',
          type: 'input' as const,
          position: { x: 0, y: 0 },
          data: { title: 'Input', description: '', content: 'Original source' },
        },
        exportedWorkspace.nodes[0],
      ],
      edges: [{ id: 'input-review', source: 'input', target: 'review' }],
    };
    const imported = validateProjectExportFile({
      format: 'weavestudio-project',
      formatVersion: 1,
      exportedAt: '2026-08-18T00:00:00.000Z',
      workspace: legacyWorkspace,
    });

    expect(imported.ok).toBe(true);
    if (imported.ok) {
      const loaded = imported.data.workspace;
      const changedNodes = loaded.nodes.map((node) =>
        node.id === 'input' ? { ...node, data: { ...node.data, content: 'Changed source' } } : node,
      );
      const result = invalidateApprovedReviews({
        previousNodes: loaded.nodes,
        nextNodes: changedNodes,
        previousEdges: loaded.edges,
        nextEdges: loaded.edges,
        previousSource: loaded.sourceMaterial,
        nextSource: loaded.sourceMaterial,
      });

      expect(result.find((node) => node.id === 'review')?.data.status).toBe('pending');
    }
  });
});
