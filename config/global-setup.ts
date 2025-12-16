// config/global-setup.ts
import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import path from 'path';
import { AllureReportManager } from '../src/core/report/AllureReportManager';
import { bootstrapEnv } from './bootstrap-env';
import { LOCALE } from './environment';

async function globalSetup(config: FullConfig) {
  // Load envs ONCE
  bootstrapEnv();

  // Log effective configuration
  console.log(`LOCALE: ${LOCALE}`);
  console.log(
    `Active Projects: ${config.projects.map(p => p.name).join(', ')}`
  );

  // Clean allure-results
  const allureResultsPath = path.resolve('allure-results');
  if (fs.existsSync(allureResultsPath)) {
    fs.rmSync(allureResultsPath, { recursive: true, force: true });
  }
  fs.mkdirSync(allureResultsPath, { recursive: true });

  // Init Allure
  const reportManager = AllureReportManager.getInstance();
  console.log(`Allure initialized at: ${reportManager.getReportPath()}`);



}

export default globalSetup;
