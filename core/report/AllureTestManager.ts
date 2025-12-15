import { attachment, label, description, parameter, link } from 'allure-js-commons';
import { TestInfo } from '@playwright/test';

export class AllureTestManager {
    private static currentTestInfo: TestInfo | null = null;

    public static setCurrentTestInfo(testInfo: TestInfo): void {
        this.currentTestInfo = testInfo;
    }

    public static createParentTest(name: string, desc?: string): void {
        try {
            label('testName', name);
            if (desc) description(desc);
            this.addMetadata();
        } catch {
            /* ignore allure failures */
        }
    }

    public static updateTestReport(testInfo: TestInfo): void {
        const { status, error } = testInfo;

        try {
            if (status === 'failed' && error) {
                attachment('Error', error.message ?? '', 'text/plain');
                attachment('Stack Trace', error.stack ?? '', 'text/plain');
            }
        } catch {
            /* ignore allure failures */
        }
    }

    private static addMetadata(): void {
        parameter('Environment', process.env.ENV ?? 'default');
        parameter('Base URL', process.env.BASE_URL ?? 'N/A');
        parameter('Browser', process.env.BROWSER ?? 'chromium');
    }

    public static addParameter(name: string, value: string): void {
        parameter(name, value);
    }

    public static addTestLabel(name: string, value: string): void {
        label(name, value);
    }

    public static addTestLink(url: string, name?: string, type?: 'issue' | 'tms'): void {
        name ? link(url, name, type) : link(url);
    }

    public static cleanup(): void {
        this.currentTestInfo = null;
    }
}
