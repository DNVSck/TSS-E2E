import { attachment, step, label, description, parameter, link } from 'allure-js-commons';
import { TestInfo } from '@playwright/test';

export class AllureTestManager {
    private static currentTestInfo: TestInfo | null = null;
    private static currentTestName: string = '';

    /**
     * Create parent test (equivalent to ExtentTest parent)
     */
    public static createParentTest(testName: string, desc?: string): void {
        this.currentTestName = testName;

        try {
            // Use label instead of deprecated displayName
            label('testName', testName);

            if (desc) {
                description(desc);
            }

            this.addTestMetadata();
        } catch (error) {
            console.warn('Allure setup failed:', error);
        }
    }

    /**
     * Create test step/node
     */
    public static async createTestStep<T>(stepName: string, stepFunction: () => Promise<T> | T): Promise<T> {
        try {
            return await step(stepName, stepFunction);
        } catch (error) {
            console.warn('Allure step failed:', error);
            // Fallback to just executing the function
            return await stepFunction();
        }
    }

    public static setCurrentTestInfo(testInfo: TestInfo): void {
        this.currentTestInfo = testInfo;
    }

    public static getCurrentTestInfo(): TestInfo | null {
        return this.currentTestInfo;
    }

    /**
     * Update test report after test execution
     */
    public static updateTestReport(testInfo: TestInfo): void {
        const { status, error } = testInfo;

        try {
            switch (status) {
                case 'failed':
                    if (error) {
                        attachment('Error Details', error.message ?? 'Unknown error', 'text/plain');
                        attachment('Stack Trace', error.stack ?? 'No stack trace', 'text/plain');
                    }
                    break;

                case 'timedOut':
                    attachment(
                        'Timeout Details',
                        `Test timed out after ${testInfo.timeout}ms`,
                        'text/plain'
                    );
                    break;

                case 'skipped':
                    attachment(
                        'Skip Reason',
                        error?.message ?? 'Test was skipped',
                        'text/plain'
                    );
                    break;

                default:
                    attachment(
                        'Test Status',
                        `Test finished with status: ${status}`,
                        'text/plain'
                    );
                    break;
            }
        } catch (allureError) {
            console.warn('Allure attachment failed:', allureError);
        }
    }

    /**
     * Add metadata
     */
    private static addTestMetadata(): void {
        try {
            parameter('Environment', process.env.ENV ?? 'default');
            parameter('Base URL', process.env.BASE_URL ?? 'N/A');
            parameter('Browser', process.env.BROWSER ?? 'chromium');

            parameter('Execution Time', new Date().toISOString());
            parameter('Test ID', this.generateTestId());
        } catch (error) {
            console.warn('Allure parameter failed:', error);
        }
    }

    private static generateTestId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${timestamp}-${random}`;
    }

    public static addParameter(name: string, value: string): void {
        try {
            parameter(name, value);
        } catch (error) {
            console.warn('Allure parameter failed:', error);
        }
    }

    public static addTestLink(url: string, name?: string, type?: 'issue' | 'tms'): void {
        try {
            
            if (type && name) {
                link(url, name, type);
            } else if (name) {
                link(url, name);
            } else {
                link(url);
            }
        } catch (error) {
            console.warn('Allure link failed:', error);
        }
    }

    public static addTestLabel(name: string, value: string): void {
        try {
            label(name, value);
        } catch (error) {
            console.warn('Allure label failed:', error);
        }
    }

    public static async startStep<T>(stepName: string, stepFunction: () => Promise<T> | T): Promise<T> {
        try {
            return await step(stepName, stepFunction);
        } catch (error) {
            console.warn('Allure step failed:', error);
            return await stepFunction();
        }
    }

    public static cleanup(): void {
        this.currentTestInfo = null;
        this.currentTestName = '';
    }
}
