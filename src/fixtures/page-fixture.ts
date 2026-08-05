import { test } from '@playwright/test';
import { PortalPage } from '../page-object/portal-page'
import { BasePage } from '../page-object/base-page';
import { InitialFormDeclaraPage } from '../page-object/initial-form-declare-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { MovementOverviewPage } from '../page-object/movement-overview-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { GoodsDeclarePage } from '../page-object/goods-declare-page';
import { LocaleFixtureType } from './locale-fixture';
import { ConsignmentOverviewPage } from '../page-object/consignment-overview-page';
import { GoodsOverviewPage } from '../page-object/goods-overview-page';
import { GmrDetailsPage } from '../page-object/gmr-details-page';
import { GmrDeclarePage } from '../page-object/gmr-declare-page';
import { PreviousDocumentDeclarePage } from '../page-object/header-previous-documents-declare-page';
import { HolderOfAuthorisationDeclarePage } from '../page-object/holder-of-authorisation-declare-page';
import { DocumentReferenceDeclarePage } from '../page-object/document-reference-declare-page';
import { AdditionalInformationDeclarePage } from '../page-object/additional-information-declare-page';
import { AdditionalProcedureCodeDeclarePage } from '../page-object/additional-procedure-code-declare-page';
import { ExternalContactDeclarePage } from '../page-object/external-contact-declare-page';
import { TaricAdditionalCodeDeclarePage } from '../page-object/taric-additional-code-declare-page';
import { NationalAdditionalCodeDeclarePage } from '../page-object/national-additional-code-declare-page';
import { RepresentTraderPage } from '../page-object/represent-trader-page';
import { AgentBanner } from '../page-object/components/agent-banner';
import { ConsignmentDetailPage } from '../page-object/consignment-detail-page';
import { StandaloneConsignmentDeclarePage } from '../page-object/standalone-consignment-declare-page';
import { FfdStandaloneConsignmentDeclarePage } from '../page-object/ffd-standalone-consignment-declare-page';
import { TaskListPage } from '../page-object/task-list-page';


export type PageFixtureType = {
    basePage: BasePage;
    portalPage: PortalPage;
    representTraderPage: RepresentTraderPage;
    agentBanner: AgentBanner;
    consignmentDetailPage: ConsignmentDetailPage;
    initialFormDeclaraPage: InitialFormDeclaraPage;
    movementDeclarePage: MovementDeclarePage;
    goodsMovementTaskListPage: TaskListPage;
    movementOverviewPage: MovementOverviewPage;
    consignmentDeclarePage: ConsignmentDeclarePage;
    goodsItemDeclarePage: GoodsDeclarePage;
    consignmentOverviewPage: ConsignmentOverviewPage;
    goodsOverviewPage: GoodsOverviewPage;
    gmrDeclarePage: GmrDeclarePage;
    gmrDetailsPage: GmrDetailsPage;
    previousDocumentDeclarePage: PreviousDocumentDeclarePage;
    holderOfAuthorisationDeclarePage: HolderOfAuthorisationDeclarePage;
    documentReferenceDeclarePage: DocumentReferenceDeclarePage;
    additionalInformationDeclarePage: AdditionalInformationDeclarePage;
    additionalProcedureCodeDeclarePage: AdditionalProcedureCodeDeclarePage;
    externalContactDeclarePage: ExternalContactDeclarePage;
    taricAdditionalCodeDeclarePage: TaricAdditionalCodeDeclarePage;
    nationalAdditionalCodeDeclarePage: NationalAdditionalCodeDeclarePage;
    standaloneConsignmentDeclarePage: StandaloneConsignmentDeclarePage;
    // The FFD-only screens. Empty until they are built - see the page object.
    ffdStandaloneConsignmentDeclarePage: FfdStandaloneConsignmentDeclarePage;
    consignmentTaskListPage: TaskListPage;
}

type ExtendParams = Parameters<typeof test.extend<PageFixtureType & LocaleFixtureType>>;

export const pageFixture: ExtendParams[0] = {
    basePage: async ({ page }, use) => {
        await use(new BasePage(page));
    },

    portalPage: async ({ page }, use) => {
        await use(new PortalPage(page));
    },

    representTraderPage: async ({ page }, use) => {
        await use(new RepresentTraderPage(page));
    },

    agentBanner: async ({ page }, use) => {
        await use(new AgentBanner(page));
    },

    initialFormDeclaraPage: async ({ page }, use) => {
        await use(new InitialFormDeclaraPage(page));
    },

    movementDeclarePage: async ({ page }, use) => {
        await use(new MovementDeclarePage(page));
    },

    goodsMovementTaskListPage: async ({ page }, use) => {
        await use(new TaskListPage(page));
    },

    movementOverviewPage: async ({ page, t }, use) => {
        await use(new MovementOverviewPage(page, t));
    },

    consignmentDetailPage: async ({ page, t }, use) => {
        await use(new ConsignmentDetailPage(page, t));
    },

    consignmentDeclarePage: async ({ page }, use) => {
        await use(new ConsignmentDeclarePage(page));
    },

    consignmentOverviewPage: async ({ page, t }, use) => {
        await use(new ConsignmentOverviewPage(page, t));
    },

    goodsItemDeclarePage: async ({ page }, use) => {
        await use(new GoodsDeclarePage(page));
    },

    goodsOverviewPage: async ({ page, t }, use) => {
        await use(new GoodsOverviewPage(page, t));
    },

    gmrDeclarePage: async ({ page }, use) => {
        await use(new GmrDeclarePage(page));
    },

    gmrDetailsPage: async ({ page, t }, use) => {
        await use(new GmrDetailsPage(page, t));
    },

    previousDocumentDeclarePage: async ({ page }, use) => {
        await use(new PreviousDocumentDeclarePage(page));
    },

    holderOfAuthorisationDeclarePage: async ({ page }, use) => {
        await use(new HolderOfAuthorisationDeclarePage(page));
    },

    documentReferenceDeclarePage: async ({ page }, use) => {
        await use(new DocumentReferenceDeclarePage(page));
    },

    additionalInformationDeclarePage: async ({ page }, use) => {
        await use(new AdditionalInformationDeclarePage(page));
    },

    additionalProcedureCodeDeclarePage: async ({ page }, use) => {
        await use(new AdditionalProcedureCodeDeclarePage(page));
    },

    externalContactDeclarePage: async ({ page }, use) => {
        await use(new ExternalContactDeclarePage(page));
    },

    taricAdditionalCodeDeclarePage: async ({ page }, use) => {
        await use(new TaricAdditionalCodeDeclarePage(page));
    },

    nationalAdditionalCodeDeclarePage: async ({ page }, use) => {
        await use(new NationalAdditionalCodeDeclarePage(page));
    },

    standaloneConsignmentDeclarePage: async ({ page }, use) => {
        await use(new StandaloneConsignmentDeclarePage(page));
    },

    ffdStandaloneConsignmentDeclarePage: async ({ page }, use) => {
        await use(new FfdStandaloneConsignmentDeclarePage(page));
    },

    consignmentTaskListPage: async ({ page }, use) => {
        await use(new TaskListPage(page));
    }
};