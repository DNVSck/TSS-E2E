import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'path';
import { AllureReportManager } from '../core/report/AllureReportManager';
import { LOCALE } from './environment';

async function globalSetup(config: FullConfig) {
  // Show active projects based on LOCALE setting
  console.log(`LOCALE Setting: ${LOCALE}`);
  console.log(`Active Projects: ${config.projects.map(p => p.name).join(', ')}`);
  
  // Clean allure-results folder before starting tests
  const allureResultsPath = path.resolve('allure-results'); 
  
  console.log(`Checking for allure results at: ${allureResultsPath}`);
  
  try {
    if (fs.existsSync(allureResultsPath)) {
      console.log(`Found existing allure-results folder, removing...`);
      // Remove all files in allure-results folder
      fs.rmSync(allureResultsPath, { recursive: true, force: true });
      console.log('Cleaned reports/allure-results folder');
    } else {
      console.log(`No existing allure-results folder found`);
    }
    
    // Create fresh allure-results folder
    fs.mkdirSync(allureResultsPath, { recursive: true });
    console.log('Created fresh reports/allure-results folder');
    
    // Verify the folder is empty
    const files = fs.readdirSync(allureResultsPath);
    console.log(`Allure results folder is ${files.length === 0 ? 'empty' : `not empty (${files.length} files)`}`);
    
  } catch (error) {
    console.warn('Failed to clean allure-results:', error);
  }

  // Load environment-specific .env file
  const envFile = process.env.ENV ? `.env.${process.env.ENV}` : '.env';
  const envPath = path.resolve(process.cwd(), envFile);
  
  console.log(`Loading environment configuration from: ${envPath}`);
  dotenv.config({ path: envPath });

  // Initialize Allure Report Manager
  const reportManager = AllureReportManager.getInstance();
  console.log(`Allure Report Manager initialized`);
  console.log(`Report path: ${reportManager.getReportPath()}`);

  // Environment info will be added by ReportLog during first test execution
  console.log(`Environment info will be added during test execution`);

  // Optional: Setup global browser context or authentication
  console.log(`Global setup completed for environment: ${process.env.ENV || 'default'}`);
  
  return;
}

export default globalSetup;