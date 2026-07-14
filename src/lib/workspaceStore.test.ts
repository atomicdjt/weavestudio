// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
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
});
