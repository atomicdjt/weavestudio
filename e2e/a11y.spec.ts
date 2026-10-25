import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const scanDialog = async (page: Page) => {
  const results = await new AxeBuilder({ page }).include('[role="dialog"], [role="alertdialog"]').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([]);
};

test('@a11y public routes have no automatically detectable serious violations', async ({ page }) => {
  for (const route of ['/', '/app', '/templates', '/docs', '/acquire', '/not-a-route']) {
    await page.goto(route);
    await page.locator('#main-content').waitFor({ state: 'visible' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? '')).map((item) => ({ id: item.id, nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) })), route).toEqual([]);
  }
});

test('@a11y workspace dialogs and mobile sheets pass automated checks', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/app');
  for (const name of ['Validate', 'Workflow outline', 'Data portability', 'Start guided tour']) {
    await page.getByRole('button', { name, exact: true }).click();
    await scanDialog(page);
    await page.keyboard.press('Escape');
  }
  await page.getByRole('button', { name: 'Data portability', exact: true }).click();
  await page.getByRole('button', { name: /clear all local data/i }).click();
  await scanDialog(page);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Add AI Assist node' }).click();
  if (page.viewportSize()!.width < 700) {
    await page.getByRole('button', { name: 'Open inspector' }).click();
    await scanDialog(page);
  }
  await page.getByRole('button', { name: /run live provider/i }).click();
  await scanDialog(page);
  await page.keyboard.press('Escape');
  if (page.viewportSize()!.width < 700) {
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open snapshots' }).click();
    await scanDialog(page);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await scanDialog(page);
  }
});

test('@a11y output preview editing provenance and regeneration dialogs', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.getByTestId('open-guided-demo').click();
  await page.getByRole('button', { name: /workflow outline/i }).click();
  await page.getByRole('region', { name: /workflow outline/i }).getByRole('button', { name: /proposed approach/i }).click();
  if (page.viewportSize()!.width < 700) await page.getByRole('button', { name: 'Open inspector' }).click();
  await page.getByLabel('Content', { exact: true }).last().fill('A documented pilot recommendation.');
  if (page.viewportSize()!.width < 700) await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /workflow outline/i }).click();
  await page.getByRole('region', { name: /workflow outline/i }).getByRole('button', { name: /assumption check/i }).click();
  if (page.viewportSize()!.width < 700) await page.getByRole('button', { name: 'Open inspector' }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).last().click();
  if (page.viewportSize()!.width < 700) await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await scanDialog(page);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Editable deliverable markdown').fill('# Edited\n\nFinal draft.');
  await scanDialog(page);
  await page.getByRole('button', { name: 'Provenance', exact: true }).click();
  await scanDialog(page);
  await page.getByRole('button', { name: 'Rendered', exact: true }).click();
  await page.getByTestId('regenerate-deliverable').click();
  await scanDialog(page);
});
