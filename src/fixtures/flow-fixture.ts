import { test } from '@playwright/test';
import { PortalAccessFlow } from '../flows/portal-access-flow';
import { InitialFormDeclarationFlow } from '../flows/initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../flows/movement-header-declaration-flow';
import { MovementOverviewFlow } from '../flows/movement-overview-flow';
import { PageFixtureType } from './page-fixture';
import { CreateAndSubmitEnsDeclarationFlow } from '../flows/common-flows/createAndSubmitDeclarationFlow';
import { AddNewConsignmentFlow } from '../flows/add-new-consignment-flow';
import { AddNewGoodsItemFlow } from '../flows/add-new-goods-item-flow';
import { AddNewGMRFlow } from '../flows/add-new-gmr-flow';

export type FlowFixtureType = {
    // Business Flows
    portalAccessFlow: PortalAccessFlow;
    initialFormDeclarationFlow: InitialFormDeclarationFlow;
    movementHeaderDeclarationFlow: MovementHeaderDeclarationFlow;
    movementOverviewFlow: MovementOverviewFlow;
    addNewConsignmentFlow: AddNewConsignmentFlow;
    addNewGoodsItemFlow: AddNewGoodsItemFlow;
    createAndSubmitGmrFlow: AddNewGMRFlow; // This flow is added here as it relies on multiple other flows, and it will be used in multiple places, so it makes sense to have it as a common flow

    // Common Flows
    createAndSubmitEnsDeclarationFlow: CreateAndSubmitEnsDeclarationFlow;
}

type ExtendParams = Parameters<typeof test.extend<FlowFixtureType & PageFixtureType>>;

export const flowFixture: ExtendParams[0] = {
    portalAccessFlow: async ({ basePage, portalPage }, use) => {
        await use(new PortalAccessFlow(basePage, portalPage));
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

    addNewConsignmentFlow: async ({ movementOverviewPage, consignmentDeclarePage }, use) => {
        await use(new AddNewConsignmentFlow(movementOverviewPage, consignmentDeclarePage));
    },

    addNewGoodsItemFlow: async ({ consignmentOverviewPage, goodsItemDeclarePage }, use) => {
        await use(new AddNewGoodsItemFlow(consignmentOverviewPage, goodsItemDeclarePage));
    },

    createAndSubmitGmrFlow: async ({ movementOverviewPage, gmrDeclarePage, gmrDetailsPage }, use) => {
        await use(new AddNewGMRFlow(movementOverviewPage, gmrDeclarePage, gmrDetailsPage));
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
