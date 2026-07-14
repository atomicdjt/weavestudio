import { describe, expect, it } from 'vitest';
import type { AppEdge, AppNode } from '../types';
import { buildWorkflowOutline } from './workflowOutline';

const node = (id: string, title: string): AppNode => ({ id, type: 'transform', position: { x: 0, y: 0 }, data: { title, description: '', content: '' } });

describe('buildWorkflowOutline', () => {
  it('orders roots before connected descendants and labels each relationship', () => {
    const items = buildWorkflowOutline([node('input', 'Source'), node('draft', 'Draft'), node('review', 'Review')], [
      { id: 'e1', source: 'input', target: 'draft' },
      { id: 'e2', source: 'draft', target: 'review' },
    ] as AppEdge[]);

    expect(items.map((item) => item.node.id)).toEqual(['input', 'draft', 'review']);
    expect(items.map((item) => item.depth)).toEqual([0, 1, 2]);
    expect(items[1].incomingFrom).toEqual(['input']);
  });

  it('retains every node when the graph has a cycle', () => {
    const items = buildWorkflowOutline([node('one', 'One'), node('two', 'Two')], [
      { id: 'e1', source: 'one', target: 'two' },
      { id: 'e2', source: 'two', target: 'one' },
    ] as AppEdge[]);

    expect(items.map((item) => item.node.id).sort()).toEqual(['one', 'two']);
  });
});
