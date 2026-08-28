import { describe, expect, it } from 'vitest';
import type { AppEdge, AppNode } from '../types';
import { invalidateApprovedReviews } from './reviewState';

/**
 * Adversarial tests designed to find edge cases, stale approvals,
 * traversal bugs, or incorrect invalidation behavior.
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

describe('Adversarial — stale approval attacks', () => {
  it('diamond dependency: change in shared ancestor invalidates both reviews', () => {
    /**
     *       input
     *      /     \
     *  leftT    rightT
     *      \     /
     *      merge
     *        |
     *      review
     */
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      makeNode('leftT', 'transform'),
      makeNode('rightT', 'transform'),
      makeNode('merge', 'transform'),
      approvedReview('review'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'leftT' },
      { id: 'e2', source: 'input', target: 'rightT' },
      { id: 'e3', source: 'leftT', target: 'merge' },
      { id: 'e4', source: 'rightT', target: 'merge' },
      { id: 'e5', source: 'merge', target: 'review' },
    ];
    const next = nodes.map((n) =>
      n.id === 'input' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('diamond: changing only one arm invalidates the downstream review', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      makeNode('leftT', 'transform'),
      makeNode('rightT', 'transform'),
      makeNode('merge', 'transform'),
      approvedReview('review'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'leftT' },
      { id: 'e2', source: 'input', target: 'rightT' },
      { id: 'e3', source: 'leftT', target: 'merge' },
      { id: 'e4', source: 'rightT', target: 'merge' },
      { id: 'e5', source: 'merge', target: 'review' },
    ];
    const next = nodes.map((n) =>
      n.id === 'leftT' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('deeply nested chain (5 levels) still invalidates from root change', () => {
    const nodes: AppNode[] = [
      makeNode('n1', 'input'),
      makeNode('n2', 'transform'),
      makeNode('n3', 'transform'),
      makeNode('n4', 'transform'),
      makeNode('n5', 'transform'),
      approvedReview('review'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'review' },
    ];
    const next = nodes.map((n) =>
      n.id === 'n1' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('review node ID reuse: new review with same ID as deleted one gets invalidated if upstream differs', () => {
    // Previous state: input → review (approved)
    const prev: AppNode[] = [
      makeNode('input', 'input'),
      approvedReview('review'),
    ];
    const prevEdges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];

    // Next state: different input content → same review ID (approved)
    const next: AppNode[] = [
      makeNode('input', 'input', { content: 'DIFFERENT' }),
      approvedReview('review'),
    ];
    const nextEdges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];

    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: next,
      previousEdges: prevEdges,
      nextEdges: nextEdges,
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('self-loop edge does not cause infinite traversal', () => {
    const nodes: AppNode[] = [
      makeNode('self', 'transform'),
      approvedReview('review'),
    ];
    const edges: AppEdge[] = [
      { id: 'e-self', source: 'self', target: 'self' },
      { id: 'e1', source: 'self', target: 'review' },
    ];
    const next = nodes.map((n) =>
      n.id === 'self' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('malformed edge entries conservatively invalidate instead of throwing', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      approvedReview('review'),
    ];
    const validEdges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];
    const malformedEdges = [...validEdges, null as unknown as AppEdge];

    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: nodes,
      previousEdges: malformedEdges,
      nextEdges: malformedEdges,
    });

    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('malformed review nodes without data are skipped without throwing', () => {
    for (const data of [null, undefined]) {
      const nodes: AppNode[] = [
        makeNode('input', 'input'),
        {
          id: 'malformed-review',
          type: 'review',
          position: { x: 0, y: 0 },
          data,
        } as unknown as AppNode,
      ];

      expect(invalidateApprovedReviews({
        previousNodes: nodes,
        nextNodes: nodes,
        previousEdges: [],
        nextEdges: [],
      })).toBe(nodes);
    }
  });

  it('empty graph: no crash, returns empty array', () => {
    const result = invalidateApprovedReviews({
      previousNodes: [],
      nextNodes: [],
      previousEdges: [],
      nextEdges: [],
    });
    expect(result).toEqual([]);
  });

  it('all nodes deleted: no crash', () => {
    const prev: AppNode[] = [
      makeNode('input', 'input'),
      approvedReview('review'),
    ];
    const result = invalidateApprovedReviews({
      previousNodes: prev,
      nextNodes: [],
      previousEdges: [{ id: 'e1', source: 'input', target: 'review' }],
      nextEdges: [],
    });
    expect(result).toEqual([]);
  });

  it('review with rejected status is not affected by invalidation', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      makeNode('review', 'review', { status: 'rejected', reviewRequired: true }),
    ];
    const edges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];
    const next = nodes.map((n) =>
      n.id === 'input' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    // rejected != approved, so invalidation doesn't touch it
    expect(getStatus(result, 'review')).toBe('rejected');
  });

  it('duplicate edges do not cause double-counting in signatures', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      approvedReview('review'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'review' },
      { id: 'e2', source: 'input', target: 'review' }, // duplicate
    ];
    // No change → should stay approved
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: nodes,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'review')).toBe('approved');
  });

  it('review upstream of another review: changes propagate to both reviews', () => {
    /**
     *  input → reviewA → reviewB
     *
     * Changing input invalidates both (input is upstream of both).
     * Changing reviewA content invalidates only reviewA (reviewB's
     * upstream includes reviewA, so its signature also changes).
     */
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      approvedReview('reviewA'),
      approvedReview('reviewB'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'reviewA' },
      { id: 'e2', source: 'reviewA', target: 'reviewB' },
    ];

    // Change input → both should invalidate
    const next1 = nodes.map((n) =>
      n.id === 'input' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n,
    );
    const result1 = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next1,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result1, 'reviewA')).toBe('pending');
    expect(getStatus(result1, 'reviewB')).toBe('pending');

    // Change reviewA content → both should invalidate (reviewA is upstream of reviewB)
    const next2 = nodes.map((n) =>
      n.id === 'reviewA' ? { ...n, data: { ...n.data, content: 'NEW CRITERIA' } } : n,
    );
    const result2 = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next2,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result2, 'reviewA')).toBe('pending');
    expect(getStatus(result2, 'reviewB')).toBe('pending');
  });
});
