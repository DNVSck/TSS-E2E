import { BASE_URL } from '../config/environment';
import { AllureTestManager } from '../core/report/AllureTestManager';
import { ReportLog } from '../core/report/ReportLog';
import { expectMain as expect, testMain } from '../fixtures/main-fixture';

// Re-export test for consumers
export const test = testMain;

/**
 * Before each test
 * - Initialise Allure metadata
 * - Log test start
 * - Clear browser storage
 */
testMain.beforeEach(async ({ page }, testInfo) => {
    ReportLog.info(`Starting test: ${testInfo.title}`);

    AllureTestManager.setCurrentTestInfo(testInfo);

    AllureTestManager.createParentTest(
        testInfo.title,
        `Test: ${testInfo.title} | File: ${testInfo.file}`
    );

    AllureTestManager.addParameter('Test File', testInfo.file);
    AllureTestManager.addParameter('Project', testInfo.project.name);
    AllureTestManager.addParameter('Expected Status', testInfo.expectedStatus);

    ReportLog.info(`Test started: ${testInfo.title}`);

    await ReportLog.step('Clear Browser Storage', async () => {
        const url = page.url();
        if (!url || url === 'about:blank') {
            ReportLog.info('Page not loaded yet, skipping storage clear');
            return;
        }

        await page.evaluate(() => {
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch {
                // ignore
            }
        });
    }, page);
});

/**
 * After each test
 * - Log result
 * - Attach screenshots on failure
 * - Update Allure metadata
 */
testMain.afterEach(async ({ page }, testInfo) => {
    ReportLog.info(`Finishing test: ${testInfo.title}`);

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
    AllureTestManager.cleanup();
});

// Base URL helper
export const getBaseUrl = (): string => BASE_URL;

// Re-export expect
export { expect };
