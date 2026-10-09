// config/global-setup.ts
import { FullConfig } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  initAllureResults, getAllureResultsDir, writeSetupFailures, SetupFailure,
} from '../src/core/report/allure-report-manager';
import { ensureAuthState, SignInFailedError, SIGN_IN_FAILURE_ATTACHMENT } from '../src/auth/ensure-auth-state';
import { LOCALE } from './environment';

async function globalSetup(config: FullConfig) {

  // Log effective configuration
  console.log(`LOCALE: ${LOCALE}`);
  console.log(
    `Active Projects: ${config.projects.map(p => p.name).join(', ')}`
  );

  // Clean allure-results BEFORE writing the metadata files into it, unless this
  // run adds to the results of the one before it on the same agent.
  const allureResultsPath = path.resolve('allure-results');
  if (fs.existsSync(allureResultsPath) && process.env.KEEP_ALLURE_RESULTS !== 'true') {
    fs.rmSync(allureResultsPath, { recursive: true, force: true });
  }

  initAllureResults();
  console.log(`Allure results at: ${getAllureResultsDir()}`);

  // Sign in one account per worker (per requested profile) and cache each
  // session, so no test signs in itself. Passing the resolved worker count lets
  // it skip logging in accounts no worker will use. Lives here rather than in a
  // Playwright "setup project" so a successful sign-in does not show up as a
  // passing test in the report.
  try {
    await ensureAuthState(config.workers);
  } catch (error) {
    writeSetupFailures(asSetupFailures(error));
    throw error;
  }
}

function asSetupFailures(error: unknown): SetupFailure[] {
  if (error instanceof SignInFailedError) {
    return error.failures.map(failure => ({
      name: `Sign in ${failure.account}`,
      suite: 'Authentication',
      message: failure.message,
      stack: failure.stack,
      screenshot: failure.screenshot
        ? { name: SIGN_IN_FAILURE_ATTACHMENT, body: failure.screenshot }
        : undefined,
    }));
  }

  return [{
    name: 'Sign in the accounts this run needs',
    suite: 'Authentication',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack ?? '' : '',
  }];
}

export default globalSetup;
