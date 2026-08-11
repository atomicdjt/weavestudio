// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectFullBrowserBackup, createWorkspace, inspectFullBrowserBackup, restoreFullBrowserBackup } from './workspaceStore';

describe('full browser backup recovery', () => {
  beforeEach(() => localStorage.clear());

  it('rejects corrupt data before changing browser storage', () => {
    localStorage.setItem('weavestudio_marker', 'unchanged');
    const inspected = inspectFullBrowserBackup({ weavestudio_workspace_index: '{bad json' });
    expect(inspected.ok).toBe(false);
    if (!inspected.ok) expect(inspected.error).toMatch(/invalid/i);
    expect(localStorage.getItem('weavestudio_marker')).toBe('unchanged');
  });

  it('stages and restores only owned keys', () => {
    createWorkspace({ name: 'Recovery source' });
    const backup = collectFullBrowserBackup();
    localStorage.setItem('unrelated_key', 'keep');
    localStorage.setItem('weavestudio_marker', 'remove');
    const inspected = inspectFullBrowserBackup(backup);
    expect(inspected.ok).toBe(true);
    if (inspected.ok) expect(restoreFullBrowserBackup(inspected.data).ok).toBe(true);
    expect(localStorage.getItem('unrelated_key')).toBe('keep');
    expect(localStorage.getItem('weavestudio_marker')).toBeNull();
  });

  it('rolls back owned records when a staged restore write fails', () => {
    localStorage.setItem('weavestudio_marker', JSON.stringify({ state: 'before' }));
    localStorage.setItem('unrelated_key', 'keep');
    const inspected = inspectFullBrowserBackup({
      weavestudio_workspace_index: JSON.stringify({ version: 2, activeWorkspaceId: null, workspaces: [] }),
      weavestudio_marker: JSON.stringify({ state: 'after' }),
    });
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;

    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    let injected = false;
    setItem.mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'weavestudio_marker' && value.includes('after') && !injected) {
        injected = true;
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    });

    const result = restoreFullBrowserBackup(inspected.data);
    setItem.mockRestore();

    expect(result.ok).toBe(false);
    expect(localStorage.getItem('weavestudio_marker')).toBe(JSON.stringify({ state: 'before' }));
    expect(localStorage.getItem('unrelated_key')).toBe('keep');
  });
});
