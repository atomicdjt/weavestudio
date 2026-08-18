import { describe, expect, it } from 'vitest';
import type { AppEdge, AppNode, NodeType } from '../types';
import { buildWorkflowValidator } from './workflowValidator';

const makeNode = (
  id: string,
  type: NodeType,
  status: AppNode['data']['status'] = 'pending',
): AppNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {
    title: id,
    description: '',
    content: `${id} content`,
    status,
    ...(type === 'review' ? { reviewRequired: true } : {}),
  },
});

const makeReviewGraph = (reviewStatus: string) => {
  const nodes: AppNode[] = [
    makeNode('input', 'input'),
    makeNode('review', 'review', reviewStatus as AppNode['data']['status']),
    makeNode('output', 'output'),
  ];
  const edges: AppEdge[] = [
    { id: 'input-review', source: 'input', target: 'review' },
    { id: 'review-output', source: 'review', target: 'output' },
  ];
  return { nodes, edges };
};

describe('buildWorkflowValidator human review readiness', () => {
  it('blocks Ready while a required review is pending', () => {
    const { nodes, edges } = makeReviewGraph('pending');

    const result = buildWorkflowValidator(nodes, edges);

    expect(result.exportReadiness).toBe('Needs Review');
    expect(result.completenessScore).toBeLessThan(100);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeId: 'review',
          status: 'Needs Review',
          title: 'Human approval pending',
        }),
      ]),
    );
  });

  it('allows Ready only after the required review is explicitly approved', () => {
    const { nodes, edges } = makeReviewGraph('approved');

    const result = buildWorkflowValidator(nodes, edges);

    expect(result.exportReadiness).toBe('Ready');
    expect(result.completenessScore).toBe(100);
    expect(result.issueCount).toBe(0);
    expect(result.walkthrough.find((step) => step.nodeId === 'review')?.status).toBe('Ready');
  });

  it('blocks Ready and surfaces remediation when a required review is rejected', () => {
    const { nodes, edges } = makeReviewGraph('rejected');

    const result = buildWorkflowValidator(nodes, edges);

    expect(result.exportReadiness).toBe('Needs Review');
    expect(result.completenessScore).toBeLessThan(100);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeId: 'review',
          status: 'Needs Review',
          title: 'Review rejected',
          suggestedFix: expect.stringContaining('approve'),
        }),
      ]),
    );
  });
});
