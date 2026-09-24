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
  it('resets history cleanly when switching or initializing a new workspace', () => {
    const history = createWorkspaceHistory(workspace('Workspace A'));
    history.record(workspace('Workspace A modified'));
    expect(history.canUndo()).toBe(true);

    history.reset(workspace('Workspace B'));
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.undo()).toBeNull();
  });

  it('proves that history from one workspace can never mutate another across switches', () => {
    const wsA: WorkspaceDocument = { schemaVersion: 1, id: 'ws-a', name: 'Workspace A', templateId: null, createdAt: '', updatedAt: '', sourceMaterial: 'A source', nodes: [], edges: [] };
    const wsB: WorkspaceDocument = { schemaVersion: 1, id: 'ws-b', name: 'Workspace B', templateId: null, createdAt: '', updatedAt: '', sourceMaterial: 'B source', nodes: [], edges: [] };

    const history = createWorkspaceHistory(wsA);
    // User edits A
    const wsAEdited = { ...wsA, name: 'Workspace A - Edited' };
    history.record(wsAEdited);
    expect(history.canUndo()).toBe(true);

    // Switch to workspace B -> reset
    history.reset(wsB);
    expect(history.canUndo()).toBe(false);

    // User edits B
    const wsBEdited = { ...wsB, name: 'Workspace B - Edited' };
    history.record(wsBEdited);

    // Undo on workspace B returns initial wsB, NEVER wsA or wsAEdited!
    const undone = history.undo();
    expect(undone?.id).toBe('ws-b');
    expect(undone?.name).toBe('Workspace B');

    // Further undo is impossible; history stack is exhausted
    expect(history.undo()).toBeNull();
    expect(history.canUndo()).toBe(false);
  });

  it('rapid workspace switching maintains strict isolation', () => {
    const ws1 = workspace('WS 1');
    const ws2 = workspace('WS 2');
    const history = createWorkspaceHistory(ws1);

    // Edit 1 -> Switch to 2 -> Edit 2 -> Switch to 1 -> Edit 1 again
    history.record({ ...ws1, name: 'WS 1 v2' });
    history.reset(ws2);
    history.record({ ...ws2, name: 'WS 2 v2' });
    history.reset(ws1);
    history.record({ ...ws1, name: 'WS 1 v3' });

    // Undoing in WS 1 can only undo to WS 1 baseline, never WS 2
    const undone = history.undo();
    expect(undone?.name).toBe('WS 1');
    expect(history.undo()).toBeNull();
  });
});
