import { defineConfig } from '@playwright/test';
import { bootstrapEnv } from './config/bootstrap-env';

bootstrapEnv();
const LOCALE = process.env.LOCALE ?? 'all';

/**
 * Central Playwright timeout configuration.
 */
const TEST_TIMEOUT = 300_000; // Maximum duration of one test: 5 minutes
const EXPECT_TIMEOUT = 30_000; // Maximum wait for Playwright assertions: 30 seconds
const ACTION_TIMEOUT = 15_000; // Maximum wait for actions such as click/fill: 15 seconds
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
  /*
   * One retry on CI, not two.
   *
   * `retain-on-failure` keeps a trace for EVERY failed attempt, so each retry multiplies
   * what the run publishes: the nightly of 2026-08-31 produced 48 traces weighing 529 MB
   * for roughly 16 failing tests - three attempts each, of which the first two were never
   * read. Dropping to one retry removes a third of that, and a third of the wall-clock
   * spent re-running tests that were going to fail anyway.
   *
   * What it costs: a test that is genuinely flaky one run in three now reports red more
   * often. That is the intended direction - this suite has known flakiness (the commodity
   * autocomplete, TOTP windows) and a third attempt hid it rather than fixing it.
   */
  retries: process.env.CI ? 1 : Number(process.env.RETRY_COUNT ?? 0),

  workers: resolveWorkers(),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  timeout: TEST_TIMEOUT,

  expect: {
    timeout: EXPECT_TIMEOUT,
  },
  reporter: [
    ['allure-playwright', { suiteTitle: true }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['html', { outputFolder: 'playwright-report' }],
    ['line'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: process.env.BASE_URL,
    headless: HEADLESS,
    launchOptions: {
      args: ['--start-maximized'],
      slowMo: Number(process.env.SLOW_MO ?? 0),
    },
    /* Screenshots and traces for failure debugging */
    actionTimeout: ACTION_TIMEOUT,
    navigationTimeout: NAVIGATION_TIMEOUT,
    screenshot: 'only-on-failure',
    /*
     * Video locally, none on CI.
     *
     * On CI the video is the one artifact that adds no information: the trace below
     * replays the same failure with the DOM, the network log and the console attached,
     * and `screenshot` above already keeps the final frame. It is not free - 124 MB
     * across 46 failures on the nightly of 2026-08-31, roughly three times what the
     * traces themselves weigh once the filmstrip is off - and that weight is what makes
     * the published artifact too heavy to download.
     *
     * Locally it stays on. There is no artifact to download, nothing to slow down, and
     * a video is the quickest way to watch a headless run that behaved unlike the headed
     * one you were debugging.
     */
    video: {
      mode: process.env.CI ? 'off' : 'retain-on-failure',
      size: RECORDING_SIZE,
    },
    /*
     * DOM snapshots, but no filmstrip.
     *
     * Three settings sound alike and are not. `screenshot` above writes a standalone PNG
     * of the failure - kept, and it costs almost nothing (2 MB across 46 failures on the
     * nightly of 2026-08-31). `snapshots` records the DOM and CSS around every action,
     * which the trace viewer RENDERS as the real page: hover it, inspect elements, see
     * the locator highlighted. `screenshots` adds the thumbnail strip along the top for
     * scrubbing - and that strip was the bulk of 529 MB across 48 traces.
     *
     * So what is lost is the scrubbing, not the ability to see the failing page.
     *
     * The one thing a DOM snapshot cannot reproduce is anything not expressible as
     * HTML - canvas contents, a cross-origin iframe. This service is GOV.UK forms, so
     * that has not come up; if it ever does, turn the strip back on for that run.
     */
    trace: {
      mode: 'retain-on-failure',
      snapshots: true,
      screenshots: false,
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
