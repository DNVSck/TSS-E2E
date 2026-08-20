import { TestInfo } from '@playwright/test';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewImmiStandaloneConsignmentFlow } from '../consignment/add-new-immi-standalone-consignment-flow';
import { AddNewImmiStandaloneGoodsItemFlow } from '../goods-item/add-new-immi-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import {
    ImmiStandaloneConsignmentData, immiStandaloneConsignment,
} from '../../test-data/immi-standalone-consignment-data';
import { GoodsData, goods } from '../../test-data/goods-data';
import { initialFormData } from '../../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../../constant/initial-form-declaration-constants';
import { LOCAL_REFERENCE, MRN_COUNTRY_CODE } from '../../constant/local-reference-constants';
import { UserCredentials } from '../../auth/credentials';
import { TranslationKey } from '../../fixtures/locale-fixture';
import { reportTestAccount, reportDeclarationCodes } from '../../helper/report-helper';
import { standaloneSubmittedStatusKey } from '../../helper/consignment-status-helper';
import { requiresWarehouseIdentifier } from '../../helper/procedure-code-helper';
import { SUPERVISING_CUSTOMS_OFFICE } from '../../constant/supervising-customs-office-constant';

/**
 * Create and submit an IMMI standalone consignment. One flow per standalone journey:
 * IMMI, SFD and FFD diverge at the consignment wizard and (for FFD) the goods wizard,
 * so each owns its own spine rather than branching inside a shared one.
 *
 * Composes other flows - it never drives a page directly. Runs as whichever company
 * the spec signed in as; the "Representation information" screen is reached only when
 * the consignment data carries a representationType.
 */
export class CreateAndSubmitImmiStandaloneFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly initialFormFlow: InitialFormDeclarationFlow,
        private readonly addConsignmentFlow: AddNewImmiStandaloneConsignmentFlow,
        private readonly addGoodsItemFlow: AddNewImmiStandaloneGoodsItemFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        // The account this worker was assigned by the auth fixture - the same source
        // that picked the replayed session, so the report never names another account.
        private readonly authAccount: UserCredentials | null,
    ) { }

    async completeImmiStandaloneFlow(options: {
        testInfo: TestInfo;
        url: string;
        consignmentOverrides?: Partial<ImmiStandaloneConsignmentData>;
        goodsItemOverrides?: Partial<GoodsData>;
        /**
         * The status this journey expects to end on, when it is not the usual one.
         *
         * Only the authority specs pass it, and only to say "Trader Input Required":
         * they submit data CDS refuses on purpose, because a rejected consignment is
         * the one state where the service still offers actions and a permission can
         * therefore be told apart from a state everybody shares.
         *
         * Given, the MRN check is skipped too - a rejected consignment was never
         * authorised, so asking for its authorised MRN would fail for a second reason
         * that says nothing new.
         */
        expectedStatusKey?: TranslationKey;
    }): Promise<void> {
        const { testInfo, url } = options;
        const consignmentData = immiStandaloneConsignment(options.consignmentOverrides);
        const goodsData = goods(options.goodsItemOverrides);

        reportTestAccount(this.authAccount, 'completeImmiStandaloneFlow');
        reportDeclarationCodes(goodsData);

        await this.accessFlow.openService({ baseUrl: url, testInfo });
        await this.initialFormFlow.completeInitialFormDeclaration(initialFormData({
            typeOfSubmission: INITIAL_FORM_DECLARATION.TYPE_OF_SUBMISSION.STANDALONE,
            standaloneDeclarationType:
                INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.INTERNAL_MARKET_MOVEMENT_INFORMATION,
            typeOfEnsSubmission: undefined,
        }));
        await this.addConsignmentFlow.addNewImmiStandaloneConsignment(consignmentData);
        // Report the LRN as soon as the draft exists, before anything that could fail.
        // IMMI stamps a "GLR" reference, so asserting the prefix asserts the journey
        // that actually ran rather than merely that some standalone draft exists.
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentLrn(LOCAL_REFERENCE.GLR_PREFIX);
        // Consignment-overview tabs, declared before the goods item (no-op on empty lists).
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);

        const usedTgp = await this.addGoodsItemFlow.addNewImmiStandaloneGoodsItem(goodsData);
        // A TGP item never typed its commodity code, description or country of origin —
        // the service copied them from the record — so the overview is the only place
        // that proves the record was applied. No-op when the item did not use TGP.
        await this.goodsOverviewFlow.verifyTgpPopulatedFields(usedTgp ? goodsData.tgpRecord : undefined);
        // Goods-item-overview tabs, declared while on the goods item's overview. All six
        // tabs the IMMI goods item shows are wired, each a no-op on an empty list, so a
        // test opting into one only has to supply its data - same set as the ENS flow.
        await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
        await this.goodsOverviewFlow.declareAdditionalInformations(goodsData.additionalInformations);
        await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);
        await this.goodsOverviewFlow.declareAdditionalProcedureCodes(goodsData.additionalProcedureCodes);
        await this.goodsOverviewFlow.declareTaricAdditionalCodes(goodsData.taricAdditionalCodes);
        await this.goodsOverviewFlow.declareNationalAdditionalCodes(goodsData.nationalAdditionalCodes);

        // Checked BEFORE submit, unlike the ENS journey: this consignment carries its
        // own warehouse, so the service has already derived the office by the time the
        // goods item is finished - there is nothing to wait for and no reason to let a
        // wrong one through to submission.
        //
        // The navigation is NOT optional. Everything above leaves the browser on the
        // GOODS ITEM overview (on whichever tab was declared last), and this row lives
        // on the CONSIGNMENT overview.
        if (requiresWarehouseIdentifier(goodsData.procedureCode)) {
            await this.consignmentOverviewFlow.goToConsignmentOverview();
            await this.consignmentOverviewFlow.verifySupervisingCustomsOffice(
                SUPERVISING_CUSTOMS_OFFICE.GBBEL004
            );
        }

        // The goods-item work above leaves the browser on the GOODS ITEM overview;
        // submit lives on the consignment overview, so walk back up first.
        await this.consignmentOverviewFlow.goToConsignmentOverview();

        await this.consignmentOverviewFlow.submitConsignment();
        await this.verifyPostSubmit(consignmentData, options.expectedStatusKey);
    }

    /**
     * Post-submit verification for standalone IMMI. Unlike SFD, this journey has no
     * second route to branch on, so it follows the shared standalone rule outright: a
     * pre-lodged movement waits for its goods, an arrived one is already there, and the
     * consignment is assigned an MRN opening with the IMMI country code - the same
     * check the ENS journey makes of the IMMI consignment it auto-generates.
     */
    private async verifyPostSubmit(
        consignmentData: ImmiStandaloneConsignmentData,
        expectedStatusKey?: TranslationKey
    ): Promise<void> {
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            expectedStatusKey ?? standaloneSubmittedStatusKey(consignmentData.isPreLodged)
        );

        // A caller that expected a rejection was never going to get an MRN - see the
        // option's own note.
        if (!expectedStatusKey) {
            await this.consignmentOverviewFlow.verifyStandaloneConsignmentMrn('IMMI', MRN_COUNTRY_CODE.IMMI);
        }
    }
}
