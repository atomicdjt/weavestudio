import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', video: process.env.RECORD_WALKTHROUGH ? 'on' : 'retain-on-failure' },
  webServer: { command: 'npm run build && npm run preview -- --host 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop', testIgnore: /a11y\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testIgnore: /a11y\.spec\.ts/, use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'a11y', testMatch: /a11y\.spec\.ts/, dependencies: ['desktop', 'mobile'], use: { ...devices['Desktop Chrome'] } },
  ],
});
