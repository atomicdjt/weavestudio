import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { WorkspaceDocument } from '../../types';
import { createProvenanceClaim, createSourceFragment, fingerprintText } from '../../lib/provenance';
import { ProvenancePanel } from './ProvenancePanel';

const sourceMaterial = 'Alpha evidence. Beta evidence.';
const fragment = createSourceFragment({
  sourceMaterial,
  startOffset: 0,
  endOffset: 15,
  id: 'frag_alpha',
});
const claim = createProvenanceClaim({
  id: 'claim_alpha',
  nodeId: 'out_1',
  claimText: 'Alpha conclusion',
  sourceFragmentIds: [fragment.id],
  derivation: 'direct',
});

const workspace: WorkspaceDocument = {
  schemaVersion: 1,
  id: 'ws_trace',
  name: 'Traceable workspace',
  templateId: null,
  createdAt: '2026-08-19T00:00:00.000Z',
  updatedAt: '2026-08-19T00:00:00.000Z',
  sourceMaterial,
  nodes: [
    {
      id: 'out_1',
      type: 'output',
      position: { x: 0, y: 0 },
      data: { title: 'Recommendation', description: '', content: 'Alpha conclusion', category: 'output' },
    },
  ],
  edges: [],
  provenance: {
    version: 1,
    sourceFingerprint: fingerprintText(sourceMaterial),
    fragments: [fragment],
    claims: [claim],
  },
};

describe('ProvenancePanel', () => {
  it('states the trust boundary and exposes valid recorded lineage plus annotation controls', () => {
    const html = renderToStaticMarkup(
      <ProvenancePanel workspace={workspace} onWorkspacePatch={() => undefined} />,
    );

    expect(html).toContain('Workspace lineage only — this does not verify the truth or authenticity of the source.');
    expect(html).toContain('Annotate a claim');
    expect(html).toContain('Alpha conclusion');
    expect(html).toContain('Valid');
    expect(html).toContain('Source range 0–15');
    expect(html).toContain('Claim candidate');
    expect(html).toContain('Derivation');
    expect(html).toContain('Save provenance');
  });
});
