import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  const allureResultsPath = path.resolve('allure-results');
  const testResultsPath = path.resolve('test-results');

  if (fs.existsSync(allureResultsPath)) {
    try {
      const { execSync } = require('child_process');

      execSync(
        `npx allure generate ${allureResultsPath} -o ${testResultsPath} --clean`,
        { stdio: 'inherit' }
      );

      const indexPath = path.join(testResultsPath, 'index.html');
      const resultPath = path.join(testResultsPath, 'result.html');

      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, resultPath);
        fs.unlinkSync(indexPath);
      }
    } catch (error) {
      console.warn('Allure report generation failed:', String(error));
    }
  }
}

export default globalTeardown;
