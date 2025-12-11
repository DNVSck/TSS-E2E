import {test} from '@playwright/test';
import { BrowserManagement } from '../browser/browser-management';
import { BrowserUtils } from '../browser/browser-utils';

export type BrowserFixtureType = {
	browserManagement: BrowserManagement;
}

type ExtendParams = Parameters<typeof test.extend<BrowserFixtureType>>;

export const browserFixture: ExtendParams[0] = {
    browserManagement: [async ({ browser, context, page }, use) => {
        const browserManagement = BrowserManagement.initializeBrowser(browser, context, page)
        await use(browserManagement);
    }, {scope : 'test', auto: true}]
};
