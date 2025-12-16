import { test } from '@playwright/test';
import { BrowserManagement } from '../browser/browser-management';

export type BrowserFixtureType = {
    browserManagement: typeof BrowserManagement;
};

type ExtendParams = Parameters<typeof test.extend<BrowserFixtureType>>;

export const browserFixture: ExtendParams[0] = {
    browserManagement: [
        async ({ browser, context }, use) => {
            const browserManagement =
                BrowserManagement.initializeBrowser(browser, context);
            await use(browserManagement);
        },
        { scope: 'test', auto: true }
    ]
};
