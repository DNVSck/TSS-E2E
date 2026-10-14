import { test, type Page } from '@playwright/test';
import { BasePage } from '../page-object/base-page';
import { PortalPage } from '../page-object/portal-page';
import { SignInPage } from '../page-object/sign-in-page';
import { SignInFlow } from '../flows/sign-in-flow';
import { LocaleFixtureType, localeForProject } from './locale-fixture';
import { NavigationBanner } from '../page-object/components/navigation-banner';
import { ReportFixtureType } from './report-fixture';

export type SecondDeviceFixtureType = {
    secondDevicePage: Page;
    secondDeviceBasePage: BasePage;
    secondDevicePortalPage: PortalPage;
    secondDeviceSignInPage: SignInPage;
    secondDeviceNavigationBanner: NavigationBanner;
    secondDeviceSignInFlow: SignInFlow;
};

// LocaleFixtureType joins in so the second device's page objects can read the same
// translated labels as the first device's - the sign-in screen is located by them.
type ExtendParams = Parameters<
    typeof test.extend<SecondDeviceFixtureType & LocaleFixtureType & ReportFixtureType>
>;

export const secondDeviceFixture: ExtendParams[0] = {
    secondDevicePage: async ({ browser, serviceErrors }, use, testInfo) => {
        // Same rule as the other hand-built context: use.locale applies only to the one
        // the runner makes. Nothing this device reads is translated today - it asserts
        // on hrefs - but a second device browsing in a different language from the first
        // is a difference nobody would think to look for.
        const context = await browser.newContext({
            storageState: { cookies: [], origins: [] },
            locale: localeForProject(testInfo.project),
        });
        serviceErrors.watch(context, 'second device');
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

    secondDeviceSignInPage: async ({ secondDevicePage, t }, use) => {
        await use(new SignInPage(secondDevicePage, t));
    },

    secondDeviceNavigationBanner: async ({ secondDevicePage }, use) => {
        await use(new NavigationBanner(secondDevicePage));
    },

    secondDeviceSignInFlow: async ({
        secondDeviceBasePage,
        secondDevicePortalPage,
        secondDeviceSignInPage,
        secondDeviceNavigationBanner,
    }, use) => {
        await use(new SignInFlow(
            secondDeviceBasePage,
            secondDevicePortalPage,
            secondDeviceSignInPage,
            secondDeviceNavigationBanner
        ));
    },
};
