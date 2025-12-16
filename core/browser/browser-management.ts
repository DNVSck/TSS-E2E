import { Browser, BrowserContext } from '@playwright/test';

export class BrowserManagement {
    static browser: Browser;
    static browserContext: BrowserContext;

    static initializeBrowser(
        browser: Browser,
        browserContext: BrowserContext
    ): typeof BrowserManagement {
        BrowserManagement.browser = browser;
        BrowserManagement.browserContext = browserContext;
        return this;
    }

    static setCurrentContext(browserContext: BrowserContext): void {
        BrowserManagement.browserContext = browserContext;
    }
}
