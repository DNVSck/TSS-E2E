import { test as playwrightTest } from '@playwright/test';
import type { Page } from '@playwright/test';
import { attachment, step } from 'allure-js-commons';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Report Log - Logging wrapper with screenshot capabilities
 * Equivalent to ReportLog.java from ExtentReports
 */
export class ReportLog {
    private static screenshotCounter = 0;

    /**
     * Log information message
     */
    public static info(message: string): void {
        try {
            attachment('Info', Buffer.from(message), 'text/plain');
        } catch (error) {
            console.warn('Allure attachment failed:', error);
            playwrightTest.info().attachments.push({
                name: 'Info',
                body: Buffer.from(message),
                contentType: 'text/plain'
            });
        }
        console.log(`INFO: ${message}`);
    }

    /**
     * Log pass message
     */
    public static pass(message: string): void {
        try {
            attachment('Pass', Buffer.from(message), 'text/plain');
        } catch (error) {
            console.warn('Allure attachment failed:', error);
            playwrightTest.info().attachments.push({
                name: 'Pass',
                body: Buffer.from(message),
                contentType: 'text/plain'
            });
        }
        console.log(`PASS: ${message}`);
    }

    /**
     * Log failure message and attach screenshot
     */
    public static async fail(message: string, page?: Page): Promise<void> {
        const screenshotPath = await this.captureScreenshot(page);
        
        try {
            if (screenshotPath) {
                const screenshotBuffer = fs.readFileSync(screenshotPath);
                attachment('Failure Screenshot', screenshotBuffer, 'image/png');
            }
            
            attachment('Failure Details', Buffer.from(message), 'text/plain');
        } catch (error) {
            console.warn('Allure attachment failed:', error);

            const attachments = [{
                name: 'Failure Details',
                body: Buffer.from(message),
                contentType: 'text/plain'
            }];

            if (screenshotPath) {
                const screenshotBuffer = fs.readFileSync(screenshotPath);
                attachments.push({
                    name: 'Failure Screenshot',
                    body: screenshotBuffer,
                    contentType: 'image/png'
                });
            }

            playwrightTest.info().attachments.push(...attachments);
        }
        
        console.error(`FAIL: ${message}`);
    }

    /**
     * Log skip message
     */
    public static skip(message: string): void {
        try {
            attachment('Skip Reason', Buffer.from(message), 'text/plain');
        } catch (error) {
            playwrightTest.info().attachments.push({
                name: 'Skip Reason',
                body: Buffer.from(message),
                contentType: 'text/plain'
            });
        }
        console.log(`SKIP: ${message}`);
    }

    /**
     * Log warning message
     */
    public static warn(message: string): void {
        try {
            attachment('Warning', Buffer.from(message), 'text/plain');
        } catch (error) {
            playwrightTest.info().attachments.push({
                name: 'Warning',
                body: Buffer.from(message),
                contentType: 'text/plain'
            });
        }
        console.warn(`WARN: ${message}`);
    }

    /**
     * Add custom attachment
     */
    public static addAttachment(name: string, content: string | Buffer, type: string): void {
        try {
            attachment(name, typeof content === 'string' ? Buffer.from(content) : content, type);
        } catch (error) {
            playwrightTest.info().attachments.push({
                name,
                body: typeof content === 'string' ? Buffer.from(content) : content,
                contentType: type
            });
        }
    }

    /**
     * Add video attachment that displays properly in Allure report
     */
    public static addVideoAttachment(name: string, videoPath: string): void {
        try {
            // Use Playwright's built-in video attachment for proper Allure integration
            playwrightTest.info().attachments.push({
                name,
                path: videoPath,
                contentType: 'video/webm'
            });
            console.log(`Video attached for Allure display: ${videoPath}`);
        } catch (error) {
            console.warn('Failed to attach video for Allure display:', error);
            
            // Fallback: attach as buffer
            try {
                const fs = require('fs');
                if (fs.existsSync(videoPath)) {
                    const videoBuffer = fs.readFileSync(videoPath);
                    attachment(name, videoBuffer, 'video/webm');
                }
            } catch (fallbackError) {
                console.warn('Video fallback attachment also failed:', fallbackError);
            }
        }
    }

    /**
     * Capture screenshot to file
     */
    public static async captureScreenshot(page?: Page, name?: string): Promise<string | null> {
        if (!page) return null;

        try {
            this.screenshotCounter++;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotName = name || `screenshot-${this.screenshotCounter}-${timestamp}`;
            const screenshotPath = path.join('test-results', 'screenshots', `${screenshotName}.png`);

            if (!fs.existsSync(path.dirname(screenshotPath))) {
                fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
            }

            await page.screenshot({ path: screenshotPath, fullPage: true });

            return screenshotPath;
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            return null;
        }
    }

    /**
     * Attach screenshot to report
     */
    public static async attachScreenshot(page: Page, name = 'Screenshot'): Promise<void> {
        try {
            const screenshotBuffer = await page.screenshot({ fullPage: true });

            try {
                attachment(name, screenshotBuffer, 'image/png');
            } catch (error) {
                playwrightTest.info().attachments.push({
                    name,
                    body: screenshotBuffer,
                    contentType: 'image/png'
                });
            }
        } catch (error) {
            console.error('Failed to attach screenshot:', error);
        }
    }

    /**
     * Wrap a step with logging & error handling
     */
    public static async step<T>(
        stepName: string,
        stepFunction: () => Promise<T> | T,
        page?: Page,
        takeScreenshotOnFailure = true
    ): Promise<T> {
        try {
            return await step(stepName, async () => {
                try {
                    const result = await stepFunction();
                    this.pass(`Step completed: ${stepName}`);
                    return result;
                } catch (error) {
                    if (takeScreenshotOnFailure && page) {
                        await this.attachScreenshot(page, `Failed Step: ${stepName}`);
                    }
                    await this.fail(`Step failed: ${stepName} - ${error}`);
                    throw error;
                }
            });
        } catch (error) {
            console.warn(`Allure step failed → fallback to Playwright step:`, error);
            return await playwrightTest.step(stepName, async () => {
                try {
                    const result = await stepFunction();
                    this.pass(`Step completed: ${stepName}`);
                    return result;
                } catch (err) {
                    if (takeScreenshotOnFailure && page) {
                        await this.attachScreenshot(page, `Failed Step: ${stepName}`);
                    }
                    await this.fail(`Step failed: ${stepName} - ${err}`, page);
                    throw err;
                }
            });
        }
    }

    /**
     * Add environment info
     */
    public static addEnvironmentInfo(): void {
        const envInfo = {
            Environment: process.env.ENV || 'default',
            'Base URL': process.env.BASE_URL || 'N/A',
            Browser: process.env.BROWSER || 'chromium',
            'Test User': process.env.USER_NAME || 'N/A',
            'Execution Date': new Date().toLocaleDateString(),
            'Execution Time': new Date().toLocaleTimeString(),
        };

        const envContent = Object.entries(envInfo)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n');

        try {
            attachment('Environment Information', Buffer.from(envContent), 'text/plain');
        } catch (error) {
            playwrightTest.info().attachments.push({
                name: 'Environment Information',
                body: Buffer.from(envContent),
                contentType: 'text/plain'
            });
        }
    }

    /**
     * Add test data
     */
    public static addTestData(data: any, name = 'Test Data'): void {
        const content =
            typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);

        try {
            attachment(name, Buffer.from(content), 'application/json');
        } catch (error) {
            playwrightTest.info().attachments.push({
                name,
                body: Buffer.from(content),
                contentType: 'application/json'
            });
        }
    }

    /**
     * Add console logs
     */
    public static addConsoleLogs(logs: string[]): void {
        if (!logs.length) return;

        const content = logs.join('\n');

        try {
            attachment('Browser Console Logs', Buffer.from(content), 'text/plain');
        } catch (error) {
            playwrightTest.info().attachments.push({
                name: 'Browser Console Logs',
                body: Buffer.from(content),
                contentType: 'text/plain'
            });
        }
    }
}
