import { label, description, parameter } from 'allure-js-commons';
import { TestInfo } from '@playwright/test';

/**
 * Test-lifecycle metadata, driven from the hooks in tests/test-hooks.ts.
 *
 * Failures (message, stack, screenshot, video, trace) are NOT recorded here:
 * allure-playwright already records them from the Playwright result. Attaching
 * them again produces duplicate entries for a single failure.
 *
 * The test body should not call this class — it talks to ReportLog instead.
 */
export class AllureTestManager {

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
