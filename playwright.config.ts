import { defineConfig, devices } from '@playwright/test';
import { LOCALE } from './config/environment';

/**
 * Import centralized environment configuration
 * This will auto-load the environment based on ENV setting in config/environment.ts
 */
import './config/environment';

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
      //outputFolder: 'allure-results', // Allure raw results
      suiteTitle: true
    }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.BASE_URL,
    
    /* Screenshots and traces for failure debugging */
    screenshot: 'only-on-failure',  // Auto screenshot on failure
    video: { mode: 'on', size: { width: 640, height: 480 } }, // Always record video
    trace: 'retain-on-failure',     // Collect trace only when failed
    
    viewport: null, // Use browser's natural size
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-en',
      use: { ...devices['Desktop Chrome']},
    },
    {
      name: 'chromium-cy',
      use: { ...devices['Desktop Chrome']},
    },
  ].filter(project => LOCALE === 'all' || project.name.includes(LOCALE)),


});
