import { test } from '@playwright/test';
import { PortalPage } from '../page-object/portal-page'
import { BasePage } from '../page-object/base-page';
import { SignInPage } from '../page-object/sign-in-page';
import { InitialFormDeclaraPage } from '../page-object/initial-form-declare-page';
import { NewGoodsMovementDeclarePage } from '../page-object/new-goods-movement-declare-page';
import { GoodsMovementTaskListPage } from '../page-object/goods-movement-task-list-page';
import { DeclarationOverviewPage } from '../page-object/declaration-overview-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { LocaleFixtureType } from './locale-fixture';


export type PageFixtureType = {
    basePage: BasePage;
    portalPage: PortalPage;
    signInPage: SignInPage;
    initialFormDeclaraPage: InitialFormDeclaraPage;
    newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage;
    goodsMovementTaskListPage: GoodsMovementTaskListPage;
    declarationOverviewPage: DeclarationOverviewPage;
    consignmentDeclarePage: ConsignmentDeclarePage;

}

type ExtendParams = Parameters<typeof test.extend<PageFixtureType & LocaleFixtureType>>;

export const pageFixture: ExtendParams[0] = {
    basePage: async ({ page }, use) => {
        await use(new BasePage(page));
    },

    portalPage: async ({ page }, use) => {
        await use(new PortalPage(page));
    },

    signInPage: async ({ page }, use) => {
        await use(new SignInPage(page));
    },

    initialFormDeclaraPage: async ({ page }, use) => {
        await use(new InitialFormDeclaraPage(page));
    },

    newGoodsMovementDeclarePage: async ({ page }, use) => {
        await use(new NewGoodsMovementDeclarePage(page));
    },

    goodsMovementTaskListPage: async ({ page }, use) => {
        await use(new GoodsMovementTaskListPage(page));
    },

    declarationOverviewPage: async ({ page, t }, use) => {
        await use(new DeclarationOverviewPage(page, t));
    },

    consignmentDeclarePage: async ({ page }, use) => {
        await use(new ConsignmentDeclarePage(page));
    }

};