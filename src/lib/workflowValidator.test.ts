import { describe, expect, it } from 'vitest';
import type { AppEdge, AppNode, NodeType } from '../types';
import { buildWorkflowValidator, findCycleNodeIds } from './workflowValidator';

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

  it('detects circular dependencies and blocks export readiness with Incomplete', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      makeNode('stepA', 'transform'),
      makeNode('stepB', 'transform'),
      makeNode('review', 'review', 'approved'),
      makeNode('output', 'output'),
    ];
    // Create cycle stepA -> stepB -> stepA
    const edges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'stepA' },
      { id: 'e2', source: 'stepA', target: 'stepB' },
      { id: 'e3', source: 'stepB', target: 'stepA' }, // cycle
      { id: 'e4', source: 'stepB', target: 'review' },
      { id: 'e5', source: 'review', target: 'output' },
    ];

    const result = buildWorkflowValidator(nodes, edges);

    expect(result.exportReadiness).toBe('Incomplete');
    expect(result.completenessScore).toBeLessThan(100);
    const cycleIssues = result.issues.filter((issue) => issue.title === 'Circular dependency detected');
    expect(cycleIssues.length).toBeGreaterThanOrEqual(2);
    expect(cycleIssues.some((issue) => issue.nodeId === 'stepA')).toBe(true);
    expect(cycleIssues.some((issue) => issue.nodeId === 'stepB')).toBe(true);
    expect(result.walkthrough.find((s) => s.nodeId === 'stepA')?.status).toBe('Incomplete');
  });

  it('detects self-loop circular dependency', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      makeNode('transform', 'transform'),
      makeNode('review', 'review', 'approved'),
      makeNode('output', 'output'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'transform' },
      { id: 'e-self', source: 'transform', target: 'transform' }, // self-loop
      { id: 'e2', source: 'transform', target: 'review' },
      { id: 'e3', source: 'review', target: 'output' },
    ];

    const result = buildWorkflowValidator(nodes, edges);

    expect(result.exportReadiness).toBe('Incomplete');
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeId: 'transform',
          status: 'Incomplete',
          title: 'Circular dependency detected',
        }),
      ]),
    );
  });

  it('detects overlapping cycles (cross-edge cycles) and marks all cycle participants without marking acyclic ancestors', () => {
    // A -> B, B -> C -> D -> B, and B -> E -> D -> B, D -> Z
    const nodes: AppNode[] = [
      makeNode('A', 'input'),
      makeNode('B', 'transform'),
      makeNode('C', 'transform'),
      makeNode('D', 'transform'),
      makeNode('E', 'transform'),
      makeNode('Z', 'output'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'B', target: 'C' },
      { id: 'e3', source: 'C', target: 'D' },
      { id: 'e4', source: 'D', target: 'B' },
      { id: 'e5', source: 'B', target: 'E' },
      { id: 'e6', source: 'E', target: 'D' },
      { id: 'e7', source: 'D', target: 'Z' },
    ];

    const cycleNodes = findCycleNodeIds(nodes, edges);
    // B, C, D, E must be in cycleNodes; A and Z must NOT be in cycleNodes
    expect(cycleNodes.has('B')).toBe(true);
    expect(cycleNodes.has('C')).toBe(true);
    expect(cycleNodes.has('D')).toBe(true);
    expect(cycleNodes.has('E')).toBe(true);
    expect(cycleNodes.has('A')).toBe(false);
    expect(cycleNodes.has('Z')).toBe(false);

    const result = buildWorkflowValidator(nodes, edges);
    expect(result.exportReadiness).toBe('Incomplete');
  });

  it('detects two independent disconnected cycles in parallel', () => {
    const nodes: AppNode[] = [
      makeNode('c1_a', 'transform'),
      makeNode('c1_b', 'transform'),
      makeNode('c2_a', 'transform'),
      makeNode('c2_b', 'transform'),
      makeNode('valid_input', 'input'),
      makeNode('valid_output', 'output'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'c1_a', target: 'c1_b' },
      { id: 'e2', source: 'c1_b', target: 'c1_a' },
      { id: 'e3', source: 'c2_a', target: 'c2_b' },
      { id: 'e4', source: 'c2_b', target: 'c2_a' },
      { id: 'e5', source: 'valid_input', target: 'valid_output' },
    ];

    const cycleNodes = findCycleNodeIds(nodes, edges);
    expect(cycleNodes.has('c1_a')).toBe(true);
    expect(cycleNodes.has('c1_b')).toBe(true);
    expect(cycleNodes.has('c2_a')).toBe(true);
    expect(cycleNodes.has('c2_b')).toBe(true);
    expect(cycleNodes.has('valid_input')).toBe(false);
    expect(cycleNodes.has('valid_output')).toBe(false);
  });

  it('diamond DAG without cycles reports 0 cycle issues', () => {
    const nodes: AppNode[] = [
      makeNode('in', 'input'),
      makeNode('left', 'transform'),
      makeNode('right', 'transform'),
      makeNode('merge', 'review', 'approved'),
      makeNode('out', 'output'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'in', target: 'left' },
      { id: 'e2', source: 'in', target: 'right' },
      { id: 'e3', source: 'left', target: 'merge' },
      { id: 'e4', source: 'right', target: 'merge' },
      { id: 'e5', source: 'merge', target: 'out' },
    ];

    const cycleNodes = findCycleNodeIds(nodes, edges);
    expect(cycleNodes.size).toBe(0);

    const result = buildWorkflowValidator(nodes, edges);
    const cycleIssues = result.issues.filter((i) => i.title === 'Circular dependency detected');
    expect(cycleIssues.length).toBe(0);
  });

  it('duplicate edges do not create false cycles', () => {
    const nodes: AppNode[] = [
      makeNode('in', 'input'),
      makeNode('step', 'transform'),
      makeNode('out', 'output'),
    ];
    const edges: AppEdge[] = [
      { id: 'e1', source: 'in', target: 'step' },
      { id: 'e2', source: 'in', target: 'step' }, // duplicate forward edge
      { id: 'e3', source: 'step', target: 'out' },
    ];

    const cycleNodes = findCycleNodeIds(nodes, edges);
    expect(cycleNodes.size).toBe(0);
  });

  it('long acyclic chain has zero cycle issues', () => {
    const nodes: AppNode[] = Array.from({ length: 20 }, (_, i) =>
      makeNode(`n_${i}`, i === 0 ? 'input' : i === 19 ? 'output' : 'transform'),
    );
    const edges: AppEdge[] = Array.from({ length: 19 }, (_, i) => ({
      id: `e_${i}`,
      source: `n_${i}`,
      target: `n_${i + 1}`,
    }));

    const cycleNodes = findCycleNodeIds(nodes, edges);
    expect(cycleNodes.size).toBe(0);
  });

  it('cycle involving human review node blocks review from certifying workflow', () => {
    const nodes: AppNode[] = [
      makeNode('input', 'input'),
      makeNode('review', 'review', 'approved'),
      makeNode('transform', 'transform'),
      makeNode('output', 'output'),
    ];
    // review -> transform -> review cycle
    const edges: AppEdge[] = [
      { id: 'e1', source: 'input', target: 'review' },
      { id: 'e2', source: 'review', target: 'transform' },
      { id: 'e3', source: 'transform', target: 'review' },
      { id: 'e4', source: 'transform', target: 'output' },
    ];

    const result = buildWorkflowValidator(nodes, edges);
    expect(result.exportReadiness).toBe('Incomplete');
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeId: 'review',
          status: 'Incomplete',
          title: 'Circular dependency detected',
        }),
      ]),
    );
  });
});
