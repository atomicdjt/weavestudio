import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('@a11y public routes have no automatically detectable serious violations', async ({ page }) => {
  for (const route of ['/', '/app', '/acquire']) {
    await page.goto(route);
    await page.locator('#main-content').waitFor({ state: 'visible' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([]);
  }
});
