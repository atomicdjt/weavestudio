import { describe, expect, it } from 'vitest';
import { validateProjectExportFile, validateWorkspaceDocument } from './schema';
import { WORKSPACE_SCHEMA_VERSION } from '../types';
import { fingerprintText } from './provenance';

const sourceMaterial = 'Alpha evidence. Beta evidence.';
const provenance = {
  version: 1 as const,
  sourceFingerprint: fingerprintText(sourceMaterial),
  fragments: [
    {
      id: 'frag_alpha',
      startOffset: 0,
      endOffset: 15,
      quote: 'Alpha evidence.',
      quoteFingerprint: fingerprintText('Alpha evidence.'),
      sourceFingerprint: fingerprintText(sourceMaterial),
    },
  ],
  claims: [
    {
      id: 'claim_1',
      nodeId: 'n1',
      claimText: 'Alpha evidence.',
      claimFingerprint: fingerprintText('Alpha evidence.'),
      sourceFragmentIds: ['frag_alpha'],
      viaNodeIds: [],
      derivation: 'direct' as const,
    },
  ],
};

const validWorkspace = {
  schemaVersion: WORKSPACE_SCHEMA_VERSION,
  id: 'ws_1',
  name: 'Demo',
  templateId: 'research-brief',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sourceMaterial,
  nodes: [
    {
      id: 'n1',
      type: 'input',
      position: { x: 1, y: 2 },
      data: { title: 'In', description: '', content: 'Alpha evidence.' },
    },
  ],
  edges: [],
  provenance,
};

describe('validateWorkspaceDocument', () => {
  it('accepts a valid workspace and preserves provenance IDs', () => {
    const result = validateWorkspaceDocument(validWorkspace);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Demo');
      expect(result.data.sourceMaterial).toBe(sourceMaterial);
      expect(result.data.provenance?.fragments[0].id).toBe('frag_alpha');
      expect(result.data.provenance?.claims[0].id).toBe('claim_1');
    }
  });

  it('accepts existing workspaces that have no provenance field', () => {
    const { provenance: _provenance, ...withoutProvenance } = validWorkspace;
    const result = validateWorkspaceDocument(withoutProvenance);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.provenance).toBeUndefined();
  });

  it('rejects missing nodes', () => {
    const result = validateWorkspaceDocument({ id: 'x', name: 'y' });
    expect(result.ok).toBe(false);
  });

  it.each([
    ['negative fragment offset', { ...provenance, fragments: [{ ...provenance.fragments[0], startOffset: -1 }] }],
    ['reversed fragment offsets', { ...provenance, fragments: [{ ...provenance.fragments[0], startOffset: 10, endOffset: 2 }] }],
    ['unknown derivation', { ...provenance, claims: [{ ...provenance.claims[0], derivation: 'guessed' }] }],
    ['non-string fragment id', { ...provenance, fragments: [{ ...provenance.fragments[0], id: 44 }] }],
    ['missing fragments array', { version: 1, sourceFingerprint: provenance.sourceFingerprint, claims: provenance.claims }],
    ['duplicate fragment ids', { ...provenance, fragments: [provenance.fragments[0], { ...provenance.fragments[0] }] }],
    ['duplicate claim ids', { ...provenance, claims: [provenance.claims[0], { ...provenance.claims[0] }] }],
    [
      'unknown fragment reference',
      { ...provenance, claims: [{ ...provenance.claims[0], sourceFragmentIds: ['frag_missing'] }] },
    ],
  ])('rejects malformed provenance: %s', (_label, malformed) => {
    const result = validateWorkspaceDocument({ ...validWorkspace, provenance: malformed });
    expect(result.ok).toBe(false);
  });

  it('rejects duplicate node IDs in workspace', () => {
    const duplicateNodes = [
      validWorkspace.nodes[0],
      { ...validWorkspace.nodes[0], position: { x: 10, y: 20 } },
    ];
    const result = validateWorkspaceDocument({ ...validWorkspace, nodes: duplicateNodes });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('duplicate node IDs');
    }
  });

  it('rejects duplicate edge IDs in workspace', () => {
    const duplicateEdges = [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e1', source: 'n2', target: 'n3' },
    ];
    const result = validateWorkspaceDocument({ ...validWorkspace, edges: duplicateEdges });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('duplicate edge IDs');
    }
  });

  it('rejects duplicate node IDs differing only by case', () => {
    const nodes = [
      { id: 'nodeA', type: 'input' as const, position: { x: 0, y: 0 }, data: { title: 'A' } },
      { id: 'NODEA', type: 'transform' as const, position: { x: 10, y: 20 }, data: { title: 'B' } },
    ];
    const result = validateWorkspaceDocument({ ...validWorkspace, nodes });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('duplicate node IDs');
    }
  });

  it('rejects duplicate edge IDs differing only by case', () => {
    const nodes = [
      { id: 'n1', type: 'input' as const, position: { x: 0, y: 0 }, data: { title: '1' } },
      { id: 'n2', type: 'output' as const, position: { x: 0, y: 0 }, data: { title: '2' } },
    ];
    const edges = [
      { id: 'edge1', source: 'n1', target: 'n2' },
      { id: 'EDGE1', source: 'n1', target: 'n2' },
    ];
    const result = validateWorkspaceDocument({ ...validWorkspace, nodes, edges });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('duplicate edge IDs');
    }
  });

  it('rejects whitespace-only node and edge IDs', () => {
    const whitespaceNode = [{ id: '   ', type: 'input' as const, position: { x: 0, y: 0 }, data: { title: 'Space' } }];
    expect(validateWorkspaceDocument({ ...validWorkspace, nodes: whitespaceNode }).ok).toBe(false);

    const whitespaceEdge = [{ id: '   ', source: 'n1', target: 'n1' }];
    expect(validateWorkspaceDocument({ ...validWorkspace, edges: whitespaceEdge }).ok).toBe(false);
  });

  it('rejects dangling edges that reference non-existent nodes', () => {
    const danglingEdges = [{ id: 'e1', source: 'n1', target: 'ghostNode' }];
    const result = validateWorkspaceDocument({ ...validWorkspace, edges: danglingEdges });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('reference non-existent nodes');
    }
  });

  it('rejects edges with empty or whitespace source/target', () => {
    const emptySource = [{ id: 'e1', source: '', target: 'n1' }];
    expect(validateWorkspaceDocument({ ...validWorkspace, edges: emptySource }).ok).toBe(false);

    const whitespaceTarget = [{ id: 'e2', source: 'n1', target: '   ' }];
    expect(validateWorkspaceDocument({ ...validWorkspace, edges: whitespaceTarget }).ok).toBe(false);
  });

  it('rejects unknown or malformed node types', () => {
    const unknownType = [{ id: 'n1', type: 'unsupportedNodeType', position: { x: 0, y: 0 }, data: { title: 'Test' } }];
    expect(validateWorkspaceDocument({ ...validWorkspace, nodes: unknownType }).ok).toBe(false);

    const numericType = [{ id: 'n1', type: 123, position: { x: 0, y: 0 }, data: { title: 'Test' } }];
    expect(validateWorkspaceDocument({ ...validWorkspace, nodes: numericType }).ok).toBe(false);

    const nullType = [{ id: 'n1', type: null, position: { x: 0, y: 0 }, data: { title: 'Test' } }];
    expect(validateWorkspaceDocument({ ...validWorkspace, nodes: nullType }).ok).toBe(false);
  });

  it('rejects nodes with missing or empty type', () => {
    const invalidNodes = [
      { id: 'n1', position: { x: 0, y: 0 }, data: { title: 'Test' } }, // missing type
    ];
    const result = validateWorkspaceDocument({ ...validWorkspace, nodes: invalidNodes });
    expect(result.ok).toBe(false);
  });
});

describe('validateProjectExportFile', () => {
  it('accepts project export wrapper and preserves provenance', () => {
    const result = validateProjectExportFile({
      format: 'weavestudio-project',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      workspace: validWorkspace,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.workspace.provenance?.fragments[0].id).toBe('frag_alpha');
      expect(result.data.workspace.provenance?.claims[0].sourceFragmentIds).toEqual(['frag_alpha']);
    }
  });

  it('rejects a project wrapper containing malformed provenance', () => {
    const result = validateProjectExportFile({
      format: 'weavestudio-project',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      workspace: {
        ...validWorkspace,
        provenance: { ...provenance, claims: [{ ...provenance.claims[0], derivation: 'guessed' }] },
      },
    });
    expect(result.ok).toBe(false);
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
      expect(result.data.workspace.provenance).toBeUndefined();
    }
  });
});
