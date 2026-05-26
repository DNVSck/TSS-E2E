import { test } from '@playwright/test';
import { PortalPage } from '../page-object/portal-page'
import { BasePage } from '../page-object/base-page';
import { SignInPage } from '../page-object/sign-in-page';
import { InitialFormDeclaraPage } from '../page-object/initial-form-declare-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { GoodsMovementTaskListPage } from '../page-object/goods-movement-task-list-page';
import { MovementOverviewPage } from '../page-object/movement-overview-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { GoodsDeclarePage } from '../page-object/goods-declare-page';
import { LocaleFixtureType } from './locale-fixture';
import { ConsignmentOverviewPage } from '../page-object/consignment-overview-page';
import { GoodsOverviewPage } from '../page-object/goods-overview-page';


export type PageFixtureType = {
    basePage: BasePage;
    portalPage: PortalPage;
    signInPage: SignInPage;
    initialFormDeclaraPage: InitialFormDeclaraPage;
    movementDeclarePage: MovementDeclarePage;
    goodsMovementTaskListPage: GoodsMovementTaskListPage;
    movementOverviewPage: MovementOverviewPage;
    consignmentDeclarePage: ConsignmentDeclarePage;
    goodsItemDeclarePage: GoodsDeclarePage;
    consignmentOverviewPage: ConsignmentOverviewPage;
    goodsOverviewPage: GoodsOverviewPage;
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

    movementDeclarePage: async ({ page }, use) => {
        await use(new MovementDeclarePage(page));
    },

    goodsMovementTaskListPage: async ({ page }, use) => {
        await use(new GoodsMovementTaskListPage(page));
    },

    movementOverviewPage: async ({ page, t }, use) => {
        await use(new MovementOverviewPage(page, t));
    },

    consignmentDeclarePage: async ({ page }, use) => {
        await use(new ConsignmentDeclarePage(page));
    },

    consignmentOverviewPage: async ({ page }, use) => {
        await use(new ConsignmentOverviewPage(page));
    },

    goodsItemDeclarePage: async ({ page }, use) => {
        await use(new GoodsDeclarePage(page));
    },

    goodsOverviewPage: async ({ page }, use) => {
        await use(new GoodsOverviewPage(page));
    }
};