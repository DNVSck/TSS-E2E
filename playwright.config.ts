import { defineConfig } from '@playwright/test';
import { bootstrapEnv } from './config/bootstrap-env';

bootstrapEnv();
const LOCALE = process.env.LOCALE ?? 'all';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './config/global-setup.ts', /* Global setup to clean allure-results before tests */
  globalTeardown: './config/global-teardown.ts', /* Global teardown to generate Allure report after tests */
  fullyParallel: true, /* Run tests in files in parallel */
  forbidOnly: !!process.env.CI, /* Fail the build on CI if you accidentally left test.only in the source code. */
  retries: process.env.CI ? 2 : Number(process.env.RETRY_COUNT ?? 0), /* Retry strategy - number of retries */

  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  timeout: Number(process.env.TEST_BASE_TIMEOUT ?? 30000),
  expect: {
    timeout: Number(process.env.TEST_BASE_TIMEOUT ?? 5000),
  },
  reporter: [
    ['allure-playwright', {
      suiteTitle: true
    }],
    ['line'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: process.env.BASE_URL,
    headless: process.env.HEADLESS === 'true',
    launchOptions: {
      args: ['--start-maximized'],
      slowMo: Number(process.env.SLOW_MO ?? 0),
    },
    /* Screenshots and traces for failure debugging */
    actionTimeout: Number(process.env.DEFAULT_TIMEOUT ?? 5000),
    navigationTimeout: Number(process.env.PAGE_TIMEOUT ?? 10000),
    screenshot: 'only-on-failure',
    video: { mode: 'on', size: { width: 1920, height: 1080 } },
    trace: 'retain-on-failure',
    viewport: null,
  },

  /* Projects must be static. Selection is done via CLI. */
  projects: [
    { name: 'chromium-en', use: { browserName: 'chromium' as const } },
    { name: 'chromium-cy', use: { browserName: 'chromium' as const } },
  ],
});
