import { 
    Locator, 
    Page, 
    PageScreenshotOptions
} from '@playwright/test';

import { PlaywrightUtils } from '../util/playwright-utils';
import {BrowserManagement} from '../browser/browser-management';

export class PageUtils{
    static page(): Page {
        return BrowserManagement.page;
    }

    static async goto(url: string, options?: {
        timeout?: number;
        waitUntil?: 'networkidle' | 'load' | 'domcontentloaded' | 'commit';
    }) {
        await PageUtils.page().goto(url, options);
    }

    static async goBack(options?: {
        timeout?: number;
        waitUntil?: 'networkidle' | 'load' | 'domcontentloaded' | 'commit';
    }) {
        await PageUtils.page().goBack(options);
    }

    static async getTitle(): Promise<string> {
        console.log('Getting page\'s title');
        return await PageUtils.page().title();
    }

    static async waitForPageLoad(loadState?: 'networkidle' | 'load' | 'domcontentloaded', options?: {
        timeout?: number;
    }): Promise<PageUtils> {
        await PageUtils.page().waitForLoadState(loadState, options);
        return this;
    }

    static async waitForElement(locator: Locator, options?: {
        state?: 'attached' | 'detached' | 'visible' | 'hidden';
        timeout?: number;
    }): Promise<void> {

        PageUtils.page().waitForSelector
        await locator.waitFor(options);
    }


    static async captureScreenshot(options?: PageScreenshotOptions): Promise<Buffer> {
        return await PageUtils.page().screenshot(options);
    }


    static async reload(options?: {
        timeout?: number;
        waitUntil?: 'networkidle' | 'load' | 'domcontentloaded' | 'commit';
    }): Promise<void> {
        await PageUtils.page().reload(options);
    }


}