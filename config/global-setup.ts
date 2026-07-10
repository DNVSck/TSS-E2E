// config/global-setup.ts
import { FullConfig } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { initAllureResults, getAllureResultsDir } from '../src/core/report/allure-report-manager';
import { ensureAuthState } from '../src/core/auth/ensure-auth-state';
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

  // Sign in once per requested company profile and cache the session, so no test
  // signs in itself. Lives here rather than in a Playwright "setup project" so a
  // successful sign-in does not show up as a passing test in the report.
  await ensureAuthState();
}

export default globalSetup;
