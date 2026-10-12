// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INDEX_KEY, LEGACY_WORKSPACE_KEY, ensureMigratedStore } from './migrations';

const legacyWorkspace = {
  nodes: [{
    id: 'legacy-input', type: 'input', position: { x: 0, y: 0 },
    data: { title: 'Legacy source', description: '', content: 'Preserve this source.' },
  }],
  edges: [],
};

describe('legacy store migration writes', () => {
  beforeEach(() => localStorage.clear());

  it('rolls back a staged document when writing the migrated index fails', () => {
    localStorage.setItem(LEGACY_WORKSPACE_KEY, JSON.stringify(legacyWorkspace));
    const before = Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]));
    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === INDEX_KEY) throw new DOMException('Storage blocked', 'SecurityError');
      return originalSetItem.call(this, key, value);
    });

    const result = ensureMigratedStore();

    setItem.mockRestore();
    expect(Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]))).toEqual(before);
    expect(localStorage.getItem(LEGACY_WORKSPACE_KEY)).toBe(JSON.stringify(legacyWorkspace));
    expect(result.index.workspaces).toEqual([]);
  });

  it('does not create an index that points to a document the browser refused to save', () => {
    localStorage.setItem(LEGACY_WORKSPACE_KEY, JSON.stringify(legacyWorkspace));
    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key.startsWith('weavestudio_v1_ws_')) throw new DOMException('Storage blocked', 'SecurityError');
      return originalSetItem.call(this, key, value);
    });

    const result = ensureMigratedStore();

    setItem.mockRestore();
    expect(localStorage.getItem(INDEX_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_WORKSPACE_KEY)).toBe(JSON.stringify(legacyWorkspace));
    expect(result.index.workspaces).toEqual([]);
  });
});
