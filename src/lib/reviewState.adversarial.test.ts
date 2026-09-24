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

  it('null and undefined node entries are ignored when no review is approved', () => {
    for (const malformedNode of [null, undefined]) {
      const nodes = [makeNode('input', 'input'), malformedNode] as unknown as AppNode[];

      expect(invalidateApprovedReviews({
        previousNodes: nodes,
        nextNodes: nodes,
        previousEdges: [],
        nextEdges: [],
      })).toBe(nodes);
    }
  });

  it('malformed entries in either node collection fail closed for approved reviews', () => {
    for (const malformedNode of [null, undefined]) {
      const validNodes = [makeNode('input', 'input'), approvedReview('review')];
      const edges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];

      const malformedNext = [...validNodes, malformedNode] as unknown as AppNode[];
      const nextResult = invalidateApprovedReviews({
        previousNodes: validNodes,
        nextNodes: malformedNext,
        previousEdges: edges,
        nextEdges: edges,
      });
      expect(getStatus(nextResult, 'review')).toBe('pending');
      expect(nextResult.at(-1)).toBe(malformedNode);

      const previousResult = invalidateApprovedReviews({
        previousNodes: [...validNodes, malformedNode] as unknown as AppNode[],
        nextNodes: validNodes,
        previousEdges: edges,
        nextEdges: edges,
      });
      expect(getStatus(previousResult, 'review')).toBe('pending');
    }
  });

  it('duplicate IDs in previousNodes fail closed for approved reviews', () => {
    const nodes = [makeNode('input', 'input'), approvedReview('review')];
    const duplicateInput = makeNode('input', 'input', { content: 'UNTRACKED CHANGE' });
    const edges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];

    const result = invalidateApprovedReviews({
      previousNodes: [duplicateInput, ...nodes],
      nextNodes: nodes,
      previousEdges: edges,
      nextEdges: edges,
    });

    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('duplicate IDs in nextNodes fail closed for approved reviews', () => {
    const nodes = [makeNode('input', 'input'), approvedReview('review')];
    const duplicateInput = makeNode('input', 'input', { content: 'UNTRACKED CHANGE' });
    const edges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];

    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: [duplicateInput, ...nodes],
      previousEdges: edges,
      nextEdges: edges,
    });

    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('unique node IDs preserve approval when no semantic input changes', () => {
    const nodes = [makeNode('input', 'input'), approvedReview('review')];
    const edges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];

    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: nodes,
      previousEdges: edges,
      nextEdges: edges,
    });

    expect(getStatus(result, 'review')).toBe('approved');
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

  it('upstream review status transition (approved -> rejected) invalidates downstream approved review', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      approvedReview('reviewA'),
      approvedReview('reviewB'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'reviewA' },
      { id: 'e2', source: 'reviewA', target: 'reviewB' },
    ];

    // Reject reviewA -> downstream reviewB must be invalidated
    const next = nodes.map((n) =>
      n.id === 'reviewA' ? { ...n, data: { ...n.data, status: 'rejected' as const } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'reviewB')).toBe('pending');
  });

  it('upstream review status transition (approved -> pending) invalidates downstream approved review', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      approvedReview('reviewA'),
      approvedReview('reviewB'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'reviewA' },
      { id: 'e2', source: 'reviewA', target: 'reviewB' },
    ];

    // Reset reviewA to pending -> downstream reviewB must be invalidated
    const next = nodes.map((n) =>
      n.id === 'reviewA' ? { ...n, data: { ...n.data, status: 'pending' as const } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'reviewB')).toBe('pending');
  });

  it('parallel independent review rejection does not invalidate sibling review', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      approvedReview('reviewA'),
      approvedReview('reviewB'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'reviewA' },
      { id: 'e2', source: 'input', target: 'reviewB' },
    ];

    // Reject reviewA -> reviewB is not downstream of reviewA, so reviewB stays approved
    const next = nodes.map((n) =>
      n.id === 'reviewA' ? { ...n, data: { ...n.data, status: 'rejected' as const } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'reviewA')).toBe('rejected');
    expect(getStatus(result, 'reviewB')).toBe('approved');
  });

  it('upstream aiAssist baseUrl change invalidates downstream approved review', () => {
    const nodes: AppNode[] = [
      makeNode('ai', 'aiAssist', { baseUrl: 'https://api.openai.com/v1', modelName: 'gpt-4o' }),
      approvedReview('review'),
    ];
    const edges: AppEdge[] = [{ id: 'e1', source: 'ai', target: 'review' }];

    const next = nodes.map((n) =>
      n.id === 'ai' ? { ...n, data: { ...n.data, baseUrl: 'http://localhost:11434/v1' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('upstream aiAssist providerNote change invalidates downstream approved review', () => {
    const nodes: AppNode[] = [
      makeNode('ai', 'aiAssist', { providerNote: 'Initial note' }),
      approvedReview('review'),
    ];
    const edges: AppEdge[] = [{ id: 'e1', source: 'ai', target: 'review' }];

    const next = nodes.map((n) =>
      n.id === 'ai' ? { ...n, data: { ...n.data, providerNote: 'Updated security caveat' } } : n,
    );
    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: next,
      previousEdges: edges,
      nextEdges: edges,
    });
    expect(getStatus(result, 'review')).toBe('pending');
  });

  it('removing redundant duplicate edges does not trigger false invalidation', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      approvedReview('review'),
    ];
    const duplicateEdges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'review' },
      { id: 'e2', source: 'input', target: 'review' },
    ];
    const cleanEdges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];

    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: nodes,
      previousEdges: duplicateEdges,
      nextEdges: cleanEdges,
    });
    expect(getStatus(result, 'review')).toBe('approved');
  });

  describe('Complex review graph topologies', () => {
    /**
     * Topology:
     *        Input
     *          │
     *       ReviewA
     *       ┌──┴──┐
     *    ReviewB ReviewC
     *       └──┬──┘
     *       ReviewD
     */
    const diamondNodes: AppNode[] = [
      makeNode('input', 'input'),
      approvedReview('reviewA'),
      approvedReview('reviewB'),
      approvedReview('reviewC'),
      approvedReview('reviewD'),
    ];
    const diamondEdges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'reviewA' },
      { id: 'e2', source: 'reviewA', target: 'reviewB' },
      { id: 'e3', source: 'reviewA', target: 'reviewC' },
      { id: 'e4', source: 'reviewB', target: 'reviewD' },
      { id: 'e5', source: 'reviewC', target: 'reviewD' },
    ];

    it('changing Review A invalidates Review B, Review C, and convergent Review D', () => {
      const next = diamondNodes.map((n) =>
        n.id === 'reviewA' ? { ...n, data: { ...n.data, content: 'Updated A review criteria' } } : n,
      );
      const result = invalidateApprovedReviews({
        previousNodes: diamondNodes,
        nextNodes: next,
        previousEdges: diamondEdges,
        nextEdges: diamondEdges,
      });
      expect(getStatus(result, 'reviewA')).toBe('pending');
      expect(getStatus(result, 'reviewB')).toBe('pending');
      expect(getStatus(result, 'reviewC')).toBe('pending');
      expect(getStatus(result, 'reviewD')).toBe('pending');
    });

    it('rejecting Review B while Review C stays approved invalidates Review D but preserves Review C', () => {
      const next = diamondNodes.map((n) =>
        n.id === 'reviewB' ? { ...n, data: { ...n.data, status: 'rejected' as const } } : n,
      );
      const result = invalidateApprovedReviews({
        previousNodes: diamondNodes,
        nextNodes: next,
        previousEdges: diamondEdges,
        nextEdges: diamondEdges,
      });
      expect(getStatus(result, 'reviewA')).toBe('approved'); // untouched upstream
      expect(getStatus(result, 'reviewB')).toBe('rejected'); // rejected
      expect(getStatus(result, 'reviewC')).toBe('approved'); // sibling remains approved!
      expect(getStatus(result, 'reviewD')).toBe('pending');  // downstream must be invalidated!
    });

    it('re-approving Review A after invalidation does not auto-resurrect downstream without explicit review', () => {
      // Review A is now re-approved, but downstream nodes are pending
      const currentNodes: AppNode[] = [
        makeNode('input', 'input'),
        approvedReview('reviewA'),
        makeNode('reviewB', 'review', { status: 'pending' as const, reviewRequired: true }),
        approvedReview('reviewC'),
        makeNode('reviewD', 'review', { status: 'pending' as const, reviewRequired: true }),
      ];
      // Next state: no changes
      const result = invalidateApprovedReviews({
        previousNodes: currentNodes,
        nextNodes: currentNodes,
        previousEdges: diamondEdges,
        nextEdges: diamondEdges,
      });
      // Review B and D must NOT automatically become approved!
      expect(getStatus(result, 'reviewB')).toBe('pending');
      expect(getStatus(result, 'reviewD')).toBe('pending');
    });

    it('handles repeated pending -> approved -> rejected -> approved cycles safely', () => {
      let stateNodes = diamondNodes;
      // Step 1: Reject B
      let nextNodes = stateNodes.map((n) => n.id === 'reviewB' ? { ...n, data: { ...n.data, status: 'rejected' as const } } : n);
      stateNodes = invalidateApprovedReviews({ previousNodes: stateNodes, nextNodes, previousEdges: diamondEdges, nextEdges: diamondEdges });
      expect(getStatus(stateNodes, 'reviewD')).toBe('pending');

      // Step 2: Approve B again
      nextNodes = stateNodes.map((n) => n.id === 'reviewB' ? { ...n, data: { ...n.data, status: 'approved' as const } } : n);
      stateNodes = invalidateApprovedReviews({ previousNodes: stateNodes, nextNodes, previousEdges: diamondEdges, nextEdges: diamondEdges });
      expect(getStatus(stateNodes, 'reviewB')).toBe('approved');
      expect(getStatus(stateNodes, 'reviewD')).toBe('pending'); // D still pending until human approves D

      // Step 3: Approve D
      nextNodes = stateNodes.map((n) => n.id === 'reviewD' ? { ...n, data: { ...n.data, status: 'approved' as const } } : n);
      stateNodes = invalidateApprovedReviews({ previousNodes: stateNodes, nextNodes, previousEdges: diamondEdges, nextEdges: diamondEdges });
      expect(getStatus(stateNodes, 'reviewD')).toBe('approved');
    });

    it('deleting an upstream review invalidates downstream review', () => {
      // Delete reviewB -> edges connected to reviewB are removed
      const remainingNodes = diamondNodes.filter((n) => n.id !== 'reviewB');
      const remainingEdges = diamondEdges.filter((e) => e.source !== 'reviewB' && e.target !== 'reviewB');

      const result = invalidateApprovedReviews({
        previousNodes: diamondNodes,
        nextNodes: remainingNodes,
        previousEdges: diamondEdges,
        nextEdges: remainingEdges,
      });
      // Review D lost an upstream dependency branch -> must be invalidated
      expect(getStatus(result, 'reviewD')).toBe('pending');
    });

    it('inserting a new review between previously approved nodes invalidates downstream review', () => {
      const nodes: AppNode[] = [
        makeNode('input', 'input'),
        approvedReview('reviewFinal'),
      ];
      const initialEdges: AppEdge[] = [
        { id: 'e1', source: 'input', target: 'reviewFinal' },
      ];

      // Insert newReview: input -> newReview -> reviewFinal
      const expandedNodes: AppNode[] = [
        makeNode('input', 'input'),
        makeNode('newReview', 'review', { status: 'pending', reviewRequired: true }),
        approvedReview('reviewFinal'),
      ];
      const reconnectedEdges: AppEdge[] = [
        { id: 'e1', source: 'input', target: 'newReview' },
        { id: 'e2', source: 'newReview', target: 'reviewFinal' },
      ];

      const result = invalidateApprovedReviews({
        previousNodes: nodes,
        nextNodes: expandedNodes,
        previousEdges: initialEdges,
        nextEdges: reconnectedEdges,
      });
      expect(getStatus(result, 'reviewFinal')).toBe('pending');
    });

    it('reconnecting around an upstream review invalidates downstream review', () => {
      // input -> reviewA -> reviewB. Reconnect input -> reviewB directly (bypassing reviewA)
      const nodes: AppNode[] = [
        makeNode('input', 'input'),
        approvedReview('reviewA'),
        approvedReview('reviewB'),
      ];
      const initialEdges: AppEdge[] = [
        { id: 'e1', source: 'input', target: 'reviewA' },
        { id: 'e2', source: 'reviewA', target: 'reviewB' },
      ];
      const reconnectedEdges: AppEdge[] = [
        { id: 'e1', source: 'input', target: 'reviewA' },
        { id: 'e3', source: 'input', target: 'reviewB' }, // bypassed reviewA
      ];

      const result = invalidateApprovedReviews({
        previousNodes: nodes,
        nextNodes: nodes,
        previousEdges: initialEdges,
        nextEdges: reconnectedEdges,
      });
      expect(getStatus(result, 'reviewB')).toBe('pending');
    });

    it('completely disconnected reviews do not invalidate each other', () => {
      const nodes: AppNode[] = [
        makeNode('in1', 'input'),
        approvedReview('review1'),
        makeNode('in2', 'input'),
        approvedReview('review2'),
      ];
      const edges: AppEdge[] = [
        { id: 'e1', source: 'in1', target: 'review1' },
        { id: 'e2', source: 'in2', target: 'review2' },
      ];

      // Modify in1 -> review1 invalidated, review2 completely untouched
      const next = nodes.map((n) => n.id === 'in1' ? { ...n, data: { ...n.data, content: 'MODIFIED' } } : n);
      const result = invalidateApprovedReviews({
        previousNodes: nodes,
        nextNodes: next,
        previousEdges: edges,
        nextEdges: edges,
      });
      expect(getStatus(result, 'review1')).toBe('pending');
      expect(getStatus(result, 'review2')).toBe('approved');
    });
  });

  describe('Property-style invariants', () => {
    it('mutations outside Gupstream(R) cannot invalidate R', () => {
      const nodes: AppNode[] = [
        makeNode('in', 'input'),
        approvedReview('targetReview'),
        makeNode('sibling', 'transform'),
        makeNode('downstream', 'output'),
      ];
      const edges: AppEdge[] = [
        { id: 'e1', source: 'in', target: 'targetReview' },
        { id: 'e2', source: 'targetReview', target: 'downstream' },
        // sibling is disconnected from targetReview
      ];

      // Mutate sibling and downstream
      const next = nodes.map((n) => {
        if (n.id === 'sibling') return { ...n, data: { ...n.data, content: 'SIBLING MUTATED' } };
        if (n.id === 'downstream') return { ...n, data: { ...n.data, content: 'OUTPUT MUTATED' } };
        return n;
      });

      const result = invalidateApprovedReviews({
        previousNodes: nodes,
        nextNodes: next,
        previousEdges: edges,
        nextEdges: edges,
      });
      expect(getStatus(result, 'targetReview')).toBe('approved');
    });

    it('semantic mutations inside Gupstream(R) must invalidate R', () => {
      const nodes: AppNode[] = [
        makeNode('in', 'input'),
        makeNode('step', 'transform'),
        approvedReview('targetReview'),
      ];
      const edges: AppEdge[] = [
        { id: 'e1', source: 'in', target: 'step' },
        { id: 'e2', source: 'step', target: 'targetReview' },
      ];

      // Any semantic mutation on step must invalidate targetReview
      const fieldsToTest: Array<Partial<AppNode['data']>> = [
        { title: 'New title' },
        { description: 'New description' },
        { content: 'New content' },
        { promptInstruction: 'New instruction' },
        { expectedInput: 'New expected input' },
        { expectedOutput: 'New expected output' },
        { category: 'risk' as const },
        { modelName: 'new-model' },
        { baseUrl: 'http://new-url' },
        { providerNote: 'New caveat' },
      ];

      for (const override of fieldsToTest) {
        const next = nodes.map((n) => (n.id === 'step' ? { ...n, data: { ...n.data, ...override } } : n));
        const result = invalidateApprovedReviews({
          previousNodes: nodes,
          nextNodes: next,
          previousEdges: edges,
          nextEdges: edges,
        });
        expect(getStatus(result, 'targetReview')).toBe('pending');
      }
    });

    it('layout-only mutations never invalidate approval', () => {
      const nodes: AppNode[] = [
        makeNode('in', 'input'),
        approvedReview('targetReview'),
      ];
      const edges: AppEdge[] = [{ id: 'e1', source: 'in', target: 'targetReview' }];

      // Move nodes, resize, select, drag
      const next: AppNode[] = nodes.map((n) => ({
        ...n,
        position: { x: n.position.x + 150, y: n.position.y + 200 },
        selected: true,
        dragging: true,
        measured: { width: 300, height: 200 },
      }));

      const result = invalidateApprovedReviews({
        previousNodes: nodes,
        nextNodes: next,
        previousEdges: edges,
        nextEdges: edges,
      });
      expect(getStatus(result, 'targetReview')).toBe('approved');
    });

    it('invalidating an approval is idempotent', () => {
      const nodes: AppNode[] = [
        makeNode('in', 'input'),
        approvedReview('targetReview'),
      ];
      const edges: AppEdge[] = [{ id: 'e1', source: 'in', target: 'targetReview' }];
      const next = nodes.map((n) => (n.id === 'in' ? { ...n, data: { ...n.data, content: 'CHANGED' } } : n));

      const pass1 = invalidateApprovedReviews({
        previousNodes: nodes,
        nextNodes: next,
        previousEdges: edges,
        nextEdges: edges,
      });
      const pass2 = invalidateApprovedReviews({
        previousNodes: nodes,
        nextNodes: pass1,
        previousEdges: edges,
        nextEdges: edges,
      });
      expect(pass1).toEqual(pass2);
    });

    it('equivalent graphs with different array orderings produce identical signatures (no false invalidation)', () => {
      const nodesA: AppNode[] = [
        makeNode('n1', 'input'),
        makeNode('n2', 'transform'),
        approvedReview('review'),
      ];
      const edgesA: AppEdge[] = [
        { id: 'e1', source: 'n1', target: 'review' },
        { id: 'e2', source: 'n2', target: 'review' },
      ];

      // Reverse array order of nodes and edges
      const nodesB: AppNode[] = [nodesA[2], nodesA[0], nodesA[1]];
      const edgesB: AppEdge[] = [edgesA[1], edgesA[0]];

      const result = invalidateApprovedReviews({
        previousNodes: nodesA,
        nextNodes: nodesB,
        previousEdges: edgesA,
        nextEdges: edgesB,
      });
      expect(getStatus(result, 'review')).toBe('approved');
    });

    it('serialization round-trip preserves legitimate approval state', () => {
      const nodes: AppNode[] = [
        makeNode('in', 'input'),
        approvedReview('review'),
      ];
      const edges: AppEdge[] = [{ id: 'e1', source: 'in', target: 'review' }];

      const serializedNodes = JSON.parse(JSON.stringify(nodes)) as AppNode[];
      const serializedEdges = JSON.parse(JSON.stringify(edges)) as AppEdge[];

      const result = invalidateApprovedReviews({
        previousNodes: nodes,
        nextNodes: serializedNodes,
        previousEdges: edges,
        nextEdges: serializedEdges,
      });
      expect(getStatus(result, 'review')).toBe('approved');
    });
  });
});
