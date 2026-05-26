import { test } from '@playwright/test';
import { PortalAccessFlow } from '../flows/portal-access-flow';
import { InitialFormDeclarationFlow } from '../flows/initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../flows/movement-header-declaration-flow';
import { MovementOverviewFlow } from '../flows/movement-overview-flow';
import { PageFixtureType } from './page-fixture';
import { CreateAndSubmitEnsDeclarationFlow } from '../flows/common-flows/createAndSubmitDeclarationFlow';
import { AddNewConsignmentFlow } from '../flows/add-new-consignment-flow';
import { AddNewGoodsItemFlow } from '../flows/add-new-goods-item-flow';

export type FlowFixtureType = {
    // Business Flows
    portalAccessFlow: PortalAccessFlow;
    initialFormDeclarationFlow: InitialFormDeclarationFlow;
    movementHeaderDeclarationFlow: MovementHeaderDeclarationFlow;
    movementOverviewFlow: MovementOverviewFlow;
    addNewConsignmentFlow: AddNewConsignmentFlow;
    addNewGoodsItemFlow: AddNewGoodsItemFlow;

    // Common Flows
    createAndSubmitEnsDeclarationFlow: CreateAndSubmitEnsDeclarationFlow;
}

type ExtendParams = Parameters<typeof test.extend<FlowFixtureType & PageFixtureType>>;

export const flowFixture: ExtendParams[0] = {
    portalAccessFlow: async ({ basePage, portalPage, signInPage }, use) => {
        await use(new PortalAccessFlow(basePage, portalPage, signInPage));
    },

    initialFormDeclarationFlow: async ({ initialFormDeclaraPage }, use) => {
        await use(new InitialFormDeclarationFlow(initialFormDeclaraPage));
    },

    movementHeaderDeclarationFlow: async ({ goodsMovementTaskListPage, movementDeclarePage }, use) => {
        await use(new MovementHeaderDeclarationFlow(goodsMovementTaskListPage, movementDeclarePage));
    },

    movementOverviewFlow: async ({ movementOverviewPage }, use) => {
        await use(new MovementOverviewFlow(movementOverviewPage));
    },

    addNewConsignmentFlow: async ({ movementOverviewPage, consignmentDeclarePage, consignmentOverviewPage }, use) => {
        await use(new AddNewConsignmentFlow(movementOverviewPage, consignmentDeclarePage, consignmentOverviewPage));
    },

    addNewGoodsItemFlow: async ({ consignmentOverviewPage, goodsItemDeclarePage, goodsOverviewPage }, use) => {
        await use(new AddNewGoodsItemFlow(consignmentOverviewPage, goodsItemDeclarePage, goodsOverviewPage));
    },

    createAndSubmitEnsDeclarationFlow: async ({
        portalAccessFlow,
        initialFormDeclarationFlow,
        movementHeaderDeclarationFlow,
        movementOverviewFlow,
        addNewConsignmentFlow,
        addNewGoodsItemFlow
    }, use) => {
        await use(new CreateAndSubmitEnsDeclarationFlow(
            portalAccessFlow,
            initialFormDeclarationFlow,
            movementHeaderDeclarationFlow,
            movementOverviewFlow,
            addNewConsignmentFlow,
            addNewGoodsItemFlow
        ));
    },
};
