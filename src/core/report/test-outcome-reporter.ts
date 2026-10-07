import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

export default class TestOutcomeReporter implements Reporter {

    onTestEnd(test: TestCase, result: TestResult): void {
        switch (result.status) {
            case 'passed':
                console.log(`Test passed: ${test.title}`);
                break;

            case 'failed': {
                const message =
                    result.error?.message ?? 'Test failed without error message';

                console.error(`Test failed: ${test.title} - ${message}`);
                break;
            }

            case 'timedOut':
                console.error(`Test timed out after ${test.timeout}ms: ${test.title}`);
                break;

            case 'skipped':
                console.log(`Test skipped: ${test.title}`);
                break;

            default:
                console.warn(`Test finished with status ${result.status}: ${test.title}`);
                break;
        }
    }
}
