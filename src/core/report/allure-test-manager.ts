import { label, description, parameter } from 'allure-js-commons';
import { TestInfo } from '@playwright/test';

/**
 * Test-lifecycle metadata, driven from the auto fixture in report-fixture.ts.
 *
 * Allure only - what a run prints to the terminal is TestOutcomeReporter's job.
 *
 * Failures (message, stack, screenshot, video, trace) are NOT recorded here:
 * allure-playwright already records them from the Playwright result. Attaching
 * them again produces duplicate entries for a single failure.
 *
 * The test body should not call this class — it talks to ReportLog instead.
 */
export class AllureTestManager {

    public static recordTestStart(testInfo: TestInfo): void {
        this.createParentTest(testInfo);
        this.addParameter('Expected Status', testInfo.expectedStatus);
    }

    public static async recordTestOutcome(testInfo: TestInfo): Promise<void> {
        if (testInfo.status !== 'passed') {
            this.addParameter(
                'Failures recorded at teardown', String(testInfo.errors.length)
            );
        }

        const summary = this.failureSummary(testInfo.errors);
        if (summary) {
            await description(summary);
        }

        if (testInfo.status === 'skipped') {
            this.addParameter('Skip Reason', testInfo.error?.message ?? 'Test skipped');
        }
    }

    private static failureSummary(errors: readonly { message?: string }[]): string {
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
    }

    public static createParentTest(testInfo: TestInfo): void {
        try {
            label('testName', testInfo.title);
            description(`Test: ${testInfo.title} | File: ${testInfo.file}`);
            this.addMetadata(testInfo);
        } catch {
            /* ignore allure failures */
        }
    }


    private static addMetadata(testInfo: TestInfo): void {
        parameter('Environment', process.env.ENV ?? 'default');
        parameter('Base URL', process.env.BASE_URL ?? 'N/A');
        parameter('Browser', testInfo.project.use?.browserName ?? 'unknown');
    }

    public static addParameter(name: string, value: string): void {
        parameter(name, value);
    }
}
