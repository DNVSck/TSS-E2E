// config/global-setup.ts
import { FullConfig } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { initAllureResults, getAllureResultsDir } from '../src/core/report/allure-report-manager';
import { ensureAuthState } from '../src/auth/ensure-auth-state';
import { LOCALE } from './environment';

async function globalSetup(config: FullConfig) {

  // Log effective configuration
  console.log(`LOCALE: ${LOCALE}`);
  console.log(
    `Active Projects: ${config.projects.map(p => p.name).join(', ')}`
  );

  // Clean allure-results BEFORE writing the metadata files into it.
  const allureResultsPath = path.resolve('allure-results');
  if (fs.existsSync(allureResultsPath)) {
    fs.rmSync(allureResultsPath, { recursive: true, force: true });
  }

  initAllureResults();
  console.log(`Allure results at: ${getAllureResultsDir()}`);

  // Sign in one account per worker (per requested profile) and cache each
  // session, so no test signs in itself. Passing the resolved worker count lets
  // it skip logging in accounts no worker will use. Lives here rather than in a
  // Playwright "setup project" so a successful sign-in does not show up as a
  // passing test in the report.
  await ensureAuthState(config.workers);
}

export default globalSetup;
