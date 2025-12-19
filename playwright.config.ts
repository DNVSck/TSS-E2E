import { defineConfig, devices } from '@playwright/test';

const LOCALE = process.env.LOCALE ?? 'all';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Global setup to clean allure-results before tests */
  globalSetup: './config/global-setup.ts',
  /* Global teardown to generate Allure report after tests */
  globalTeardown: './config/global-teardown.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry strategy - number of retries */
  retries: process.env.CI ? 2 : 1,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['allure-playwright', {
      suiteTitle: true
    }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.BASE_URL,

    /* Screenshots and traces for failure debugging */
    screenshot: 'only-on-failure',
    video: { mode: 'on', size: { width: 640, height: 480 } },
    trace: 'retain-on-failure',

    viewport: null,
  },

  /* Projects must be static. Selection is done via CLI. */
  projects: [
    { name: 'chromium-en', use: { browserName: 'chromium' as const } },
    { name: 'chromium-cy', use: { browserName: 'chromium' as const } },
  ],
});
