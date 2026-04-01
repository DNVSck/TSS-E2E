import { test } from '@playwright/test';
import { PortalPage } from '../page-object/portal-page'
import { BasePage } from '../page-object/base-page';
import { SignInPage } from '../page-object/sign-in-page';
import { MovementHeaderDeclarePage } from '../page-object/initial-form-declare-page';
import {NewGoodsMovementDeclarePage} from '../page-object/new-goods-movement-declare-page';
import { GoodsMovementTaskListPage } from '../page-object/goods-movement-task-list-page';


export type PageFixtureType = {
    basePage: BasePage;
    portalPage: PortalPage;
    signInPage: SignInPage;
    movementHeaderDeclarePage: MovementHeaderDeclarePage;
    newGoodsMovementDeclarePage: NewGoodsMovementDeclarePage;
    goodsMovementTaskListPage: GoodsMovementTaskListPage;
}

type ExtendParams = Parameters<typeof test.extend<PageFixtureType>>;

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

    movementHeaderDeclarePage: async ({ page }, use) => {
        await use(new MovementHeaderDeclarePage(page));
    },

    newGoodsMovementDeclarePage: async ({ page }, use) => {
        await use(new NewGoodsMovementDeclarePage(page));
    },

    goodsMovementTaskListPage: async ({ page }, use) => {
        await use(new GoodsMovementTaskListPage(page));
    }
    
};