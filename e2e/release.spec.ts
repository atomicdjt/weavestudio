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
  let requests = 0;
  await page.route(/api\.openai\.com|generativelanguage\.googleapis\.com/, async (route) => { requests += 1; await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: 'draft' } }] }) }); });
  await page.goto('/app');
  await page.getByRole('button', { name: 'Add AI Assist node' }).click();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open inspector' }).click();
  const inspector = testInfo.project.name === 'mobile' ? page.getByRole('dialog', { name: 'Inspector' }) : page;
  await inspector.getByLabel('API key (memory only)').fill('test-key');
  await inspector.getByRole('button', { name: /run live provider/i }).click();
  await expect(page.getByRole('dialog', { name: /confirm external ai request/i })).toBeVisible();
  expect(requests).toBe(0);
  await page.getByRole('button', { name: 'Cancel' }).last().click();
  expect(requests).toBe(0);
});

test('AI consent preflight is visible without a key and dispatches exactly once after confirmation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The existing consent test covers the mobile inspector sheet.');
  let requests = 0;
  await page.route(/api\.openai\.com/, async (route) => { requests += 1; await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ output_text: 'Reviewed draft' }) }); });
  await page.goto('/app');
  await page.getByRole('button', { name: 'Add AI Assist node' }).click();
  const run = page.getByRole('button', { name: /run live provider/i });
  await run.click();
  const consent = page.getByRole('dialog', { name: /confirm external ai request/i });
  await expect(consent).toBeVisible();
  await expect(consent.getByText(/enter an api key to enable sending/i)).toBeVisible();
  await expect(consent.getByRole('button', { name: /confirm and send/i })).toBeDisabled();
  expect(requests).toBe(0);
  await consent.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByLabel('API key (memory only)').fill('test-key');
  await run.click();
  await consent.getByRole('button', { name: /confirm and send/i }).click();
  await expect(page.getByText('Reviewed draft')).toBeVisible();
  expect(requests).toBe(1);
});

test('workspace dialogs close with Escape and return focus to their trigger', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop toolbar dialog coverage; mobile sheets are covered separately.');
  await page.goto('/app');
  const validate = page.getByRole('button', { name: /validate/i });
  await validate.click();
  await expect(page.getByRole('dialog', { name: /workflow validator/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /workflow validator/i })).toBeHidden();
  await expect(validate).toBeFocused();

  const generate = page.getByRole('button', { name: /generate/i });
  await generate.click();
  await expect(page.getByRole('dialog', { name: /output preview/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /output preview/i })).toBeHidden();
  await expect(generate).toBeFocused();
});

test('workflow outline exposes a linear, selectable node flow', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('open-guided-demo').click();
  await page.getByRole('button', { name: /workflow outline/i }).click();
  const outline = page.getByRole('region', { name: /workflow outline/i });
  await expect(outline).toBeVisible();
  await expect(outline.getByRole('listitem').first()).toBeVisible();
  await outline.getByRole('button').first().click();
  await expect(outline).toBeHidden();
  await expect(page.getByRole('button', { name: /workflow outline/i })).toBeFocused();
});

test('mobile navigation, guided tour, and acquisition inquiry remain reachable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only layout coverage');
  await page.goto('/');
  await page.getByRole('button', { name: /open navigation/i }).click();
  await page.getByRole('dialog', { name: 'Navigation' }).getByRole('link', { name: 'Acquire' }).click();
  await expect(page.getByRole('link', { name: /email davidelsey9513@gmail.com/i })).toHaveAttribute('href', 'mailto:davidelsey9513@gmail.com?subject=WeaveStudio%20acquisition%20inquiry');
  await page.goto('/app');
  await page.getByRole('button', { name: /start guided tour/i }).click();
  await expect(page.getByRole('dialog', { name: /weavestudio quick tour/i })).toBeVisible();
});
