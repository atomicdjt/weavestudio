import { beforeEach, describe, expect, it, vi } from 'vitest';

const created: Array<{ name: string; meta?: { guidedDemo?: boolean } }> = [];

const sessionMap = new Map<string, string>();

vi.mock('./workspaceStore', () => {
  const store = new Map<string, { id: string; name: string; meta?: { guidedDemo?: boolean } }>();
  return {
    createWorkspace: (options: {
      name?: string;
      meta?: { guidedDemo?: boolean };
      id?: string;
    }) => {
      const id = options.id ?? `ws_${created.length + 1}`;
      const doc = {
        id,
        name: options.name ?? 'Untitled',
        meta: options.meta,
        nodes: [],
        edges: [],
        sourceMaterial: '',
        templateId: null,
      };
      created.push({ name: doc.name, meta: doc.meta });
      store.set(id, doc);
      return doc;
    },
    loadWorkspaceById: (id: string) => store.get(id) ?? null,
    setActiveWorkspaceId: vi.fn(),
  };
});

vi.mock('../data/demos/guidedDemo', () => ({
  createGuidedDemoWorkspace: () => ({
    name: 'Guided demo: Northline proposal',
    templateId: 'client-proposal-builder',
    nodes: [
      {
        id: 'n1',
        type: 'input',
        position: { x: 0, y: 0 },
        data: { title: 'I', description: '', content: 'demo' },
      },
    ],
    edges: [],
    sourceMaterial: 'demo',
  }),
}));

vi.mock('../data/templates', () => ({
  getTemplateById: () => null,
  resolveTemplateId: (id: string) => id,
}));

describe('resolveWorkspaceFromNav / guided demo', () => {
  beforeEach(() => {
    created.length = 0;
    sessionMap.clear();
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => sessionMap.get(k) ?? null,
      setItem: (k: string, v: string) => {
        sessionMap.set(k, v);
      },
      removeItem: (k: string) => {
        sessionMap.delete(k);
      },
    });
  });

  it('one guided-demo intent creates exactly one workspace (no Client Proposal side effect)', async () => {
    const { resolveWorkspaceFromNav } = await import('./workspaceInit');

    const a = resolveWorkspaceFromNav({ openGuidedDemo: true, intentId: 'same-intent' });
    const b = resolveWorkspaceFromNav({ openGuidedDemo: true, intentId: 'same-intent' });
    const c = resolveWorkspaceFromNav({ openGuidedDemo: true, intentId: 'same-intent' });

    expect(a?.name).toBe('Guided demo: Northline proposal');
    expect(a?.id).toBe(b?.id);
    expect(b?.id).toBe(c?.id);
    expect(created).toHaveLength(1);
    expect(created.every((entry) => entry.name !== 'Client Proposal Builder')).toBe(true);
  });

  it('rapid double-click with same intentId does not duplicate', async () => {
    const { resolveWorkspaceFromNav } = await import('./workspaceInit');
    const intentId = 'double-click';
    resolveWorkspaceFromNav({ openGuidedDemo: true, intentId });
    resolveWorkspaceFromNav({ openGuidedDemo: true, intentId });
    resolveWorkspaceFromNav({ openGuidedDemo: true, intentId });
    expect(created).toHaveLength(1);
  });

  it('new intentId creates a separate intentional demo workspace', async () => {
    const { resolveWorkspaceFromNav } = await import('./workspaceInit');
    const first = resolveWorkspaceFromNav({ openGuidedDemo: true, intentId: 'one' });
    const second = resolveWorkspaceFromNav({ openGuidedDemo: true, intentId: 'two' });
    expect(first?.id).not.toBe(second?.id);
    expect(created).toHaveLength(2);
  });
});
