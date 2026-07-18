import { describe, expect, it } from 'vitest';
import { applySourceToInputNode, splitSourceIntoNodes, splitSourceMaterial } from './structureSource';

describe('splitSourceMaterial', () => {
  it('returns empty for blank input', () => {
    expect(splitSourceMaterial('   ')).toEqual([]);
  });

  it('splits on blank-line paragraphs', () => {
    const chunks = splitSourceMaterial('Alpha line\n\nBeta line\n\nGamma line');
    expect(chunks).toHaveLength(3);
    expect(chunks[0].content).toContain('Alpha');
  });

  it('splits on markdown headings', () => {
    const chunks = splitSourceMaterial('# One\nBody one\n\n## Two\nBody two');
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].title).toMatch(/One/);
  });
});

describe('splitSourceIntoNodes', () => {
  it('creates transform nodes linked from input', () => {
    const result = splitSourceIntoNodes(
      'First chunk\n\nSecond chunk',
      [],
      [],
    );
    expect(result.createdCount).toBe(2);
    expect(result.nodes.some((n) => n.type === 'input')).toBe(true);
    expect(result.nodes.filter((n) => n.type === 'transform')).toHaveLength(2);
    expect(result.edges.length).toBe(2);
  });

  it('applySourceToInputNode updates existing input', () => {
    const nodes = applySourceToInputNode(
      [
        {
          id: 'n1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { title: 'In', description: '', content: 'old' },
        },
      ],
      'new source',
    );
    expect(nodes[0].data.content).toBe('new source');
  });
});
