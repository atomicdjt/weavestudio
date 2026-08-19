import { describe, expect, it } from 'vitest';
import type { AppNode, ProvenanceGraph } from '../types';
import {
  createProvenanceClaim,
  createSourceFragment,
  extractClaimCandidates,
  fingerprintText,
  resolveClaimTrace,
  validateProvenanceClaim,
  validateSourceFragment,
} from './provenance';

const node = (
  id: string,
  type: AppNode['type'],
  content: string,
  category?: AppNode['data']['category'],
): AppNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { title: id, description: '', content, category },
});

const source = 'Alpha evidence. Beta evidence.';

const buildDirectFixture = () => {
  const fragment = createSourceFragment({
    sourceMaterial: source,
    startOffset: 0,
    endOffset: 'Alpha evidence.'.length,
    id: 'frag_alpha',
  });
  const claim = createProvenanceClaim({
    id: 'claim_1',
    nodeId: 'out_1',
    claimText: 'Alpha conclusion',
    sourceFragmentIds: [fragment.id],
    derivation: 'direct',
  });
  const graph: ProvenanceGraph = {
    version: 1,
    sourceFingerprint: fingerprintText(source),
    fragments: [fragment],
    claims: [claim],
  };
  const nodes = [node('out_1', 'output', 'Alpha conclusion', 'output')];
  return { fragment, claim, graph, nodes };
};

describe('provenance fingerprints and fragments', () => {
  it('creates a stable exact-range source fragment', () => {
    const fragment = createSourceFragment({
      sourceMaterial: source,
      startOffset: 0,
      endOffset: 15,
      id: 'frag_alpha',
    });

    expect(fragment).toEqual({
      id: 'frag_alpha',
      startOffset: 0,
      endOffset: 15,
      quote: 'Alpha evidence.',
      quoteFingerprint: fingerprintText('Alpha evidence.'),
      sourceFingerprint: fingerprintText(source),
    });
    expect(fingerprintText(source)).toBe(fingerprintText(source));
  });

  it('marks a changed in-range source fragment stale', () => {
    const { fragment } = buildDirectFixture();
    const changed = source.replace('Alpha evidence.', 'Omega evidence.');
    expect(validateSourceFragment(fragment, changed)).toBe('stale');
  });

  it('marks invalid fragment offsets broken', () => {
    const { fragment } = buildDirectFixture();
    expect(validateSourceFragment({ ...fragment, endOffset: source.length + 10 }, source)).toBe('broken');
  });
});

describe('claim trace resolution', () => {
  it('resolves a direct source claim as valid', () => {
    const { claim, graph, nodes } = buildDirectFixture();
    const trace = resolveClaimTrace({ claim, graph, sourceMaterial: source, nodes });

    expect(trace.status).toBe('valid');
    expect(trace.fragments).toHaveLength(1);
    expect(trace.fragments[0].status).toBe('valid');
    expect(trace.fragments[0].fragment.quote).toBe('Alpha evidence.');
    expect(trace.viaNodes).toEqual([]);
  });

  it('resolves a transformed claim with the declared intermediate node', () => {
    const fragment = createSourceFragment({
      sourceMaterial: source,
      startOffset: 0,
      endOffset: 15,
      id: 'frag_alpha',
    });
    const claim = createProvenanceClaim({
      id: 'claim_transform',
      nodeId: 'out_1',
      claimText: 'Combined conclusion',
      sourceFragmentIds: [fragment.id],
      viaNodeIds: ['transform_1'],
      derivation: 'transformed',
    });
    const graph: ProvenanceGraph = {
      version: 1,
      sourceFingerprint: fingerprintText(source),
      fragments: [fragment],
      claims: [claim],
    };
    const nodes = [
      node('transform_1', 'transform', 'Structured Alpha'),
      node('out_1', 'output', 'Combined conclusion', 'output'),
    ];

    const trace = resolveClaimTrace({ claim, graph, sourceMaterial: source, nodes });
    expect(trace.status).toBe('valid');
    expect(trace.viaNodes.map((item) => item.id)).toEqual(['transform_1']);
  });

  it('resolves a multi-source claim with both fragments', () => {
    const first = createSourceFragment({ sourceMaterial: source, startOffset: 0, endOffset: 15, id: 'frag_a' });
    const secondStart = source.indexOf('Beta');
    const second = createSourceFragment({
      sourceMaterial: source,
      startOffset: secondStart,
      endOffset: source.length,
      id: 'frag_b',
    });
    const claim = createProvenanceClaim({
      id: 'claim_multi',
      nodeId: 'out_1',
      claimText: 'Two-source conclusion',
      sourceFragmentIds: [first.id, second.id],
      derivation: 'transformed',
    });
    const graph: ProvenanceGraph = {
      version: 1,
      sourceFingerprint: fingerprintText(source),
      fragments: [first, second],
      claims: [claim],
    };
    const nodes = [node('out_1', 'output', 'Two-source conclusion', 'output')];

    const trace = resolveClaimTrace({ claim, graph, sourceMaterial: source, nodes });
    expect(trace.status).toBe('valid');
    expect(trace.fragments.map((item) => item.fragment.id)).toEqual(['frag_a', 'frag_b']);
  });

  it('marks the trace stale when referenced source text changes', () => {
    const { claim, graph, nodes } = buildDirectFixture();
    const changed = source.replace('Alpha evidence.', 'Omega evidence.');
    expect(resolveClaimTrace({ claim, graph, sourceMaterial: changed, nodes }).status).toBe('stale');
  });

  it('marks a missing fragment reference broken', () => {
    const { claim, graph, nodes } = buildDirectFixture();
    const brokenGraph = { ...graph, fragments: [] };
    expect(validateProvenanceClaim(claim, brokenGraph, nodes)).toBe('broken');
    expect(resolveClaimTrace({ claim, graph: brokenGraph, sourceMaterial: source, nodes }).status).toBe('broken');
  });

  it('marks a claim stale when its originating node no longer contains the recorded claim', () => {
    const { claim, graph } = buildDirectFixture();
    const nodes = [node('out_1', 'output', 'A rewritten conclusion', 'output')];
    expect(validateProvenanceClaim(claim, graph, nodes)).toBe('stale');
  });

  it('does not invalidate provenance for node position-only changes', () => {
    const { claim, graph, nodes } = buildDirectFixture();
    const moved = nodes.map((item) => ({ ...item, position: { x: 999, y: -44 } }));
    expect(validateProvenanceClaim(claim, graph, moved)).toBe('valid');
  });

  it('preserves AI-assisted derivation as a distinct label', () => {
    const { fragment } = buildDirectFixture();
    const claim = createProvenanceClaim({
      id: 'claim_ai',
      nodeId: 'out_1',
      claimText: 'AI-assisted conclusion',
      sourceFragmentIds: [fragment.id],
      viaNodeIds: ['ai_1'],
      derivation: 'ai-assisted',
    });
    const graph: ProvenanceGraph = {
      version: 1,
      sourceFingerprint: fingerprintText(source),
      fragments: [fragment],
      claims: [claim],
    };
    const nodes = [
      node('ai_1', 'aiAssist', 'AI blueprint output'),
      node('out_1', 'output', 'AI-assisted conclusion', 'output'),
    ];

    const trace = resolveClaimTrace({ claim, graph, sourceMaterial: source, nodes });
    expect(trace.status).toBe('valid');
    expect(trace.claim.derivation).toBe('ai-assisted');
  });

  it('reports a claim without source references as missing', () => {
    const claim = createProvenanceClaim({
      id: 'claim_missing',
      nodeId: 'out_1',
      claimText: 'Unsupported conclusion',
      sourceFragmentIds: [],
      derivation: 'manual',
    });
    const graph: ProvenanceGraph = {
      version: 1,
      sourceFingerprint: fingerprintText(source),
      fragments: [],
      claims: [claim],
    };
    const nodes = [node('out_1', 'output', 'Unsupported conclusion', 'output')];

    expect(resolveClaimTrace({ claim, graph, sourceMaterial: source, nodes }).status).toBe('missing');
  });
});

describe('claim candidate extraction', () => {
  it('extracts ordered paragraph and list-item candidates from eligible nodes only', () => {
    const nodes = [
      node('out_1', 'output', 'First paragraph.\n\n- Bullet claim\n* Second bullet', 'output'),
      node('evidence_1', 'transform', 'Evidence claim', 'evidence'),
      node('other_1', 'transform', 'Ignore this', 'other'),
    ];

    expect(extractClaimCandidates(nodes)).toEqual([
      { nodeId: 'out_1', text: 'First paragraph.' },
      { nodeId: 'out_1', text: 'Bullet claim' },
      { nodeId: 'out_1', text: 'Second bullet' },
      { nodeId: 'evidence_1', text: 'Evidence claim' },
    ]);
  });
});
