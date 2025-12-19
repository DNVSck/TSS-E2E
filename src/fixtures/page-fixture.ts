import { test as base, Page } from '@playwright/test';
import { PortalPage } from '../page-object/portal-page'
import { BasePage } from '../page-object/base-page';
import { SignInPage } from '../page-object/sign-in-page';
import { RouteDeclarePage } from '../page-object/route-declare-page';


export type PageFixtureType = {
    basePage: BasePage;
    portalPage: PortalPage;
    signInPage: SignInPage;
    routeDeclarePage: RouteDeclarePage;
};

export const pageFixture = {
    basePage: async ({ page }: { page: Page }, use: (p: BasePage) => Promise<void>) => {
        await use(new BasePage(page));
    },

    portalPage: async ({ page }: { page: Page }, use: (p: PortalPage) => Promise<void>) => {
        await use(new PortalPage(page));
    },

    signInPage: async ({ page }: { page: Page }, use: (p: SignInPage) => Promise<void>) => {
        await use(new SignInPage(page));
    },

    routeDeclarePage: async ({ page }: { page: Page }, use: (p: RouteDeclarePage) => Promise<void>) => {
        await use(new RouteDeclarePage(page));
    },
};
