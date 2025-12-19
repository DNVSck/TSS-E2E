import { attachment, label, description, parameter, link } from 'allure-js-commons';
import { TestInfo } from '@playwright/test';

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

    private static addMetadata(testInfo: TestInfo): void {
        parameter('Environment', process.env.ENV ?? 'default');
        parameter('Base URL', process.env.BASE_URL ?? 'N/A');
        parameter(
            'Browser',
            testInfo.project.use?.browserName ?? process.env.BROWSER ?? 'unknown'
        );
        parameter('Project', testInfo.project.name);
    }

    public static addParameter(name: string, value: string): void {
        parameter(name, value);
    }

    public static addTestLabel(name: string, value: string): void {
        label(name, value);
    }

    public static addTestLink(
        url: string,
        name?: string,
        type?: 'issue' | 'tms'
    ): void {
        name ? link(url, name, type) : link(url);
    }
}
