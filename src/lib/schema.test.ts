import { describe, expect, it } from 'vitest';
import { validateProjectExportFile, validateWorkspaceDocument } from './schema';
import { WORKSPACE_SCHEMA_VERSION } from '../types';

const validWorkspace = {
  schemaVersion: WORKSPACE_SCHEMA_VERSION,
  id: 'ws_1',
  name: 'Demo',
  templateId: 'research-brief',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sourceMaterial: 'notes',
  nodes: [
    {
      id: 'n1',
      type: 'input',
      position: { x: 1, y: 2 },
      data: { title: 'In', description: '', content: 'x' },
    },
  ],
  edges: [],
};

describe('validateWorkspaceDocument', () => {
  it('accepts a valid workspace', () => {
    const result = validateWorkspaceDocument(validWorkspace);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Demo');
      expect(result.data.sourceMaterial).toBe('notes');
    }
  });

  it('rejects missing nodes', () => {
    const result = validateWorkspaceDocument({ id: 'x', name: 'y' });
    expect(result.ok).toBe(false);
  });
});

describe('validateProjectExportFile', () => {
  it('accepts project export wrapper', () => {
    const result = validateProjectExportFile({
      format: 'weavestudio-project',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      workspace: validWorkspace,
    });
    expect(result.ok).toBe(true);
  });

  it('accepts legacy nodes/edges export', () => {
    const result = validateProjectExportFile({
      title: 'Old',
      nodes: validWorkspace.nodes,
      edges: [],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.workspace.nodes).toHaveLength(1);
    }
  });
});
