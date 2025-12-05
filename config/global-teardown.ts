import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { AllureReportManager } from '../core/report/AllureReportManager';

async function globalTeardown(config: FullConfig) {
  // Handle allure report generation
  const allureResultsPath = path.resolve('allure-results');
  const testResultsPath = path.resolve('test-results');
  
  // Always generate Allure report if results exist
  if (fs.existsSync(allureResultsPath)) {
    try {
      const { execSync } = require('child_process');
      
      // Generate Allure report directly to test-results
      execSync(`npx allure generate ${allureResultsPath} -o ${testResultsPath} --clean`, { 
        stdio: 'inherit' 
      });
      
      // Copy index.html as result.html in test-results folder
      const indexPath = path.join(testResultsPath, 'index.html');
      const resultPath = path.join(testResultsPath, 'result.html');
      
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, resultPath);
        // Remove index.html to keep only result.html
        fs.unlinkSync(indexPath);
      }
      
    } catch (error) {
      console.warn('Allure report generation failed:', String(error));
      
      // Fallback: Just log what we have
      AllureReportManager.generateReport();
    }
  } else {
    // No allure-results found, skipping report generation
  }
  
  return;
}

export default globalTeardown;