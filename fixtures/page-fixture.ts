import {test} from '@playwright/test';
import { PortalPage } from '../page-object/portal-page'
import { BasePage } from '../page-object/base-page';
import { SignInPage } from '../page-object/sign-in-page';


export type PageFixtureType = {
    basePage: BasePage;
    portalPage: PortalPage;
    signInPage: SignInPage;
}

type ExtendParams = Parameters<typeof test.extend<PageFixtureType>>;

export const pageFixture: ExtendParams[0] = {
    basePage: async ({}, use) => {
        await use(new BasePage());
    },

    portalPage: async ({}, use) => {
        await use(new PortalPage());
    },

    signInPage: async ({}, use) => {
        await use(new SignInPage());
    },
};