import type { WorkspaceDocument } from '../types';

export type WorkspaceHistory = {
  record: (next: WorkspaceDocument, group?: string) => void;
  undo: () => WorkspaceDocument | null;
  redo: () => WorkspaceDocument | null;
  reset: (workspace: WorkspaceDocument) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

export const createWorkspaceHistory = (initial: WorkspaceDocument, limit = 80): WorkspaceHistory => {
  let past: WorkspaceDocument[] = [];
  let current = structuredClone(initial);
  let future: WorkspaceDocument[] = [];
  let lastGroup: string | undefined;
  const clone = (doc: WorkspaceDocument) => structuredClone(doc);
  return {
    record(next, group) {
      if (JSON.stringify(current) === JSON.stringify(next)) return;
      if (group !== lastGroup || past.length === 0) past = [...past, clone(current)].slice(-limit);
      current = clone(next); future = []; lastGroup = group;
    },
    undo() { if (!past.length) return null; future = [clone(current), ...future].slice(0, limit); current = past.pop()!; lastGroup = undefined; return clone(current); },
    redo() { if (!future.length) return null; past = [...past, clone(current)].slice(-limit); current = future.shift()!; lastGroup = undefined; return clone(current); },
    reset(workspace) { past = []; future = []; current = clone(workspace); lastGroup = undefined; },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
};
