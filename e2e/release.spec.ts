import { expect, test } from '@playwright/test';

test('guided demo and invalid routes recover in the rendered app', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('open-guided-demo').click();
  await expect(page.getByRole('heading', { name: 'Source material' })).toBeVisible();
  await expect(page.getByTestId('workflow-canvas')).toBeAttached();
  if (page.viewportSize()?.width && page.viewportSize()!.width < 700) {
    await page.getByRole('button', { name: 'Open inspector' }).click();
    await expect(page.getByRole('dialog', { name: 'Inspector' })).toBeVisible();
    await page.getByRole('button', { name: 'Close inspector' }).click();
    await page.getByRole('button', { name: 'Open snapshots' }).click();
    await expect(page.getByRole('dialog', { name: 'Snapshots' })).toBeVisible();
  }
  await page.goto('/not-a-route');
  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
});

test('AI provider request stays behind explicit consent', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Consent interaction is covered in desktop; the mobile project is a layout smoke test.');
  let requests = 0;
  await page.route(/api\.openai\.com|generativelanguage\.googleapis\.com/, async (route) => { requests += 1; await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: 'draft' } }] }) }); });
  await page.goto('/app');
  await page.getByRole('button', { name: 'Add AI Assist node' }).click();
  await page.getByLabel('API key (memory only)').fill('test-key');
  await page.getByRole('button', { name: /run live provider/i }).click();
  await expect(page.getByRole('dialog', { name: /confirm external ai request/i })).toBeVisible();
  expect(requests).toBe(0);
  await page.getByRole('button', { name: 'Cancel' }).last().click();
  expect(requests).toBe(0);
});
