import { TestInfo } from '@playwright/test';
import { ReportLog } from '../../../src/core/report/ReportLog';
import { ENVIRONMENT_INFO } from '../../../config/environment';

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

  if (testInfo.attachments) {
    // attach screenshot automatically
    testInfo.attachments.push({
      name: 'failed-screenshot',
      path: testInfo.outputPath('screenshot.png'),
      contentType: 'image/png'
    });
  }
}
