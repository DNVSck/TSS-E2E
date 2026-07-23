import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

async function globalTeardown(): Promise<void> {
  const allureResultsPath = path.resolve('allure-results');

  if (!fs.existsSync(allureResultsPath)) {
    return;
  }

  if (process.env.CI) {
    console.log(
      'CI detected: skipping Allure HTML generation. Raw allure-results will be published by the pipeline.',
    );
    return;
  }

  const allureReportPath = path.resolve('allure-report');

  try {
    execSync(
      `npx allure generate "${allureResultsPath}" -o "${allureReportPath}" --clean`,
      { stdio: 'inherit' },
    );
  } catch (error) {
    console.warn(
      'Allure report generation failed:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

export default globalTeardown;
