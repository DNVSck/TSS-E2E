import { BASE_URL } from '../config/environment';
import { AllureTestManager } from '../src/core/report/allure-test-manager';
import { testMain as test } from '../src/fixtures/main-fixture';

export { testMain as test } from '../src/fixtures/main-fixture';
export { expect } from '@playwright/test';

// Base URL helper
export const getBaseUrl = (): string => BASE_URL;

/**
 * Before each test — record the Allure metadata.
 *
 * No "Starting test: <title>" log line: ReportLog renders a log as an Allure
 * step, which appears out of chronological order and only restates the title.
 *
 * The empty `{}` is required: Playwright parses this parameter to discover which
 * fixtures the hook needs, and rejects any name that is not a destructuring
 * pattern. Linters flag it as an empty pattern; it cannot be renamed.
 */
// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, testInfo) => {
    AllureTestManager.createParentTest(testInfo);

    // "Project" is not recorded here: allure-playwright already reports it, and
    // AllureTestManager.addMetadata covers the rest of the run's context.
    AllureTestManager.addParameter('Test File', testInfo.file);
    AllureTestManager.addParameter('Expected Status', testInfo.expectedStatus);
});


// eslint-disable-next-line no-empty-pattern
test.afterEach(({}, testInfo) => {
    switch (testInfo.status) {
        case 'passed':
            console.log(`Test passed: ${testInfo.title}`);
            break;

        case 'failed': {
            const message =
                testInfo.error?.message ?? 'Test failed without error message';

            console.error(`Test failed: ${testInfo.title} - ${message}`);
            break;
        }

        case 'timedOut':
            console.error(`Test timed out after ${testInfo.timeout}ms`);
            break;

        case 'skipped':
            AllureTestManager.addParameter(
                'Skip Reason',
                testInfo.error?.message ?? 'Test skipped'
            );
            console.log(`Test skipped: ${testInfo.title}`);
            break;

        default:
            console.warn(`Test finished with status: ${testInfo.status}`);
            break;
    }

});
