import { TestInfo } from '@playwright/test';
import { ReportLog } from '../../core/report/ReportLog';

/**
 * Before accessibility test - setup common configuration
 */
export function beforeAccessibilityTest(): void {
  console.log('Setting up accessibility test environment...');
  
}

/**
 * After accessibility test - cleanup and reporting
 */
export function afterAccessibilityTest(testInfo: TestInfo): void {
  console.log('Cleaning up accessibility test environment...');
  
  // Add test result to report if needed
  if (testInfo.status === 'failed') {
    ReportLog.addAttachment(
      'test-failure-info.json', 
      JSON.stringify({
        title: testInfo.title,
        status: testInfo.status,
        error: testInfo.error?.message,
        duration: testInfo.duration
      }, null, 2),
      'application/json'
    );
  }
}
