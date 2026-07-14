import { expect, test } from '@playwright/test';

test('guided demo walkthrough', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('open-guided-demo').click();
  await expect(page.getByRole('heading', { name: 'Source material' })).toBeVisible();
  await page.getByRole('button', { name: 'Validate' }).click();
  await expect(page.getByRole('heading', { name: 'Workflow Validator' })).toBeVisible();
  await page.getByRole('button', { name: 'Close Workflow Validator' }).click();
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('dialog', { name: 'Output preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Close output preview' }).click();
  await page.getByRole('button', { name: 'Data portability' }).click();
  await expect(page.getByRole('dialog', { name: 'Data portability' })).toBeVisible();
});
