import { beforeEach, describe, expect, it, vi } from 'vitest';
import { claimNavIntent, clearNavIntent } from './navIntent';
import type { WorkspaceDocument } from '../types';
import { WORKSPACE_SCHEMA_VERSION } from '../types';

const memory = new Map<string, string>();

const makeDoc = (id: string, name: string): WorkspaceDocument => ({
  schemaVersion: WORKSPACE_SCHEMA_VERSION,
  id,
  name,
  templateId: 'client-proposal-builder',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sourceMaterial: 'src',
  nodes: [],
  edges: [],
  meta: { guidedDemo: true },
});

vi.mock('./workspaceStore', () => {
  const store = new Map<string, WorkspaceDocument>();
  return {
    loadWorkspaceById: (id: string) => store.get(id) ?? null,
    setActiveWorkspaceId: vi.fn(),
    __store: store,
  };
});

describe('claimNavIntent', () => {
  beforeEach(async () => {
    memory.clear();
    clearNavIntent('intent-a');
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v);
      },
      removeItem: (k: string) => {
        memory.delete(k);
      },
    });

    const mod = await import('./workspaceStore');
    // @ts-expect-error test helper
    mod.__store?.clear?.();
  });

  it('creates once per intent and reuses on double claim (Strict Mode / double-click)', async () => {
    const { __store } = (await import('./workspaceStore')) as unknown as {
      __store: Map<string, WorkspaceDocument>;
    };

    let factoryCalls = 0;
    const factory = () => {
      factoryCalls += 1;
      const doc = makeDoc(`ws_${factoryCalls}`, 'Guided demo: Northline proposal');
      __store.set(doc.id, doc);
      return doc;
    };

    const first = claimNavIntent('intent-a', factory);
    const second = claimNavIntent('intent-a', factory);
    const third = claimNavIntent('intent-a', factory);

    expect(factoryCalls).toBe(1);
    expect(first.id).toBe(second.id);
    expect(second.id).toBe(third.id);
    expect(__store.size).toBe(1);
  });

  it('allows a new workspace for a different intent id', async () => {
    const { __store } = (await import('./workspaceStore')) as unknown as {
      __store: Map<string, WorkspaceDocument>;
    };

    let n = 0;
    const factory = () => {
      n += 1;
      const doc = makeDoc(`ws_${n}`, `Demo ${n}`);
      __store.set(doc.id, doc);
      return doc;
    };

    const a = claimNavIntent('intent-a', factory);
    const b = claimNavIntent('intent-b', factory);
    expect(a.id).not.toBe(b.id);
    expect(__store.size).toBe(2);
  });
});
