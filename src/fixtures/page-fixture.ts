import { test } from '@playwright/test';
import { PortalPage } from '../page-object/portal-page'
import { SignInPage } from '../page-object/sign-in-page';
import { CompanyProfilePage } from '../page-object/company-profile-page';
import { CompanyProfileUsersPage } from '../page-object/company-profile-users-page';
import { NavigationMenu } from '../page-object/components/navigation-menu';
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
import { CommercialTermsDeclarePage } from '../page-object/commercial-terms-declare-page';
import { DeclarationOverviewPage } from '../page-object/declaration-overview-page';
import { DeclarationSearchPage } from '../page-object/declaration-search-page';
import { SupplementaryDeclarationOverviewPage } from '../page-object/supplementary-declaration-overview-page';
import { SupplementaryDeclarationGoodsRecordPage } from '../page-object/supplementary-declaration-goods-record-page';
import { Wizard } from '../page-object/components/wizard';
import { SupplementaryDeclarationStep } from '../constant/supplementary-declaration-step-constant';
import { TaskListPage } from '../page-object/task-list-page';


export type PageFixtureType = {
    basePage: BasePage;
    portalPage: PortalPage;
    signInPage: SignInPage;
    companyProfilePage: CompanyProfilePage;
    companyProfileUsersPage: CompanyProfileUsersPage;
    navigationMenu: NavigationMenu;
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
    commercialTermsDeclarePage: CommercialTermsDeclarePage;
    // The declaration list, and the supplementary declaration reached through it.
    declarationOverviewPage: DeclarationOverviewPage;

    // Finding a declaration by reference, which is how the authority specs reach one
    // they did not create: a second company sees it only through the search.
    declarationSearchPage: DeclarationSearchPage;
    supplementaryDeclarationOverviewPage: SupplementaryDeclarationOverviewPage;
    supplementaryDeclarationGoodsRecordPage: SupplementaryDeclarationGoodsRecordPage;
    supplementaryDeclarationWizard: Wizard<SupplementaryDeclarationStep>;
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

    signInPage: async ({ page }, use) => {
        await use(new SignInPage(page));
    },

    companyProfilePage: async ({ page }, use) => {
        await use(new CompanyProfilePage(page));
    },

    companyProfileUsersPage: async ({ page }, use) => {
        await use(new CompanyProfileUsersPage(page));
    },

    navigationMenu: async ({ page }, use) => {
        await use(new NavigationMenu(page));
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

    commercialTermsDeclarePage: async ({ page }, use) => {
        await use(new CommercialTermsDeclarePage(page));
    },

    declarationOverviewPage: async ({ page }, use) => {
        await use(new DeclarationOverviewPage(page));
    },

    declarationSearchPage: async ({ page }, use) => {
        await use(new DeclarationSearchPage(page));
    },

    supplementaryDeclarationOverviewPage: async ({ page, t }, use) => {
        await use(new SupplementaryDeclarationOverviewPage(page, t));
    },

    supplementaryDeclarationGoodsRecordPage: async ({ page }, use) => {
        await use(new SupplementaryDeclarationGoodsRecordPage(page));
    },

    supplementaryDeclarationWizard: async ({ page }, use) => {
        await use(new Wizard<SupplementaryDeclarationStep>(page));
    },

    consignmentTaskListPage: async ({ page }, use) => {
        await use(new TaskListPage(page));
    }
};