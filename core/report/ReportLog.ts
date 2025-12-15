import { test as pwTest, type Page } from '@playwright/test';
import { attachment, step } from 'allure-js-commons';
import * as fs from 'fs';
import * as path from 'path';

export class ReportLog {
    public static info(message: string): void {
        attachment('Info', message, 'text/plain');
        console.log(message);
    }

    public static warn(message: string): void {
        attachment('Warning', message, 'text/plain');
        console.warn(message);
    }

    public static pass(message: string): void {
        attachment('Pass', message, 'text/plain');
        console.log(message);
    }

    public static async fail(message: string, page?: Page): Promise<void> {
        if (page) await this.attachScreenshot(page);
        attachment('Failure', message, 'text/plain');
        console.error(message);
    }

    public static async step<T>(
        name: string,
        fn: () => Promise<T> | T,
        page?: Page
    ): Promise<T> {
        return step(name, async () => {
            try {
                const result = await fn();
                this.pass(`Step passed: ${name}`);
                return result;
            } catch (err) {
                await this.fail(`Step failed: ${name}`, page);
                throw err;
            }
        });
    }

    public static async attachScreenshot(page: Page): Promise<void> {
        const buffer = await page.screenshot({ fullPage: true });
        attachment('Screenshot', buffer, 'image/png');
    }
}
