import { BASE_URL } from '../config/environment';
import { AllureTestManager } from '../core/report/AllureTestManager';
import { ReportLog } from '../core/report/ReportLog';
import { testMain as test } from '../fixtures/main-fixture';
import { expect } from '@playwright/test';

// Re-export test for consumers
export { test, expect };

// Base URL helper
export const getBaseUrl = (): string => BASE_URL;

/**
 * Before each test
 * - Initialise Allure metadata
 * - Log test start
 */
test.beforeEach(async ({ }, testInfo) => {
    ReportLog.info(`Starting test: ${testInfo.title}`);

    AllureTestManager.createParentTest(testInfo);

    AllureTestManager.addParameter('Test File', testInfo.file);
    AllureTestManager.addParameter('Project', testInfo.project.name);
    AllureTestManager.addParameter('Expected Status', testInfo.expectedStatus);
});

/**
 * After each test
 * - Log result
 * - Attach screenshot on failure
 * - Update Allure metadata
 */
test.afterEach(async ({ page }, testInfo) => {
    switch (testInfo.status) {
        case 'passed':
            ReportLog.pass(`Test passed: ${testInfo.title}`);
            break;

        case 'failed': {
            const message =
                testInfo.error?.message ?? 'Test failed without error message';

            await ReportLog.attachScreenshot(page);
            await ReportLog.fail(
                `Test failed: ${testInfo.title} - ${message}`,
                page
            );
            break;
        }

        case 'timedOut':
            await ReportLog.attachScreenshot(page);
            ReportLog.fail(
                `Test timed out after ${testInfo.timeout}ms`,
                page
            );
            break;

        case 'skipped':
            AllureTestManager.addParameter(
                'Skip Reason',
                testInfo.error?.message ?? 'Test skipped'
            );
            ReportLog.info(`Test skipped: ${testInfo.title}`);
            break;

        default:
            ReportLog.warn(`Test finished with status: ${testInfo.status}`);
            break;
    }

    AllureTestManager.addParameter('Duration', `${testInfo.duration}ms`);
    AllureTestManager.addParameter(
        'Final Status',
        testInfo.status ?? 'unknown'
    );

    if (testInfo.annotations?.length) {
        AllureTestManager.addParameter(
            'Annotations',
            JSON.stringify(testInfo.annotations)
        );
    }

    AllureTestManager.updateTestReport(testInfo);
});
