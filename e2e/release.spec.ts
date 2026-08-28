import { expect, test } from '@playwright/test';

test('landing page renders without browser console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open guided demo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start with a template' })).toBeVisible();
  expect(errors).toEqual([]);
});

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

test('guided-demo reset asks before replacing a non-demo workspace', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The desktop toolbar control is covered here; mobile exposes the same action in the responsive toolbar.');
  await page.goto('/app');
  await page.getByRole('button', { name: 'Guided demo', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Open guided demo?' });
  await expect(confirm).toBeVisible();
  await expect(confirm.getByText(/replace the current workspace/i)).toBeVisible();
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirm).toBeHidden();
  await page.getByRole('button', { name: 'Guided demo', exact: true }).click();
  await confirm.getByRole('button', { name: /open guided demo/i }).click();
  await expect(page.getByRole('heading', { name: 'Source material' })).toBeVisible();
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
  const blocked = page.getByRole('dialog', { name: /workflow validator/i });
  await expect(blocked).toBeVisible();
  await expect(blocked.getByText(/missing input node/i)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(blocked).toBeHidden();
  await expect(generate).toBeFocused();
});

test('data-clear confirmation closes with Escape without clearing data', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop toolbar dialog coverage; mobile uses the same data portability flow in a sheet.');
  await page.goto('/app');
  await page.getByRole('button', { name: 'Data portability' }).click();
  const portability = page.getByRole('dialog', { name: 'Data portability' });
  await portability.getByRole('button', { name: /clear all local data/i }).click();
  const confirmation = page.getByRole('alertdialog', { name: /clear all local data/i });
  await expect(confirmation).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(confirmation).toBeHidden();
  await expect(portability).toBeVisible();
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

test('acquisition page shows the public offer and preserves the inquiry CTA', async ({ page }) => {
  await page.goto('/acquire');
  await expect(page.getByText('WeaveStudio is offered as a one-time source-code and seller-owned-IP acquisition for $6,500. Request the acquisition brief, verified buyer package details, and transfer checklist.')).toBeVisible();
  await expect(page.getByText(/Pricing is discussed privately/i)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /email davidelsey9513@gmail.com/i })).toHaveAttribute('href', 'mailto:davidelsey9513@gmail.com?subject=WeaveStudio%20acquisition%20inquiry');
});

test('acquisition page provides an accessible recorded workflow walkthrough', async ({ page }) => {
  await page.goto('/acquire');
  const walkthrough = page.getByRole('region', { name: /recorded workflow walkthrough/i });
  await expect(walkthrough).toBeVisible();
  await expect(walkthrough.getByRole('button', { name: /play guided demo walkthrough/i })).toBeVisible();
  await expect(walkthrough.getByText(/no account, API key, or live provider call is used/i)).toBeVisible();
  const video = walkthrough.getByLabel(/guided demo walkthrough/i);
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate((element) => element.duration)).toBeGreaterThanOrEqual(25);
});

test('keyboard undo and redo restore a canvas mutation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Shortcut labels and canvas controls are desktop-first.');
  await page.goto('/app');
  const undo = page.getByRole('button', { name: 'Undo' });
  const redo = page.getByRole('button', { name: 'Redo' });
  await page.getByLabel('Add Input node', { exact: true }).click();
  await expect(undo).toBeEnabled();
  await page.keyboard.press('Control+z');
  await expect(redo).toBeEnabled();
  await page.keyboard.press('Control+Shift+z');
  await expect(undo).toBeEnabled();
});

test('canvas navigation controls are reachable without changing text-field shortcuts', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Minimap is intentionally hidden on compact viewports.');
  await page.goto('/app');
  await expect(page.getByLabel('Workflow minimap')).toBeVisible();
  await expect(page.locator('.react-flow__minimap')).toHaveCSS('background-color', 'rgb(15, 23, 42)');
  await page.getByLabel('Add Input node', { exact: true }).click();
  await page.getByRole('button', { name: 'Auto-layout workflow' }).click();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  const title = page.getByLabel('Title').last();
  await title.fill('Native undo stays available');
  await title.press('Control+z');
  await expect(title).not.toHaveValue('');
});

test('corrupt project import reports an error without leaving the recovery flow', async ({ page }) => {
  await page.goto('/app');
  await page.getByRole('button', { name: 'Data portability' }).click();
  const portability = page.getByRole('dialog', { name: 'Data portability' });
  await portability.locator('input[type=file]').nth(0).setInputFiles({ name: 'corrupt.weavestudio.json', mimeType: 'application/json', buffer: Buffer.from('{not valid json') });
  await expect(page.getByRole('dialog', { name: /import project as a new workspace/i })).toBeVisible();
  await page.getByRole('button', { name: 'Import new workspace' }).click();
  await expect(portability.getByText(/failed to parse import file/i)).toBeVisible();
});

test('source text selection can be captured as a provenance fragment', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop covers precise textarea selection authoring.');
  await page.goto('/');
  await page.getByTestId('open-guided-demo').click();
  const source = page.getByLabel('Source material');
  await source.evaluate((element: HTMLTextAreaElement) => {
    element.focus();
    element.setSelectionRange(0, Math.min(24, element.value.length));
    element.dispatchEvent(new Event('select', { bubbles: true }));
  });

  const addFragment = page.getByRole('button', { name: 'Add source fragment' });
  await expect(addFragment).toBeEnabled();
  await addFragment.click();
  await expect(page.getByRole('status').filter({ hasText: /source fragment added for provenance/i })).toBeVisible();
});

test('output preview supports explicit claim-to-source provenance review', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop covers the full provenance annotation and inspection flow.');
  await page.goto('/');
  await page.getByTestId('open-guided-demo').click();

  const source = page.getByLabel('Source material');
  await source.evaluate((element: HTMLTextAreaElement) => {
    element.focus();
    element.setSelectionRange(0, Math.min(32, element.value.length));
    element.dispatchEvent(new Event('select', { bubbles: true }));
  });
  await page.getByRole('button', { name: 'Add source fragment' }).click();

  await page.getByRole('button', { name: /workflow outline/i }).click();
  let outline = page.getByRole('region', { name: /workflow outline/i });
  await outline.getByRole('button', { name: /proposed approach/i }).click();
  await page.getByLabel('Content').fill('A traceable pilot recommendation based on the selected source evidence.');

  await page.getByRole('button', { name: /workflow outline/i }).click();
  outline = page.getByRole('region', { name: /workflow outline/i });
  await outline.getByRole('button', { name: /assumption check/i }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();

  await page.getByRole('button', { name: 'Validate' }).click();
  const validator = page.getByRole('dialog', { name: 'Workflow Validator' });
  await expect(validator.getByText('Ready', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Close Workflow Validator' }).click();

  await page.getByRole('button', { name: 'Generate' }).click();
  const preview = page.getByRole('dialog', { name: 'Output preview' });
  await preview.getByRole('button', { name: 'Provenance' }).click();
  await expect(preview.getByText('Workspace lineage only — this does not verify the truth or authenticity of the source.')).toBeVisible();
  await expect(preview.getByRole('heading', { name: 'Annotate a claim' })).toBeVisible();

  const candidate = preview.getByLabel('Claim candidate');
  await candidate.selectOption({ index: 1 });
  await preview.getByRole('checkbox', { name: /source fragment/i }).first().check();
  await preview.getByLabel('Derivation').selectOption('direct');
  await preview.getByRole('button', { name: 'Save provenance' }).click();

  await expect(preview.getByText('Valid', { exact: true }).first()).toBeVisible();
  await expect(preview.getByText(/source range/i).first()).toBeVisible();
});
