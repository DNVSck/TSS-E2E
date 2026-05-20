import { test } from '@playwright/test';
import { PortalAccessFlow } from '../flows/portal-access-flow';
import { InitialFormDeclarationFlow } from '../flows/initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../flows/movement-header-declaration-flow';
import { MovementOverviewFlow } from '../flows/movement-overview-flow';
import { PageFixtureType } from './page-fixture';
import { CreateAndSubmitEnsDeclarationFlow } from '../flows/common-flows/createAndSubmitDeclarationFlow';
import { AddNewConsignmentFlow } from '../flows/add-new-consignment-flow';

export type FlowFixtureType = {
    // Business Flows
    portalAccessFlow: PortalAccessFlow;
    initialFormDeclarationFlow: InitialFormDeclarationFlow;
    movementHeaderDeclarationFlow: MovementHeaderDeclarationFlow;
    movementOverviewFlow: MovementOverviewFlow;
    addNewConsignmentFlow: AddNewConsignmentFlow;

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

    movementHeaderDeclarationFlow: async ({ goodsMovementTaskListPage, newGoodsMovementDeclarePage }, use) => {
        await use(new MovementHeaderDeclarationFlow(goodsMovementTaskListPage, newGoodsMovementDeclarePage));
    },

    movementOverviewFlow: async ({ declarationOverviewPage }, use) => {
        await use(new MovementOverviewFlow(declarationOverviewPage));
    },

    addNewConsignmentFlow: async ({ declarationOverviewPage, consignmentDeclarePage }, use) => {
        await use(new AddNewConsignmentFlow(declarationOverviewPage, consignmentDeclarePage));
    },

    createAndSubmitEnsDeclarationFlow: async ({
        portalAccessFlow,
        initialFormDeclarationFlow,
        movementHeaderDeclarationFlow,
        movementOverviewFlow,
        addNewConsignmentFlow
    }, use) => {
        await use(new CreateAndSubmitEnsDeclarationFlow(
            portalAccessFlow,
            initialFormDeclarationFlow,
            movementHeaderDeclarationFlow,
            movementOverviewFlow,
            addNewConsignmentFlow
        ));
    },
};
