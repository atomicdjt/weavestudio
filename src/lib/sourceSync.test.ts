import { describe, expect, it } from 'vitest';
import { computeSourceSyncStatus, getPrimaryInputContent } from './sourceSync';
import {
  applySourceToInputNode,
  splitSourceIntoNodes,
  willOverwriteInputContent,
} from './structureSource';
import type { AppNode } from '../types';

const baseNodes: AppNode[] = [
  {
    id: 'in',
    type: 'input',
    position: { x: 0, y: 0 },
    data: { title: 'Input', description: '', content: 'old source', category: 'source' },
  },
  {
    id: 't1',
    type: 'transform',
    position: { x: 100, y: 0 },
    data: { title: 'Manual edit', description: '', content: 'keep me', category: 'action' },
  },
];

describe('source sync', () => {
  it('marks source_ahead when panel changes after apply', () => {
    const status = computeSourceSyncStatus('new panel text', baseNodes, 'old source');
    expect(status).toBe('source_ahead');
  });

  it('marks in_sync when source matches input', () => {
    expect(computeSourceSyncStatus('old source', baseNodes, 'old source')).toBe('in_sync');
  });

  it('apply updates only the input node content', () => {
    const next = applySourceToInputNode(baseNodes, 'new source');
    expect(getPrimaryInputContent(next)).toBe('new source');
    expect(next.find((n) => n.id === 't1')?.data.content).toBe('keep me');
    expect(next.find((n) => n.id === 't1')?.position).toEqual({ x: 100, y: 0 });
  });

  it('detects overwrite of input content', () => {
    expect(willOverwriteInputContent(baseNodes, 'different')).toBe(true);
    expect(willOverwriteInputContent(baseNodes, 'old source')).toBe(false);
  });

  it('append split preserves existing derived nodes', () => {
    const result = splitSourceIntoNodes('A\n\nB', baseNodes, [], { replaceDerived: false });
    expect(result.nodes.some((n) => n.id === 't1')).toBe(true);
    expect(result.createdCount).toBe(2);
    expect(result.removedCount).toBe(0);
  });

  it('replaceDerived removes prior transforms', () => {
    const result = splitSourceIntoNodes('A\n\nB', baseNodes, [{ id: 'e1', source: 'in', target: 't1' }], {
      replaceDerived: true,
    });
    expect(result.nodes.some((n) => n.id === 't1')).toBe(false);
    expect(result.createdCount).toBe(2);
    expect(result.removedCount).toBe(1);
  });
});
