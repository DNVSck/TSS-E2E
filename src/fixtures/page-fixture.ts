import { test } from '@playwright/test';
import { PortalPage } from '../page-object/portal-page'
import { BasePage } from '../page-object/base-page';
import { InitialFormDeclaraPage } from '../page-object/initial-form-declare-page';
import { MovementDeclarePage } from '../page-object/movement-declare-page';
import { GoodsMovementTaskListPage } from '../page-object/goods-movement-task-list-page';
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
import { TaricAdditionalCodeDeclarePage } from '../page-object/taric-additional-code-declare-page';
import { NationalAdditionalCodeDeclarePage } from '../page-object/national-additional-code-declare-page';


export type PageFixtureType = {
    basePage: BasePage;
    portalPage: PortalPage;
    initialFormDeclaraPage: InitialFormDeclaraPage;
    movementDeclarePage: MovementDeclarePage;
    goodsMovementTaskListPage: GoodsMovementTaskListPage;
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
    taricAdditionalCodeDeclarePage: TaricAdditionalCodeDeclarePage;
    nationalAdditionalCodeDeclarePage: NationalAdditionalCodeDeclarePage;
}

type ExtendParams = Parameters<typeof test.extend<PageFixtureType & LocaleFixtureType>>;

export const pageFixture: ExtendParams[0] = {
    basePage: async ({ page }, use) => {
        await use(new BasePage(page));
    },

    portalPage: async ({ page }, use) => {
        await use(new PortalPage(page));
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
    },

    gmrDeclarePage: async ({ page }, use) => {
        await use(new GmrDeclarePage(page));
    },

    gmrDetailsPage: async ({ page }, use) => {
        await use(new GmrDetailsPage(page));
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

    taricAdditionalCodeDeclarePage: async ({ page }, use) => {
        await use(new TaricAdditionalCodeDeclarePage(page));
    },

    nationalAdditionalCodeDeclarePage: async ({ page }, use) => {
        await use(new NationalAdditionalCodeDeclarePage(page));
    }
};