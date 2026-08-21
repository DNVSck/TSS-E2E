import { test, type Page } from '@playwright/test';
import { BasePage } from '../page-object/base-page';
import { PortalPage } from '../page-object/portal-page';
import { SignInPage } from '../page-object/sign-in-page';
import { SignInFlow } from '../flows/sign-in-flow';

export type SecondDeviceFixtureType = {
    secondDevicePage: Page;
    secondDeviceBasePage: BasePage;
    secondDevicePortalPage: PortalPage;
    secondDeviceSignInPage: SignInPage;
    secondDeviceSignInFlow: SignInFlow;
};

type ExtendParams = Parameters<typeof test.extend<SecondDeviceFixtureType>>;

export const secondDeviceFixture: ExtendParams[0] = {
    secondDevicePage: async ({ browser }, use) => {
        const context = await browser.newContext({
            storageState: { cookies: [], origins: [] },
        });
        const page = await context.newPage();
        await use(page);
        await context.close();
    },

    secondDeviceBasePage: async ({ secondDevicePage }, use) => {
        await use(new BasePage(secondDevicePage));
    },

    secondDevicePortalPage: async ({ secondDevicePage }, use) => {
        await use(new PortalPage(secondDevicePage));
    },

    secondDeviceSignInPage: async ({ secondDevicePage }, use) => {
        await use(new SignInPage(secondDevicePage));
    },

    secondDeviceSignInFlow: async ({
        secondDeviceBasePage,
        secondDevicePortalPage,
        secondDeviceSignInPage,
    }, use) => {
        await use(new SignInFlow(
            secondDeviceBasePage,
            secondDevicePortalPage,
            secondDeviceSignInPage
        ));
    },
};
