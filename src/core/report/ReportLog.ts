import { type Page } from '@playwright/test';
import { attachment, epic, feature, step, story, tags } from 'allure-js-commons';


export class ReportLog {
    private static currentPage?: Page;

    public static setCurrentPage(page?: Page): void {
        this.currentPage = page;
    }

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

    public static addAttachment(
        name: string,
        content: string | Buffer,
        type: string
    ): void {
        attachment(name, content, type);
    }

    public static async setEpic(name: string): Promise<void> {
        await epic(name);
    }

    public static async setFeature(name: string): Promise<void> {
        await feature(name);
    }

    public static async setStory(name: string): Promise<void> {
        await story(name);
    }

    public static async setTags(...tagList: string[]): Promise<void> {
        await tags(...tagList);
    }


    public static async step<T>(
        name: string,
        fn: () => Promise<T> | T,
        page?: Page
    ): Promise<T> {
        return step(name, async () => {
            try {
                const result = await fn();
                return result;
            } catch (err) {
                await this.fail(`Step failed: ${name}`, page ?? this.currentPage);
                throw err;
            }
        });
    }

    public static async attachScreenshot(page: Page): Promise<void> {
        try {
            const buffer = await page.screenshot({ fullPage: true });
            attachment('Screenshot', buffer, 'image/png');
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            attachment('Screenshot Capture Error', message, 'text/plain');
        }
    }
}
