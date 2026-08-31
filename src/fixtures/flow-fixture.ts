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
import { CdsNotificationFlow } from '../flows/cds-notification-flow';
import { TriggerFinalStatusThroughCdsFlow } from '../flows/common-flows/trigger-final-status-through-cds-flow';
import { SupplementaryDeclarationSteps } from '../flows/supplementary-declaration/supplementary-declaration-steps';
import { CompleteAndSubmitSupplementaryDeclarationFlow } from '../flows/common-flows/complete-and-submit-supplementary-declaration-flow';
import { GenerateSdDraftFromEnsSfdFlow } from '../flows/common-flows/generate-sd-draft-from-ens-sfd-flow';
import { ConcurrentLoginFlow } from '../flows/concurrent-login-flow';
import { LocaleFixtureType } from './locale-fixture';
import { CreateDraftEnsDeclarationFlow } from '../flows/common-flows/create-draft-ens-declaration-flow';
import { CreateDraftSfdStandaloneFlow } from '../flows/common-flows/create-draft-sfd-standalone-flow';
import { DeclarationAccessFlow } from '../flows/declaration-access-flow';
import { AuthorityCheckerFlow, authorityCheckerFlowFor } from '../flows/authority-check-flow';
import { CompanySessionFixtureType } from './company-session-fixture';
import { WorkerAuthFixtureType } from './worker-auth-fixture';
import { APIFixtureType } from './api-fixture';
import { SecondDeviceFixtureType } from './second-device-fixture';

export type FlowFixtureType = {
    // Business Flows
    portalAccessFlow: PortalAccessFlow;
    // Drives the sign-in screens directly. Only the authentication specs use it -
    // every other flow arrives already signed in via storageState.
    signInFlow: SignInFlow;
    companyProfileFlow: CompanyProfileFlow;
    representTraderFlow: RepresentTraderFlow;

    // Reads what a declaration lets the signed-in company do with it. Used by the
    // representation-authority specs, not by the journey specs.
    declarationAccessFlow: DeclarationAccessFlow;

    /**
     * Runs a row of the permission table (see src/test-data/authority-matrix).
     *
     * Wired here rather than in each test because what it needs - the Agent's browser,
     * the way to open a second company's, and the translator - is the same in every one
     * of them, and building it per test put four identical lines at the top of each.
     */
    checkAuthorityFlow: AuthorityCheckerFlow;

    // Builds a declaration and stops at Draft. The create-and-submit flows carry it
    // to the end; the authority specs take it somewhere else.
    createDraftEnsDeclarationFlow: CreateDraftEnsDeclarationFlow;
    createDraftSfdStandaloneFlow: CreateDraftSfdStandaloneFlow;
    initialFormDeclarationFlow: InitialFormDeclarationFlow;
    movementHeaderDeclarationFlow: MovementHeaderDeclarationFlow;
    movementOverviewFlow: MovementOverviewFlow;
    addNewEnsConsignmentFlow: AddNewEnsConsignmentFlow;
    consignmentOverviewFlow: ConsignmentOverviewFlow;
    // One step library per declare page: the steps say what a screen means, the flows
    // say which screens a journey visits and in what order. Standalone has a single
    // wizard where ENS has two, so its flows draw from all three.
    movementSteps: MovementSteps;
    consignmentSteps: ConsignmentSteps;
    standaloneConsignmentSteps: StandaloneConsignmentSteps;
    goodsItemSteps: GoodsItemSteps;
    addNewEnsGoodsItemFlow: AddNewEnsGoodsItemFlow;
    goodsOverviewFlow: GoodsOverviewFlow;
    createAndSubmitGmrFlow: AddNewGMRFlow; // This flow is added here as it relies on multiple other flows, and it will be used in multiple places, so it makes sense to have it as a common flow

    // Common Flows for ENS integrated flow: ENS Only, ENS-SFD, ENS-IMMI, ENS-EIDR
    ics2NotificationFlow: Ics2NotificationFlow;
    cdsNotificationFlow: CdsNotificationFlow;
    triggerFinalStatusThroughCdsFlow: TriggerFinalStatusThroughCdsFlow;

    // Common Flows
    createAndSubmitEnsDeclarationFlow: CreateAndSubmitEnsDeclarationFlow;
    // One flow per standalone journey: each owns its consignment wizard AND its goods
    // wizard, so a spec asks for the journey it tests by name. Those two wizards are
    // assembled inside the common flow below, which is their only consumer.
    createAndSubmitImmiStandaloneFlow: CreateAndSubmitImmiStandaloneFlow;
    createAndSubmitSfdStandaloneFlow: CreateAndSubmitSfdStandaloneFlow;
    createAndSubmitFfdStandaloneFlow: CreateAndSubmitFfdStandaloneFlow;

    // The supplementary declaration, which no journey CREATES: the service raises it
    // once a frontier declaration clears, so this one is asked for alongside the
    // journey that produced it rather than instead of it.
    supplementaryDeclarationSteps: SupplementaryDeclarationSteps;
    generateSdDraftFromEnsSfdFlow: GenerateSdDraftFromEnsSfdFlow;
    completeAndSubmitSupplementaryDeclarationFlow: CompleteAndSubmitSupplementaryDeclarationFlow;
    concurrentLoginFlow: ConcurrentLoginFlow;
}

// LocaleFixtureType is in the union because two flows take `t` themselves - deciding
// what a translated status means for a journey is flow-level, not page-level.
type ExtendParams = Parameters<typeof test.extend<FlowFixtureType & PageFixtureType & WorkerAuthFixtureType & APIFixtureType & LocaleFixtureType & SecondDeviceFixtureType & CompanySessionFixtureType>>;

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

    declarationAccessFlow: async ({
        movementOverviewPage, consignmentDetailPage, portalPage, declarationSearchPage, consignmentOverviewPage, t
    }, use) => {
        await use(new DeclarationAccessFlow(
            movementOverviewPage, consignmentDetailPage, portalPage, declarationSearchPage, consignmentOverviewPage, t
        ));
    },

    checkAuthorityFlow: async ({ declarationAccessFlow, openAs, t }, use) => {
        await use(authorityCheckerFlowFor({ agent: declarationAccessFlow, openAs, t }));
    },

    createDraftEnsDeclarationFlow: async ({
        portalAccessFlow,
        initialFormDeclarationFlow,
        movementHeaderDeclarationFlow,
        movementOverviewFlow,
        addNewEnsConsignmentFlow,
        consignmentOverviewFlow,
        addNewEnsGoodsItemFlow,
        goodsOverviewFlow,
        authAccount
    }, use) => {
        await use(new CreateDraftEnsDeclarationFlow(
            portalAccessFlow,
            initialFormDeclarationFlow,
            movementHeaderDeclarationFlow,
            movementOverviewFlow,
            addNewEnsConsignmentFlow,
            consignmentOverviewFlow,
            addNewEnsGoodsItemFlow,
            goodsOverviewFlow,
            authAccount
        ));
    },

    createDraftSfdStandaloneFlow: async ({
        portalAccessFlow, initialFormDeclarationFlow,
        standaloneConsignmentSteps, movementSteps, consignmentSteps, goodsItemSteps,
        consignmentOverviewFlow, goodsOverviewFlow, authAccount
    }, use) => {
        const addConsignment = new AddNewSfdStandaloneConsignmentFlow(
            standaloneConsignmentSteps, movementSteps, consignmentSteps
        );
        const addGoodsItem = new AddNewSfdStandaloneGoodsItemFlow(goodsItemSteps);
        await use(new CreateDraftSfdStandaloneFlow(
            portalAccessFlow, initialFormDeclarationFlow, addConsignment,
            addGoodsItem, consignmentOverviewFlow, goodsOverviewFlow, authAccount
        ));
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

    movementOverviewFlow: async ({ movementOverviewPage, consignmentDetailPage, t }, use) => {
        await use(new MovementOverviewFlow(movementOverviewPage, consignmentDetailPage, t));
    },

    addNewEnsConsignmentFlow: async ({ consignmentSteps }, use) => {
        await use(new AddNewEnsConsignmentFlow(consignmentSteps));
    },

    consignmentOverviewFlow: async ({
        consignmentOverviewPage, previousDocumentDeclarePage, holderOfAuthorisationDeclarePage,
        consignmentDetailPage, consignmentSteps, t
    }, use) => {
        await use(new ConsignmentOverviewFlow(
            consignmentOverviewPage, previousDocumentDeclarePage, holderOfAuthorisationDeclarePage,
            consignmentDetailPage, consignmentSteps, t
        ));
    },

    goodsItemSteps: async ({ consignmentOverviewPage, goodsItemDeclarePage }, use) => {
        await use(new GoodsItemSteps(consignmentOverviewPage, goodsItemDeclarePage));
    },

    addNewEnsGoodsItemFlow: async ({ goodsItemSteps }, use) => {
        await use(new AddNewEnsGoodsItemFlow(goodsItemSteps));
    },

    goodsOverviewFlow: async ({ goodsOverviewPage, documentReferenceDeclarePage, additionalInformationDeclarePage, previousDocumentDeclarePage, additionalProcedureCodeDeclarePage, taricAdditionalCodeDeclarePage, nationalAdditionalCodeDeclarePage, t }, use) => {
        await use(new GoodsOverviewFlow(goodsOverviewPage, documentReferenceDeclarePage, additionalInformationDeclarePage, previousDocumentDeclarePage, additionalProcedureCodeDeclarePage, taricAdditionalCodeDeclarePage, nationalAdditionalCodeDeclarePage, t));
    },

    createAndSubmitGmrFlow: async ({ movementOverviewPage, gmrDeclarePage, gmrDetailsPage, externalContactDeclarePage }, use) => {
        await use(new AddNewGMRFlow(movementOverviewPage, gmrDeclarePage, gmrDetailsPage, externalContactDeclarePage));
    },

    ics2NotificationFlow: async ({ ics2MockApiClient }, use) => {
        await use(new Ics2NotificationFlow(ics2MockApiClient));
    },

    cdsNotificationFlow: async ({ cdsMockApiClient }, use) => {
        await use(new CdsNotificationFlow(cdsMockApiClient));
    },

    triggerFinalStatusThroughCdsFlow: async ({
        cdsNotificationFlow, movementOverviewFlow, consignmentOverviewFlow,
    }, use) => {
        await use(new TriggerFinalStatusThroughCdsFlow(
            cdsNotificationFlow, movementOverviewFlow, consignmentOverviewFlow
        ));
    },

    createAndSubmitEnsDeclarationFlow: async ({
        portalAccessFlow,
        initialFormDeclarationFlow,
        movementHeaderDeclarationFlow,
        movementOverviewFlow,
        addNewEnsConsignmentFlow,
        consignmentOverviewFlow,
        addNewEnsGoodsItemFlow,
        goodsOverviewFlow,
        authAccount
    }, use) => {
        await use(new CreateAndSubmitEnsDeclarationFlow(
            portalAccessFlow,
            initialFormDeclarationFlow,
            movementHeaderDeclarationFlow,
            movementOverviewFlow,
            addNewEnsConsignmentFlow,
            consignmentOverviewFlow,
            addNewEnsGoodsItemFlow,
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

    supplementaryDeclarationSteps: async ({
        supplementaryDeclarationWizard, movementDeclarePage, consignmentDeclarePage,
        commercialTermsDeclarePage, goodsItemDeclarePage
    }, use) => {
        await use(new SupplementaryDeclarationSteps(
            supplementaryDeclarationWizard, movementDeclarePage, consignmentDeclarePage,
            commercialTermsDeclarePage, goodsItemDeclarePage
        ));
    },

    generateSdDraftFromEnsSfdFlow: async ({
        createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow, representTraderFlow
    }, use) => {
        await use(new GenerateSdDraftFromEnsSfdFlow(
            createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow, representTraderFlow
        ));
    },

    completeAndSubmitSupplementaryDeclarationFlow: async ({
        basePage, portalPage, declarationOverviewPage, supplementaryDeclarationOverviewPage,
        supplementaryDeclarationGoodsRecordPage, documentReferenceDeclarePage,
        additionalProcedureCodeDeclarePage, supplementaryDeclarationSteps, authAccount
    }, use) => {
        await use(new CompleteAndSubmitSupplementaryDeclarationFlow(
            basePage, portalPage, declarationOverviewPage, supplementaryDeclarationOverviewPage,
            supplementaryDeclarationGoodsRecordPage, documentReferenceDeclarePage,
            additionalProcedureCodeDeclarePage, supplementaryDeclarationSteps, authAccount
        ));
    },

    createAndSubmitFfdStandaloneFlow: async ({
        portalAccessFlow, initialFormDeclarationFlow,
        standaloneConsignmentSteps, movementSteps, consignmentSteps,
        ffdStandaloneConsignmentDeclarePage, commercialTermsDeclarePage, goodsItemSteps,
        consignmentOverviewFlow, goodsOverviewFlow, authAccount
    }, use) => {
        const addConsignment = new AddNewFfdStandaloneConsignmentFlow(
            standaloneConsignmentSteps, movementSteps, consignmentSteps,
            ffdStandaloneConsignmentDeclarePage, commercialTermsDeclarePage
        );
        const addGoodsItem = new AddNewFfdStandaloneGoodsItemFlow(goodsItemSteps);
        await use(new CreateAndSubmitFfdStandaloneFlow(
            portalAccessFlow, initialFormDeclarationFlow, addConsignment,
            addGoodsItem, consignmentOverviewFlow, goodsOverviewFlow, authAccount
        ));
    },

    concurrentLoginFlow: async ({
        signInFlow, portalPage, secondDeviceSignInFlow, secondDevicePortalPage
    }, use) => {
        await use(new ConcurrentLoginFlow(
            signInFlow, portalPage, secondDeviceSignInFlow, secondDevicePortalPage
        ));
    },
};

