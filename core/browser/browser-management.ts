import { 
    BrowserContext, 
    Browser,
    Page
} from '@playwright/test';

export class BrowserManagement{
    static browser: Browser;
    static browserContext: BrowserContext;
    static page: Page;

    static initializeBrowser(browser: Browser, browserContext: BrowserContext, page: Page): typeof BrowserManagement {
        BrowserManagement.browser = browser;
        BrowserManagement.browserContext = browserContext;
        BrowserManagement.page = page;
        return this;
    }

    static setCurrentContext(browserContext: BrowserContext): void {
        BrowserManagement.browserContext = browserContext;
    }

    static setCurrentPage(page: Page): void {
        BrowserManagement.page = page;
    }
}