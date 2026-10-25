import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { getPrimaryTemplates } from '../src/data/templates';
import type { WorkspaceDocument } from '../src/types';

const readyWorkspace = (template = getPrimaryTemplates()[0]): WorkspaceDocument => {
  const source = 'Verified fixture source for automated handoff testing.';
  return {
    schemaVersion: 1, id: 'qa-workspace', name: template.title, templateId: template.id,
    createdAt: '2026-10-12T00:00:00.000Z', updatedAt: '2026-10-12T00:00:00.000Z', sourceMaterial: source,
    nodes: template.nodes.map((node) => ({ ...node, data: { ...node.data, content: node.type === 'input' ? source : `Completed ${node.data.title}: representative fixture content.`, ...(node.type === 'review' ? { status: 'approved' as const } : {}) } })),
    edges: template.edges, meta: { sourceUserTouched: true, appliedSourceFingerprint: source, sourceSyncStatus: 'in_sync' },
  };
};

const seed = async (page: Page, workspace: WorkspaceDocument, snapshots: unknown[] = []) => {
  await page.addInitScript((doc) => {
    localStorage.setItem('weavestudio_v1_index', JSON.stringify({ schemaVersion: 1, activeWorkspaceId: doc.id, workspaces: [{ id: doc.id, name: doc.name, templateId: doc.templateId, updatedAt: doc.updatedAt }] }));
    localStorage.setItem(`weavestudio_v1_ws_${doc.id}`, JSON.stringify(doc));
  }, workspace);
  if (snapshots.length) {
    await page.addInitScript((items) => localStorage.setItem('weavestudio_v1_snapshots', JSON.stringify(items)), snapshots);
  }
  await page.goto('/app');
};

for (const template of getPrimaryTemplates()) test(`complete primary handoff: ${template.title}`, async ({ page }) => {
  await seed(page, readyWorkspace(template));
  await page.getByRole('button', { name: 'Validate', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Workflow Validator' }).getByText('Ready', { exact: true }).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  const output = page.getByRole('dialog', { name: 'Output preview' });
  await expect(output.getByText('Section incomplete', { exact: false })).toHaveCount(0);
  const mdPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: /^Markdown/ }).click();
  const md = await mdPromise;
  const markdown = readFileSync((await md.path())!, 'utf8');
  for (const section of template.outputStructure.requiredSections) expect(markdown).toContain(`## ${section.title}`);
  const jsonPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: /^Project JSON/ }).click();
  const project = JSON.parse(readFileSync((await (await jsonPromise).path())!, 'utf8'));
  expect(project.workspace.deliverableDraft.markdown).toBe(markdown);
  expect(project.workspace.nodes).toHaveLength(template.nodes.length);
});

test('remote Markdown images wait for opt-in and long PDF contains its final page', async ({ page }, testInfo) => {
  const workspace = readyWorkspace();
  workspace.deliverableDraft = { title: 'Privacy and PDF fixture', markdown: '# Image privacy\n\n![Remote figure](https://images.example.org/figure.png)', userEdited: true };
  let images = 0;
  await page.route('https://images.example.org/**', async (route) => { images++; await route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC9sAAAAASUVORK5CYII=', 'base64') }); });
  await seed(page, workspace);
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Load remote image' })).toBeVisible();
  expect(images).toBe(0);
  await page.getByRole('button', { name: 'Load remote image' }).click();
  await expect.poll(() => images).toBe(1);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const longText = '# Long PDF\n\n' + Array.from({ length: 170 }, (_, i) => `Line ${i}: ordered content preserved across page boundaries.`).join('\n') + '\nFINAL-EXPORT-SENTINEL';
  await page.getByLabel('Editable deliverable markdown').fill(longText);
  const pdfPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /^PDF report/ }).click();
  const pdf = await pdfPromise;
  await pdf.saveAs(testInfo.outputPath('long-reading-view.pdf'));
  const bytes = readFileSync((await pdf.path())!, 'latin1');
  expect(bytes).toContain('FINAL-EXPORT-SENTINEL');
  expect((bytes.match(/\/Type \/Page\b/g) || []).length).toBeGreaterThanOrEqual(4);
});

test('snapshot write failure preserves exact owned storage and shows recovery feedback', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop has the persistent snapshot panel.');
  await seed(page, readyWorkspace());
  // Wait for the initial React Flow layout and its debounced persistence to finish
  // before measuring the failed snapshot operation's storage invariance.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('weavestudio_workspace'))).not.toBeNull();
  await page.waitForTimeout(1_100);
  const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith('weavestudio_')).sort().map((key) => [key, localStorage.getItem(key)])));
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'weavestudio_v1_snapshots') throw new DOMException('Injected snapshot write failure', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.getByLabel('Snapshot name').fill('Recovery failure fixture');
  await page.getByRole('button', { name: 'Save Snapshot', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /quota|storage|snapshot|write/i })).toBeVisible();
  const after = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith('weavestudio_')).sort().map((key) => [key, localStorage.getItem(key)])));
  expect(after).toEqual(before);
});

test('switching workspaces immediately preserves edits inside the autosave delay', async ({ page }) => {
  const first = readyWorkspace();
  const second = { ...readyWorkspace(), id: 'workspace-b', name: 'Workspace B' };
  await page.addInitScript(({ a, b }: { a: WorkspaceDocument; b: WorkspaceDocument }) => {
    localStorage.setItem('weavestudio_v1_index', JSON.stringify({
      schemaVersion: 1,
      activeWorkspaceId: a.id,
      workspaces: [a, b].map(({ id, name, updatedAt, templateId }) => ({ id, name, updatedAt, templateId })),
    }));
    localStorage.setItem(`weavestudio_v1_ws_${a.id}`, JSON.stringify(a));
    localStorage.setItem(`weavestudio_v1_ws_${b.id}`, JSON.stringify(b));
  }, { a: first, b: second });
  await page.goto('/app');

  const name = page.getByLabel('Workspace name');
  await name.fill('Edited before the save timer');
  await page.locator('#workspace-select').selectOption(second.id);
  await expect(name).toHaveValue(second.name);
  await page.locator('#workspace-select').selectOption(first.id);

  await expect(name).toHaveValue('Edited before the save timer');
});

test('invalid snapshot restore leaves exact owned storage unchanged and reports the error', async ({ page }) => {
  const workspace = readyWorkspace();
  const snapshot = {
    id: 'invalid-nested-data', timestamp: Date.now(), title: 'Malformed snapshot', snapshotVersion: 2,
    workspaceId: workspace.id, sourceMaterial: workspace.sourceMaterial,
    nodes: [{ id: 'bad', type: 'transform', position: { x: 0, y: 0 }, data: { title: 'Bad', description: '', content: 123 } }],
    edges: [],
  };
  await seed(page, workspace, [snapshot]);
  await page.waitForTimeout(2_200);
  const snapshotsButton = page.getByRole('button', { name: /snapshots/i });
  if (await snapshotsButton.count()) await snapshotsButton.click();
  const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith('weavestudio_')).sort().map((key) => [key, localStorage.getItem(key)])));

  await page.getByRole('button', { name: 'Restore', exact: true }).click();

  await expect(page.getByRole('status').filter({ hasText: /invalid snapshot|snapshot graph is invalid/i })).toBeVisible();
  const after = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith('weavestudio_')).sort().map((key) => [key, localStorage.getItem(key)])));
  expect(after).toEqual(before);
});
