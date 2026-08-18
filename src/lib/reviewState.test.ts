import { describe, expect, it } from 'vitest';
import type { AppEdge, AppNode } from '../types';
import { invalidateApprovedReviews } from './reviewState';

const approvedReview = (): AppNode => ({
  id: 'review',
  type: 'review',
  position: { x: 100, y: 100 },
  data: {
    title: 'Human check',
    description: '',
    content: 'Verify the recommendation.',
    status: 'approved',
    reviewRequired: true,
  },
});

const inputNode = (content = 'Source A'): AppNode => ({
  id: 'input',
  type: 'input',
  position: { x: 0, y: 0 },
  data: { title: 'Input', description: '', content },
});

const edges: AppEdge[] = [{ id: 'e1', source: 'input', target: 'review' }];

describe('invalidateApprovedReviews', () => {
  it('resets approved reviews when reviewed workflow content changes', () => {
    const previousNodes = [inputNode('Source A'), approvedReview()];
    const nextNodes = [inputNode('Source B'), approvedReview()];

    const result = invalidateApprovedReviews({
      previousNodes,
      nextNodes,
      previousEdges: edges,
      nextEdges: edges,
    });

    expect(result.find((node) => node.id === 'review')?.data.status).toBe('pending');
  });

  it('resets approved reviews when routing changes', () => {
    const nodes = [inputNode(), approvedReview()];

    const result = invalidateApprovedReviews({
      previousNodes: nodes,
      nextNodes: nodes,
      previousEdges: edges,
      nextEdges: [],
    });

    expect(result.find((node) => node.id === 'review')?.data.status).toBe('pending');
  });

  it('keeps approval for cosmetic position-only changes', () => {
    const previousNodes = [inputNode(), approvedReview()];
    const nextNodes = previousNodes.map((node) =>
      node.id === 'input' ? { ...node, position: { x: 900, y: 700 } } : node,
    );

    const result = invalidateApprovedReviews({
      previousNodes,
      nextNodes,
      previousEdges: edges,
      nextEdges: edges,
    });

    expect(result.find((node) => node.id === 'review')?.data.status).toBe('approved');
  });

  it('does not undo an explicit approval decision when content is unchanged', () => {
    const previousReview: AppNode = {
      ...approvedReview(),
      data: { ...approvedReview().data, status: 'pending' },
    };
    const nextReview = approvedReview();

    const result = invalidateApprovedReviews({
      previousNodes: [inputNode(), previousReview],
      nextNodes: [inputNode(), nextReview],
      previousEdges: edges,
      nextEdges: edges,
    });

    expect(result.find((node) => node.id === 'review')?.data.status).toBe('approved');
  });
});
