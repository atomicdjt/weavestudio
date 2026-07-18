import { describe, expect, it } from 'vitest';
import type { WorkspaceDocument } from '../types';
import { createWorkspaceHistory } from './workspaceHistory';

const workspace = (name: string): WorkspaceDocument => ({ schemaVersion: 1, id: 'ws-1', name, templateId: null, createdAt: '', updatedAt: '', sourceMaterial: '', nodes: [], edges: [] });

describe('workspace history', () => {
  it('undoes and redoes a document mutation', () => {
    const history = createWorkspaceHistory(workspace('One'));
    history.record(workspace('Two'));
    expect(history.undo()?.name).toBe('One');
    expect(history.redo()?.name).toBe('Two');
  });
  it('clears redo after a new mutation', () => {
    const history = createWorkspaceHistory(workspace('One'));
    history.record(workspace('Two')); history.undo(); history.record(workspace('Three'));
    expect(history.canRedo()).toBe(false);
  });
  it('coalesces a grouped text edit into one undo step', () => {
    const history = createWorkspaceHistory(workspace('One'));
    history.record(workspace('T'), 'text:node'); history.record(workspace('Tw'), 'text:node');
    expect(history.undo()?.name).toBe('One');
  });
});
