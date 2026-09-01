import { defineConfig } from '@playwright/test';
import { bootstrapEnv } from './config/bootstrap-env';

bootstrapEnv();
const LOCALE = process.env.LOCALE ?? 'all';


const TEST_TIMEOUT = 900_000; // Maximum duration of one test: 15 minutes
const EXPECT_TIMEOUT = 30_000; // Maximum wait for Playwright assertions: 30 seconds
const ACTION_TIMEOUT = 30_000; // Maximum wait for actions such as click/fill: 30 seconds
const NAVIGATION_TIMEOUT = 30_000; // Maximum wait for page navigation: 30 seconds

const HEADLESS = process.env.HEADLESS === 'true';

/**
 * One geometry for the recorded frame and for the page inside it, so the two
 * cannot drift apart.
 *
 * A headed run keeps `viewport: null`, which means "match the real browser
 * window" — and `--start-maximized` makes that the whole screen. Headless has no
 * window manager, so `--start-maximized` is a no-op and `viewport: null` leaves
 * Chromium at its small default: the page renders in GOV.UK's narrow layout, the
 * screenshot comes out mobile-shaped, and the video letterboxes that postage
 * stamp into a 1920x1080 frame. Hence an explicit viewport when headless.
 */
const RECORDING_SIZE = { width: 1920, height: 1080 };

/**
 * Worker count: an explicit WORKERS wins everywhere; otherwise CI runs serial
 * and local runs use Playwright's default (undefined). Keep WORKERS <= the
 * number of accounts in the profile's pool — two workers sharing a session fail.
 */
function resolveWorkers(): number | undefined {
  if (process.env.WORKERS) return Number(process.env.WORKERS);
  if (process.env.CI) return 1;
  return undefined;
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './config/global-setup.ts', /* Global setup to clean allure-results before tests */
  globalTeardown: './config/global-teardown.ts', /* Global teardown to generate Allure report after tests */
  fullyParallel: true, /* Run tests in files in parallel */
  forbidOnly: !!process.env.CI, /* Fail the build on CI if you accidentally left test.only in the source code. */
  retries: 0,

  workers: resolveWorkers(),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  timeout: TEST_TIMEOUT,

  expect: {
    timeout: EXPECT_TIMEOUT,
  },
  reporter: [
    ['allure-playwright', { suiteTitle: true }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: process.env.BASE_URL,
    headless: HEADLESS,
    launchOptions: {
      args: ['--start-maximized']
    },
    /* Screenshots and traces for failure debugging */
    actionTimeout: ACTION_TIMEOUT,
    navigationTimeout: NAVIGATION_TIMEOUT,
    screenshot: 'only-on-failure',
    video: {
      mode: 'retain-on-failure',
      size: RECORDING_SIZE,
    },
    trace: {
      mode: 'retain-on-failure',
      snapshots: true,
      screenshots: false,
      sources: false,
      attachments: false,
    },
    // Headed: null = fill the real (maximized) window. Headless: there is no window
    // to fill, so state the size explicitly - see RECORDING_SIZE.
    viewport: HEADLESS ? RECORDING_SIZE : null,
  },

  /* Projects must be static. Selection is done via CLI.
   *
   * Sign-in happens once in globalSetup, which caches the session to
   * playwright/.auth/<PROFILE>.json. storageState is applied per spec
   * (test.use), not here: the accessibility specs must run against an
   * anonymous, signed-out portal. */
  projects: [
    { name: 'chromium-en', use: { browserName: 'chromium' as const } },
    { name: 'chromium-cy', use: { browserName: 'chromium' as const } },
  ],
});
