import { test } from '@playwright/test';
import { PortalAccessFlow } from '../flows/portal-access-flow';
import { InitialFormDeclarationFlow } from '../flows/initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../flows/movement-header-declaration-flow';
import { MovementOverviewFlow } from '../flows/movement-overview-flow';
import { PageFixtureType } from './page-fixture';
import { CreateAndSubmitEnsDeclarationFlow } from '../flows/common-flows/create-and-submit-ens-declaration-flow';
import { CreateAndSubmitImmiStandaloneFlow } from '../flows/common-flows/create-and-submit-immi-standalone-flow';
import { CreateAndSubmitSfdStandaloneFlow } from '../flows/common-flows/create-and-submit-sfd-standalone-flow';
import { CreateAndSubmitFfdStandaloneFlow } from '../flows/common-flows/create-and-submit-ffd-standalone-flow';
import { AddNewImmiStandaloneConsignmentFlow } from '../flows/add-new-immi-standalone-consignment-flow';
import { AddNewSfdStandaloneConsignmentFlow } from '../flows/add-new-sfd-standalone-consignment-flow';
import { AddNewFfdStandaloneConsignmentFlow } from '../flows/add-new-ffd-standalone-consignment-flow';
import { AddNewImmiStandaloneGoodsItemFlow } from '../flows/add-new-immi-standalone-goods-item-flow';
import { AddNewSfdStandaloneGoodsItemFlow } from '../flows/add-new-sfd-standalone-goods-item-flow';
import { AddNewFfdStandaloneGoodsItemFlow } from '../flows/add-new-ffd-standalone-goods-item-flow';
import { AddNewConsignmentFlow } from '../flows/add-new-consignment-flow';
import { ConsignmentOverviewFlow } from '../flows/consignment-overview-flow';
import { AddNewGoodsItemFlow } from '../flows/add-new-goods-item-flow';
import { GoodsOverviewFlow } from '../flows/goods-overview-flow';
import { AddNewGMRFlow } from '../flows/add-new-gmr-flow';
import { RepresentTraderFlow } from '../flows/represent-trader-flow';
import { Ics2NotificationFlow } from '../flows/ics2-notification-flow';
import { WorkerAuthFixtureType } from './worker-auth-fixture';
import { APIFixtureType } from './api-fixture';

export type FlowFixtureType = {
    // Business Flows
    portalAccessFlow: PortalAccessFlow;
    representTraderFlow: RepresentTraderFlow;
    initialFormDeclarationFlow: InitialFormDeclarationFlow;
    movementHeaderDeclarationFlow: MovementHeaderDeclarationFlow;
    movementOverviewFlow: MovementOverviewFlow;
    addNewConsignmentFlow: AddNewConsignmentFlow;
    consignmentOverviewFlow: ConsignmentOverviewFlow;
    addNewGoodsItemFlow: AddNewGoodsItemFlow;
    goodsOverviewFlow: GoodsOverviewFlow;
    createAndSubmitGmrFlow: AddNewGMRFlow; // This flow is added here as it relies on multiple other flows, and it will be used in multiple places, so it makes sense to have it as a common flow

    // Common Flows for ENS integrated flow: ENS Only, ENS-SFD, ENS-IMMI, ENS-EIDR
    ics2NotificationFlow: Ics2NotificationFlow;

    // Common Flows
    createAndSubmitEnsDeclarationFlow: CreateAndSubmitEnsDeclarationFlow;
    // One flow per standalone journey: each owns its consignment wizard AND its goods
    // wizard, so a spec asks for the journey it tests by name. Those two wizards are
    // assembled inside the common flow below, which is their only consumer.
    createAndSubmitImmiStandaloneFlow: CreateAndSubmitImmiStandaloneFlow;
    createAndSubmitSfdStandaloneFlow: CreateAndSubmitSfdStandaloneFlow;
    createAndSubmitFfdStandaloneFlow: CreateAndSubmitFfdStandaloneFlow;
}

type ExtendParams = Parameters<typeof test.extend<FlowFixtureType & PageFixtureType & WorkerAuthFixtureType & APIFixtureType>>;

export const flowFixture: ExtendParams[0] = {
    portalAccessFlow: async ({ basePage, portalPage }, use) => {
        await use(new PortalAccessFlow(basePage, portalPage));
    },

    representTraderFlow: async ({ agentBanner, representTraderPage }, use) => {
        await use(new RepresentTraderFlow(agentBanner, representTraderPage));
    },

    initialFormDeclarationFlow: async ({ initialFormDeclaraPage }, use) => {
        await use(new InitialFormDeclarationFlow(initialFormDeclaraPage));
    },

    movementHeaderDeclarationFlow: async ({ goodsMovementTaskListPage, movementDeclarePage }, use) => {
        await use(new MovementHeaderDeclarationFlow(goodsMovementTaskListPage, movementDeclarePage));
    },

    movementOverviewFlow: async ({ movementOverviewPage, consignmentDetailPage }, use) => {
        await use(new MovementOverviewFlow(movementOverviewPage, consignmentDetailPage));
    },

    addNewConsignmentFlow: async ({ movementOverviewPage, consignmentDeclarePage }, use) => {
        await use(new AddNewConsignmentFlow(movementOverviewPage, consignmentDeclarePage));
    },

    consignmentOverviewFlow: async ({ consignmentOverviewPage, previousDocumentDeclarePage, holderOfAuthorisationDeclarePage, consignmentDetailPage}, use) => {
        await use(new ConsignmentOverviewFlow(consignmentOverviewPage, previousDocumentDeclarePage, holderOfAuthorisationDeclarePage, consignmentDetailPage));
    },

    addNewGoodsItemFlow: async ({ consignmentOverviewPage, goodsItemDeclarePage }, use) => {
        await use(new AddNewGoodsItemFlow(consignmentOverviewPage, goodsItemDeclarePage));
    },

    goodsOverviewFlow: async ({ goodsOverviewPage, documentReferenceDeclarePage, additionalInformationDeclarePage, previousDocumentDeclarePage, additionalProcedureCodeDeclarePage, taricAdditionalCodeDeclarePage, nationalAdditionalCodeDeclarePage }, use) => {
        await use(new GoodsOverviewFlow(goodsOverviewPage, documentReferenceDeclarePage, additionalInformationDeclarePage, previousDocumentDeclarePage, additionalProcedureCodeDeclarePage, taricAdditionalCodeDeclarePage, nationalAdditionalCodeDeclarePage));
    },

    createAndSubmitGmrFlow: async ({ movementOverviewPage, gmrDeclarePage, gmrDetailsPage }, use) => {
        await use(new AddNewGMRFlow(movementOverviewPage, gmrDeclarePage, gmrDetailsPage));
    },

    ics2NotificationFlow: async ({ rmqApiRequest }, use) => {
        await use(new Ics2NotificationFlow(rmqApiRequest));
    },

    createAndSubmitEnsDeclarationFlow: async ({
        portalAccessFlow,
        initialFormDeclarationFlow,
        movementHeaderDeclarationFlow,
        movementOverviewFlow,
        addNewConsignmentFlow,
        consignmentOverviewFlow,
        addNewGoodsItemFlow,
        goodsOverviewFlow,
        authAccount
    }, use) => {
        await use(new CreateAndSubmitEnsDeclarationFlow(
            portalAccessFlow,
            initialFormDeclarationFlow,
            movementHeaderDeclarationFlow,
            movementOverviewFlow,
            addNewConsignmentFlow,
            consignmentOverviewFlow,
            addNewGoodsItemFlow,
            goodsOverviewFlow,
            authAccount
        ));
    },

    createAndSubmitImmiStandaloneFlow: async ({
        portalAccessFlow, initialFormDeclarationFlow,
        consignmentTaskListPage, standaloneConsignmentDeclarePage, movementDeclarePage, consignmentDeclarePage,
        consignmentOverviewPage, goodsItemDeclarePage,
        consignmentOverviewFlow, goodsOverviewFlow, authAccount
    }, use) => {
        const addConsignment = new AddNewImmiStandaloneConsignmentFlow(
            consignmentTaskListPage, standaloneConsignmentDeclarePage, movementDeclarePage, consignmentDeclarePage
        );
        const addGoodsItem = new AddNewImmiStandaloneGoodsItemFlow(consignmentOverviewPage, goodsItemDeclarePage);
        await use(new CreateAndSubmitImmiStandaloneFlow(
            portalAccessFlow, initialFormDeclarationFlow, addConsignment,
            addGoodsItem, consignmentOverviewFlow, goodsOverviewFlow, authAccount
        ));
    },

    createAndSubmitSfdStandaloneFlow: async ({
        portalAccessFlow, initialFormDeclarationFlow,
        consignmentTaskListPage, standaloneConsignmentDeclarePage, movementDeclarePage, consignmentDeclarePage,
        consignmentOverviewPage, goodsItemDeclarePage,
        consignmentOverviewFlow, goodsOverviewFlow, authAccount
    }, use) => {
        const addConsignment = new AddNewSfdStandaloneConsignmentFlow(
            consignmentTaskListPage, standaloneConsignmentDeclarePage, movementDeclarePage, consignmentDeclarePage
        );
        const addGoodsItem = new AddNewSfdStandaloneGoodsItemFlow(consignmentOverviewPage, goodsItemDeclarePage);
        await use(new CreateAndSubmitSfdStandaloneFlow(
            portalAccessFlow, initialFormDeclarationFlow, addConsignment,
            addGoodsItem, consignmentOverviewFlow, goodsOverviewFlow, authAccount
        ));
    },

    createAndSubmitFfdStandaloneFlow: async ({
        portalAccessFlow, initialFormDeclarationFlow,
        consignmentTaskListPage, standaloneConsignmentDeclarePage, movementDeclarePage, consignmentDeclarePage,
        consignmentOverviewPage, goodsItemDeclarePage,
        consignmentOverviewFlow, goodsOverviewFlow, authAccount
    }, use) => {
        const addConsignment = new AddNewFfdStandaloneConsignmentFlow(
            consignmentTaskListPage, standaloneConsignmentDeclarePage, movementDeclarePage, consignmentDeclarePage
        );
        const addGoodsItem = new AddNewFfdStandaloneGoodsItemFlow(consignmentOverviewPage, goodsItemDeclarePage);
        await use(new CreateAndSubmitFfdStandaloneFlow(
            portalAccessFlow, initialFormDeclarationFlow, addConsignment,
            addGoodsItem, consignmentOverviewFlow, goodsOverviewFlow, authAccount
        ));
    },
};

