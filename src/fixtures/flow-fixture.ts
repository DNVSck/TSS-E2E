import { test } from '@playwright/test';
import { PortalAccessFlow } from '../flows/portal-access-flow';
import { SignInFlow } from '../flows/sign-in-flow';
import { CompanyProfileFlow } from '../flows/company-profile-flow';
import { InitialFormDeclarationFlow } from '../flows/initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../flows/movement/movement-header-declaration-flow';
import { MovementSteps } from '../flows/movement/movement-steps';
import { ConsignmentSteps } from '../flows/consignment/consignment-steps';
import { StandaloneConsignmentSteps } from '../flows/consignment/standalone-consignment-steps';
import { MovementOverviewFlow } from '../flows/movement/movement-overview-flow';
import { PageFixtureType } from './page-fixture';
import { CreateAndSubmitEnsDeclarationFlow } from '../flows/common-flows/create-and-submit-ens-declaration-flow';
import { CreateAndSubmitImmiStandaloneFlow } from '../flows/common-flows/create-and-submit-immi-standalone-flow';
import { CreateAndSubmitSfdStandaloneFlow } from '../flows/common-flows/create-and-submit-sfd-standalone-flow';
import { CreateAndSubmitFfdStandaloneFlow } from '../flows/common-flows/create-and-submit-ffd-standalone-flow';
import { AddNewImmiStandaloneConsignmentFlow } from '../flows/consignment/add-new-immi-standalone-consignment-flow';
import { AddNewSfdStandaloneConsignmentFlow } from '../flows/consignment/add-new-sfd-standalone-consignment-flow';
import { AddNewFfdStandaloneConsignmentFlow } from '../flows/consignment/add-new-ffd-standalone-consignment-flow';
import { AddNewImmiStandaloneGoodsItemFlow } from '../flows/goods-item/add-new-immi-standalone-goods-item-flow';
import { AddNewSfdStandaloneGoodsItemFlow } from '../flows/goods-item/add-new-sfd-standalone-goods-item-flow';
import { AddNewFfdStandaloneGoodsItemFlow } from '../flows/goods-item/add-new-ffd-standalone-goods-item-flow';
import { GoodsItemSteps } from '../flows/goods-item/goods-item-steps';
import { AddNewEnsConsignmentFlow } from '../flows/consignment/add-new-ens-consignment-flow';
import { ConsignmentOverviewFlow } from '../flows/consignment/consignment-overview-flow';
import { AddNewEnsGoodsItemFlow } from '../flows/goods-item/add-new-ens-goods-item-flow';
import { GoodsOverviewFlow } from '../flows/goods-item/goods-overview-flow';
import { AddNewGMRFlow } from '../flows/add-new-gmr-flow';
import { RepresentTraderFlow } from '../flows/represent-trader-flow';
import { Ics2NotificationFlow } from '../flows/ics2-notification-flow';
import { WorkerAuthFixtureType } from './worker-auth-fixture';
import { APIFixtureType } from './api-fixture';

export type FlowFixtureType = {
    // Business Flows
    portalAccessFlow: PortalAccessFlow;
    // Drives the sign-in screens directly. Only the authentication specs use it -
    // every other flow arrives already signed in via storageState.
    signInFlow: SignInFlow;
    companyProfileFlow: CompanyProfileFlow;
    representTraderFlow: RepresentTraderFlow;
    initialFormDeclarationFlow: InitialFormDeclarationFlow;
    movementHeaderDeclarationFlow: MovementHeaderDeclarationFlow;
    movementOverviewFlow: MovementOverviewFlow;
    addNewConsignmentFlow: AddNewEnsConsignmentFlow;
    consignmentOverviewFlow: ConsignmentOverviewFlow;
    // One step library per declare page: the steps say what a screen means, the flows
    // say which screens a journey visits and in what order. Standalone has a single
    // wizard where ENS has two, so its flows draw from all three.
    movementSteps: MovementSteps;
    consignmentSteps: ConsignmentSteps;
    standaloneConsignmentSteps: StandaloneConsignmentSteps;
    goodsItemSteps: GoodsItemSteps;
    addNewGoodsItemFlow: AddNewEnsGoodsItemFlow;
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

    signInFlow: async ({ basePage, portalPage, signInPage }, use) => {
        await use(new SignInFlow(basePage, portalPage, signInPage));
    },

    companyProfileFlow: async ({ navigationMenu, companyProfilePage, companyProfileUsersPage }, use) => {
        await use(new CompanyProfileFlow(navigationMenu, companyProfilePage, companyProfileUsersPage));
    },

    representTraderFlow: async ({ agentBanner, representTraderPage }, use) => {
        await use(new RepresentTraderFlow(agentBanner, representTraderPage));
    },

    initialFormDeclarationFlow: async ({ initialFormDeclaraPage }, use) => {
        await use(new InitialFormDeclarationFlow(initialFormDeclaraPage));
    },

    movementSteps: async ({ goodsMovementTaskListPage, movementDeclarePage }, use) => {
        await use(new MovementSteps(goodsMovementTaskListPage, movementDeclarePage));
    },

    consignmentSteps: async ({ movementOverviewPage, consignmentDeclarePage }, use) => {
        await use(new ConsignmentSteps(movementOverviewPage, consignmentDeclarePage));
    },

    standaloneConsignmentSteps: async ({ standaloneConsignmentDeclarePage }, use) => {
        await use(new StandaloneConsignmentSteps(standaloneConsignmentDeclarePage));
    },

    movementHeaderDeclarationFlow: async ({ movementSteps }, use) => {
        await use(new MovementHeaderDeclarationFlow(movementSteps));
    },

    movementOverviewFlow: async ({ movementOverviewPage, consignmentDetailPage }, use) => {
        await use(new MovementOverviewFlow(movementOverviewPage, consignmentDetailPage));
    },

    addNewConsignmentFlow: async ({ consignmentSteps }, use) => {
        await use(new AddNewEnsConsignmentFlow(consignmentSteps));
    },

    consignmentOverviewFlow: async ({ consignmentOverviewPage, previousDocumentDeclarePage, holderOfAuthorisationDeclarePage, consignmentDetailPage}, use) => {
        await use(new ConsignmentOverviewFlow(consignmentOverviewPage, previousDocumentDeclarePage, holderOfAuthorisationDeclarePage, consignmentDetailPage));
    },

    goodsItemSteps: async ({ consignmentOverviewPage, goodsItemDeclarePage }, use) => {
        await use(new GoodsItemSteps(consignmentOverviewPage, goodsItemDeclarePage));
    },

    addNewGoodsItemFlow: async ({ goodsItemSteps }, use) => {
        await use(new AddNewEnsGoodsItemFlow(goodsItemSteps));
    },

    goodsOverviewFlow: async ({ goodsOverviewPage, documentReferenceDeclarePage, additionalInformationDeclarePage, previousDocumentDeclarePage, additionalProcedureCodeDeclarePage, taricAdditionalCodeDeclarePage, nationalAdditionalCodeDeclarePage }, use) => {
        await use(new GoodsOverviewFlow(goodsOverviewPage, documentReferenceDeclarePage, additionalInformationDeclarePage, previousDocumentDeclarePage, additionalProcedureCodeDeclarePage, taricAdditionalCodeDeclarePage, nationalAdditionalCodeDeclarePage));
    },

    createAndSubmitGmrFlow: async ({ movementOverviewPage, gmrDeclarePage, gmrDetailsPage, externalContactDeclarePage }, use) => {
        await use(new AddNewGMRFlow(movementOverviewPage, gmrDeclarePage, gmrDetailsPage, externalContactDeclarePage));
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
        standaloneConsignmentSteps, movementSteps, consignmentSteps, goodsItemSteps,
        consignmentOverviewFlow, goodsOverviewFlow, authAccount
    }, use) => {
        const addConsignment = new AddNewImmiStandaloneConsignmentFlow(
            standaloneConsignmentSteps, movementSteps, consignmentSteps
        );
        const addGoodsItem = new AddNewImmiStandaloneGoodsItemFlow(goodsItemSteps);
        await use(new CreateAndSubmitImmiStandaloneFlow(
            portalAccessFlow, initialFormDeclarationFlow, addConsignment,
            addGoodsItem, consignmentOverviewFlow, goodsOverviewFlow, authAccount
        ));
    },

    createAndSubmitSfdStandaloneFlow: async ({
        portalAccessFlow, initialFormDeclarationFlow,
        standaloneConsignmentSteps, movementSteps, consignmentSteps, goodsItemSteps,
        consignmentOverviewFlow, goodsOverviewFlow, authAccount
    }, use) => {
        const addConsignment = new AddNewSfdStandaloneConsignmentFlow(
            standaloneConsignmentSteps, movementSteps, consignmentSteps
        );
        const addGoodsItem = new AddNewSfdStandaloneGoodsItemFlow(goodsItemSteps);
        await use(new CreateAndSubmitSfdStandaloneFlow(
            portalAccessFlow, initialFormDeclarationFlow, addConsignment,
            addGoodsItem, consignmentOverviewFlow, goodsOverviewFlow, authAccount
        ));
    },

    createAndSubmitFfdStandaloneFlow: async ({
        portalAccessFlow, initialFormDeclarationFlow,
        standaloneConsignmentSteps, movementSteps, consignmentSteps,
        ffdStandaloneConsignmentDeclarePage, goodsItemSteps,
        consignmentOverviewFlow, goodsOverviewFlow, authAccount
    }, use) => {
        const addConsignment = new AddNewFfdStandaloneConsignmentFlow(
            standaloneConsignmentSteps, movementSteps, consignmentSteps,
            ffdStandaloneConsignmentDeclarePage
        );
        const addGoodsItem = new AddNewFfdStandaloneGoodsItemFlow(goodsItemSteps);
        await use(new CreateAndSubmitFfdStandaloneFlow(
            portalAccessFlow, initialFormDeclarationFlow, addConsignment,
            addGoodsItem, consignmentOverviewFlow, goodsOverviewFlow, authAccount
        ));
    },
};

