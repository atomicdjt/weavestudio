import { describe, expect, it } from 'vitest';
import type { AppEdge, AppNode } from '../types';
import { invalidateApprovedReviews, collectUpstream } from './reviewState';

/**
 * Comprehensive regression tests for per-review subgraph invalidation.
 *
 * These tests verify the established review invariants:
 *
 * A. Relevant-change invalidation: upstream changes invalidate.
 * B. Unrelated-change stability: unrelated changes do NOT invalidate.
 * C. Structural-change handling: edge/topology changes invalidate affected reviews.
 * D. Downstream edits: do NOT invalidate upstream reviews.
 * E. Determinism: same input → same output.
 * F. Safety: cycles terminate, errors conservatively invalidate.
 */

const makeNode = (id: string, type: AppNode['type'], overrides: Partial<AppNode['data']> = {}): AppNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { title: `${id} title`, description: '', content: `${id} content`, ...overrides },
});

const approvedReview = (id: string): AppNode => makeNode(id, 'review', {
  status: 'approved',
  reviewRequired: true,
});

const getStatus = (nodes: AppNode[], id: string) =>
  nodes.find((n) => n.id === id)?.data.status;

/**
 * Two-branch workflow topology:
 *
 *   inputA → transformA → reviewA
 *   inputB → transformB → reviewB
 */
const twobranchNodes = (): AppNode[] => [
  makeNode('inputA', 'input'),
  makeNode('transformA', 'transform'),
  approvedReview('reviewA'),
  makeNode('inputB', 'input'),
  makeNode('transformB', 'transform'),
  approvedReview('reviewB'),
];

const twobranchEdges = (): AppEdge[] => [
  { id: 'e1', source: 'inputA', target: 'transformA' },
  { id: 'e2', source: 'transformA', target: 'reviewA' },
  { id: 'e3', source: 'inputB', target: 'transformB' },
  { id: 'e4', source: 'transformB', target: 'reviewB' },
];

/**
 * Linear workflow: input → transform → review → output
 */
const linearNodes = (): AppNode[] => [
  makeNode('input', 'input'),
  makeNode('transform', 'transform'),
  approvedReview('review'),
  makeNode('output', 'output'),
];

const linearEdges = (): AppEdge[] => [
  { id: 'e1', source: 'input', target: 'transform' },
  { id: 'e2', source: 'transform', target: 'review' },
  { id: 'e3', source: 'review', target: 'output' },
];

// ─── Invariant A: Relevant upstream changes invalidate ────────────────────

describe('Invariant A — relevant upstream changes invalidate', () => {
  it('editing a direct upstream node invalidates the downstream review', () => {
    const prev = twobranchNodes();
    const next = prev.map((n) =>
      n.id === 'transformA' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: twobranchEdges(),
      nextEdges: twobranchEdges(),
    });
    expect(getStatus(result, 'reviewA')).toBe('pending');
  });

  it('editing a transitive upstream node invalidates the review', () => {
    const prev = linearNodes();
    const next = prev.map((n) =>
      n.id === 'input' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: linearEdges(),
      nextEdges: linearEdges(),
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('changing the review node\'s own content invalidates it', () => {
    const prev = linearNodes();
    const next = prev.map((n) =>
      n.id === 'review'
        ? { ...n, data: { ...n.data, content: 'NEW REVIEW CRITERIA' } }
        : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: linearEdges(),
      nextEdges: linearEdges(),
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('source material change invalidates all reviews', () => {
    const nodes = twobranchNodes();
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: nodes,
      previousEdges: twobranchEdges(),
      nextEdges: twobranchEdges(),
      previousSource: 'original',
      nextSource: 'modified',
    });
    expect(getStatus(result, 'reviewA')).toBe('pending');
    expect(getStatus(result, 'reviewB')).toBe('pending');
  });
});

// ─── Invariant B: Unrelated changes do NOT invalidate ─────────────────────

describe('Invariant B — unrelated changes preserve approval', () => {
  it('editing in branch B does NOT invalidate reviewA', () => {
    const prev = twobranchNodes();
    const next = prev.map((n) =>
      n.id === 'transformB' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: twobranchEdges(),
      nextEdges: twobranchEdges(),
    });
    expect(getStatus(result, 'reviewA')).toBe('approved');
    expect(getStatus(result, 'reviewB')).toBe('pending');
  });

  it('adding a disconnected node does NOT invalidate existing reviews', () => {
    const prev = linearNodes();
    const next = [...prev, makeNode('isolated', 'transform')];
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: linearEdges(),
      nextEdges: linearEdges(),
    });
    expect(getStatus(result, 'review')).toBe('approved');
  });

  it('deleting an unrelated disconnected node does NOT invalidate reviews', () => {
    const prev = [...linearNodes(), makeNode('isolated', 'transform')];
    const next = linearNodes();
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: linearEdges(),
      nextEdges: linearEdges(),
    });
    expect(getStatus(result, 'review')).toBe('approved');
  });

  it('edge change in another branch does NOT invalidate unrelated review', () => {
    const prev = twobranchNodes();
    const edges = twobranchEdges();
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: prev,
      previousEdges: edges,
      nextEdges: edges.filter((e) => e.id !== 'e4'), // remove transformB→reviewB
    });
    expect(getStatus(result, 'reviewA')).toBe('approved');
    expect(getStatus(result, 'reviewB')).toBe('pending');
  });

  it('position-only changes preserve approval', () => {
    const prev = linearNodes();
    const next = prev.map((n) =>
      n.id === 'input' ? { ...n, position: { x: 999, y: 999 } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: linearEdges(),
      nextEdges: linearEdges(),
    });
    expect(getStatus(result, 'review')).toBe('approved');
  });
});

// ─── Invariant C: Structural changes ──────────────────────────────────────

describe('Invariant C — structural changes invalidate affected reviews', () => {
  it('removing an upstream edge invalidates the review', () => {
    const prev = linearNodes();
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: prev,
      previousEdges: linearEdges(),
      nextEdges: linearEdges().filter((e) => e.id !== 'e2'), // remove transform→review
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('adding an upstream edge invalidates the review', () => {
    const prev = linearNodes();
    const newNode = makeNode('extra', 'transform');
    const next = [...prev, newNode];
    const newEdge: AppEdge = { id: 'e-new', source: 'extra', target: 'review' };
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: linearEdges(),
      nextEdges: [...linearEdges(), newEdge],
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('connecting branches invalidates the newly-dependent review', () => {
    const prev = twobranchNodes();
    const edges = twobranchEdges();
    // Connect transformA → reviewB, making reviewB now dependent on branch A
    const crossEdge: AppEdge = { id: 'e-cross', source: 'transformA', target: 'reviewB' };
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: prev,
      previousEdges: edges,
      nextEdges: [...edges, crossEdge],
    });
    // reviewA is NOT affected by the new edge (it's a downstream fan-out from transformA)
    expect(getStatus(result, 'reviewA')).toBe('approved');
    // reviewB gains a new upstream dependency → invalidated
    expect(getStatus(result, 'reviewB')).toBe('pending');
  });

  it('deleting an upstream node invalidates the review', () => {
    const prev = linearNodes();
    // Remove 'transform' node entirely
    const next = prev.filter((n) => n.id !== 'transform');
    const nextEdges = linearEdges().filter((e) => e.source !== 'transform' && e.target !== 'transform');
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: linearEdges(),
      nextEdges,
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });
});

// ─── Invariant D: Downstream edits do NOT invalidate ──────────────────────

describe('Invariant D — downstream edits preserve upstream approval', () => {
  it('editing a downstream node does NOT invalidate the review', () => {
    const prev = linearNodes();
    const next = prev.map((n) =>
      n.id === 'output' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: linearEdges(),
      nextEdges: linearEdges(),
    });
    expect(getStatus(result, 'review')).toBe('approved');
  });

  it('deleting a downstream node does NOT invalidate the review', () => {
    const prev = linearNodes();
    const next = prev.filter((n) => n.id !== 'output');
    const nextEdges = linearEdges().filter((e) => e.target !== 'output');
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: linearEdges(),
      nextEdges,
    });
    expect(getStatus(result, 'review')).toBe('approved');
  });
});

// ─── Invariant E: Determinism ─────────────────────────────────────────────

describe('Invariant E — deterministic results', () => {
  it('produces identical results for identical inputs', () => {
    const prev = twobranchNodes();
    const next = prev.map((n) =>
      n.id === 'transformA' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const params = {
      previousNodes: prev,
      nextNodes: next,
      previousEdges: twobranchEdges(),
      nextEdges: twobranchEdges(),
    };
    const result1 = invalidateApprovedReviews(params);
    const result2 = invalidateApprovedReviews(params);
    expect(result1.map((n) => n.data.status)).toEqual(result2.map((n) => n.data.status));
  });

  it('node array ordering does not affect the result', () => {
    const prev = twobranchNodes();
    const next = prev.map((n) =>
      n.id === 'transformA' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    // Reverse the node order
    const reversedPrev = [...prev].reverse();
    const reversedNext = [...next].reverse();
    const params1 = {
      previousNodes: prev,
      nextNodes: next,
      previousEdges: twobranchEdges(),
      nextEdges: twobranchEdges(),
    };
    const params2 = {
      previousNodes: reversedPrev,
      nextNodes: reversedNext,
      previousEdges: twobranchEdges(),
      nextEdges: twobranchEdges(),
    };
    const result1 = invalidateApprovedReviews(params1);
    const result2 = invalidateApprovedReviews(params2);
    expect(getStatus(result1, 'reviewA')).toBe(getStatus(result2, 'reviewA'));
    expect(getStatus(result1, 'reviewB')).toBe(getStatus(result2, 'reviewB'));
  });

  it('edge ordering stays deterministic when sort keys contain delimiters', () => {
    const nodes: AppNode[] = [
      makeNode('a:b', 'input'),
      makeNode('a', 'input'),
      approvedReview('review'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'a:b', sourceHandle: 'c', target: 'review' },
      { id: 'e2', source: 'a', sourceHandle: 'b:c', target: 'review' },
    ];

    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: nodes,
      previousEdges: edges,
      nextEdges: [...edges].reverse(),
    });

    expect(getStatus(result, 'review')).toBe('approved');
  });
});

// ─── Invariant F: Safety — cycles and malformed data ──────────────────────

describe('Invariant F — safety under malformed data', () => {
  it('cycles in the graph terminate safely and do not prevent invalidation', () => {
    // Create a cycle: A → B → review, B → A
    const nodes: AppNode[] = [
      makeNode('a', 'transform'),
      makeNode('b', 'transform'),
      approvedReview('review'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'a' }, // cycle
      { id: 'e3', source: 'b', target: 'review' },
    ];
    const next = nodes.map((n) =>
      n.id === 'a' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    // a is upstream of review through b, so changing a should invalidate review
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('edges referencing nonexistent nodes are safely ignored', () => {
    const nodes = linearNodes();
    const badEdges: AppEdge[] = [
      ...linearEdges(),
      { id: 'e-bad', source: 'ghost', target: 'review' },
    ];
    // This should not crash and should still work correctly
    const next = nodes.map((n) =>
      n.id === 'input' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: badEdges,
      nextEdges: badEdges,
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('a review node with no edges is only affected by source material changes', () => {
    const nodes: AppNode[] = [approvedReview('lonely')];
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: nodes,
      previousEdges: [],
      nextEdges: [],
      previousSource: 'original',
      nextSource: 'changed',
    });
    expect(getStatus(result, 'lonely')).toBe('pending');
  });

  it('a review node with no edges and no source change stays approved', () => {
    const nodes: AppNode[] = [approvedReview('lonely')];
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: nodes,
      previousEdges: [],
      nextEdges: [],
    });
    expect(getStatus(result, 'lonely')).toBe('approved');
  });
});

// ─── Shared ancestor ──────────────────────────────────────────────────────

describe('Shared ancestor', () => {
  it('changing a shared ancestor invalidates both dependent reviews', () => {
    // shared → reviewA, shared → reviewB
    const nodes: AppNode[] = [
      makeNode('shared', 'input'),
      approvedReview('reviewA'),
      approvedReview('reviewB'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'shared', target: 'reviewA' },
      { id: 'e2', source: 'shared', target: 'reviewB' },
    ];
    const next = nodes.map((n) =>
      n.id === 'shared' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'reviewA')).toBe('pending');
    expect(getStatus(result, 'reviewB')).toBe('pending');
  });
});

// ─── Newly added review ───────────────────────────────────────────────────

describe('Newly added review', () => {
  it('a review node that did not exist previously is not invalidated', () => {
    const prev = [makeNode('input', 'input')];
    const next = [...prev, approvedReview('newReview')];
    const edges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'newReview' }];
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: [],
      nextEdges: edges,
    });
    // Newly added review with approved status is left alone (no prior state to compare)
    expect(getStatus(result, 'newReview')).toBe('approved');
  });
});

// ─── Approval action idempotency ──────────────────────────────────────────

describe('Approval action idempotency', () => {
  it('approving a review does not trigger self-invalidation', () => {
    const pendingReview: AppNode = { ...approvedReview('review'), data: { ...approvedReview('review').data, status: 'pending' } };
    const prev = [makeNode('input', 'input'), pendingReview];
    const next = [makeNode('input', 'input'), approvedReview('review')];
    const edges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'review')).toBe('approved');
  });
});

// ─── collectUpstream unit tests ───────────────────────────────────────────

describe('collectUpstream', () => {
  it('returns only the start node when it has no incoming edges', () => {
    const nodeIds = new Set(['a', 'b']);
    const incoming = new Map([['b', ['a']]]);
    expect(collectUpstream('a', nodeIds, incoming)).toEqual(new Set(['a']));
  });

  it('collects transitive ancestors', () => {
    const nodeIds = new Set(['a', 'b', 'c']);
    const incoming = new Map([['c', ['b']], ['b', ['a']]]);
    expect(collectUpstream('c', nodeIds, incoming)).toEqual(new Set(['a', 'b', 'c']));
  });

  it('terminates on cycles', () => {
    const nodeIds = new Set(['a', 'b']);
    const incoming = new Map([['a', ['b']], ['b', ['a']]]);
    expect(collectUpstream('a', nodeIds, incoming)).toEqual(new Set(['a', 'b']));
  });

  it('ignores references to nonexistent nodes', () => {
    const nodeIds = new Set(['a']);
    const incoming = new Map([['a', ['ghost']]]);
    expect(collectUpstream('a', nodeIds, incoming)).toEqual(new Set(['a']));
  });
});
