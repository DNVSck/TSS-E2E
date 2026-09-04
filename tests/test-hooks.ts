import { BASE_URL } from '../config/environment';
import { ReportLog } from '../src/core/report/report-log';
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
 * These hooks take NO parameters, and read the test through `test.info()`.
 *
 * That sidesteps a constraint worth knowing about. Playwright parses a hook's FIRST
 * parameter to work out which fixtures it needs, and rejects anything that is not an
 * object destructuring pattern - `(_, testInfo)` fails outright with "First argument
 * must use the object destructuring pattern". Which leaves two poor options: `({},
 * testInfo)`, an empty pattern that eslint and SonarQube (S3799) both flag, or naming a
 * fixture the hook never uses, which makes the signature state a dependency that is not
 * real.
 *
 * Declaring no parameters at all avoids the question. Playwright returns early before
 * it looks for a pattern, so there is nothing for either linter to object to, and the
 * hook claims nothing it does not use.
 */
test.beforeEach(() => {
    const testInfo = test.info();

    AllureTestManager.createParentTest(testInfo);
    AllureTestManager.addParameter('Test File', testInfo.file);
    AllureTestManager.addParameter('Expected Status', testInfo.expectedStatus);
});


const failureSummary = (errors: readonly { message?: string }[]): string => {
    const lines = errors
        .map(error => (error.message ?? '').split('\n')[0].trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return '';
    }

    return [
        `${lines.length} failure(s), in the order they were recorded:`,
        '',
        ...lines.map((line, index) => `${index + 1}. ${line}`),
    ].join('\n');
};

test.afterEach(async () => {
    const testInfo = test.info();

    if (testInfo.status !== 'passed') {
        ReportLog.setParameter(
            'Failures recorded at teardown', String(testInfo.errors.length)
        );
    }

    const summary = failureSummary(testInfo.errors);
    if (summary) {
        await ReportLog.setDescription(summary);
    }

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