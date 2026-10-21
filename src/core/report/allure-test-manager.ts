import { label, description, parameter } from 'allure-js-commons';
import { TestInfo } from '@playwright/test';
import { ReportLog } from './report-log';

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

    public static async recordTestOutcome(testInfo: TestInfo, startedAt: Date): Promise<void> {
        await parameter('Ran', this.formatRun(startedAt, new Date()), { excluded: true });

        if (testInfo.status !== 'passed') {
            this.addParameter(
                'Failures recorded at teardown', String(testInfo.errors.length)
            );
        }

        const summary = this.failureSummary(testInfo.errors);
        if (summary && !ReportLog.hasOwnDescription(testInfo.testId)) {
            await description(summary);
        }

        if (testInfo.status === 'skipped') {
            this.addParameter('Skip Reason', testInfo.error?.message ?? 'Test skipped');
        }
    }

    private static formatRun(start: Date, end: Date): string {
        const time = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
        });
        const day = new Intl.DateTimeFormat('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric', timeZoneName: 'shortOffset',
        }).formatToParts(start);
        const part = (type: Intl.DateTimeFormatPartTypes) => day.find(p => p.type === type)?.value ?? '';

        return `${time.format(start)} -> ${time.format(end)} (${part('timeZoneName')}), `
            + `${part('day')}/${part('month')}/${part('year')}`;
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
        parameter('Environment', process.env.ENV ?? 'default', { excluded: true });
        parameter('Base URL', process.env.BASE_URL ?? 'N/A', { excluded: true });
        parameter('Browser', testInfo.project.use?.browserName ?? 'unknown', { excluded: true });
    }

    public static addParameter(name: string, value: string): void {
        parameter(name, value, { excluded: true });
    }
}
