import { expect, test } from '@playwright/test';

test('guided demo walkthrough', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The recorded artifact is intentionally framed for desktop review.');
  await page.goto('/');
  await page.getByTestId('open-guided-demo').click();
  await expect(page.getByRole('heading', { name: 'Source material' })).toBeVisible();

  await page.getByRole('button', { name: 'Validate' }).click();
  const firstValidation = page.getByRole('dialog', { name: 'Workflow Validator' });
  await expect(firstValidation).toBeVisible();
  await expect(firstValidation.getByText('Human approval pending')).toBeVisible();
  await expect(firstValidation.getByText('Empty node content')).toBeVisible();
  await page.getByRole('button', { name: 'Close Workflow Validator' }).click();

  await page.getByRole('button', { name: /workflow outline/i }).click();
  let outline = page.getByRole('region', { name: /workflow outline/i });
  await outline.getByRole('button', { name: /proposed approach/i }).click();
  const proposedApproach = page.getByLabel('Content');
  await proposedApproach.fill(
    '1. Simple lead intake checklist\n2. Quote follow-up cadence\n3. One-page sales-to-ops handoff form\n4. 30-day pilot with office manager',
  );

  await page.getByRole('button', { name: /workflow outline/i }).click();
  outline = page.getByRole('region', { name: /workflow outline/i });
  await outline.getByRole('button', { name: /assumption check/i }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();

  await page.getByRole('button', { name: 'Validate' }).click();
  const readyValidation = page.getByRole('dialog', { name: 'Workflow Validator' });
  await expect(readyValidation.getByText('Ready', { exact: true }).first()).toBeVisible();
  await expect(readyValidation.getByText(/required review checkpoints are approved/i)).toBeVisible();
  await page.getByRole('button', { name: 'Close Workflow Validator' }).click();

  await page.getByRole('button', { name: /workflow outline/i }).click();
  outline = page.getByRole('region', { name: /workflow outline/i });
  await outline.getByRole('button', { name: /proposed approach/i }).click();
  await page.getByLabel('Content').fill(
    '1. Simple lead intake checklist\n2. Quote follow-up cadence\n3. One-page sales-to-ops handoff form\n4. 30-day pilot with office manager\n5. Confirm the revised handoff owner',
  );
  await page.getByRole('button', { name: 'Validate' }).click();
  const staleValidation = page.getByRole('dialog', { name: 'Workflow Validator' });
  await expect(staleValidation.getByText('Human approval pending')).toBeVisible();
  await page.getByRole('button', { name: 'Close Workflow Validator' }).click();

  await page.getByRole('button', { name: /workflow outline/i }).click();
  outline = page.getByRole('region', { name: /workflow outline/i });
  await outline.getByRole('button', { name: /assumption check/i }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByRole('button', { name: 'Validate' }).click();
  const revalidated = page.getByRole('dialog', { name: 'Workflow Validator' });
  await expect(revalidated.getByText('Ready', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Close Workflow Validator' }).click();

  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('dialog', { name: 'Output preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Close output preview' }).click();
  await page.getByRole('button', { name: 'Data portability' }).click();
  await expect(page.getByRole('dialog', { name: 'Data portability' })).toBeVisible();
});
