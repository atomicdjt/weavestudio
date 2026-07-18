import { describe, expect, it } from 'vitest';
import { autoLayoutNodes } from './autoLayout';
import type { AppNode } from '../types';

const node = (id: string): AppNode => ({ id, type: 'input', position: { x: 0, y: 0 }, data: { title: id, description: '', content: '', status: 'pending' } });

describe('autoLayoutNodes', () => {
  it('places connected nodes in successive stable layers without mutating input', () => {
    const nodes = [node('a'), node('b')];
    const positioned = autoLayoutNodes(nodes, [{ id: 'a-b', source: 'a', target: 'b' }]);
    expect(positioned.map((item) => item.position.x)).toEqual([120, 460]);
    expect(nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it('places disconnected nodes deterministically', () => {
    expect(autoLayoutNodes([node('a'), node('b')], []).map((item) => item.position)).toEqual([{ x: 120, y: 120 }, { x: 120, y: 310 }]);
  });
});
