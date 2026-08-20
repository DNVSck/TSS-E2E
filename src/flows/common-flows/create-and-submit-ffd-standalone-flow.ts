import { TestInfo } from '@playwright/test';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewFfdStandaloneConsignmentFlow } from '../consignment/add-new-ffd-standalone-consignment-flow';
import { AddNewFfdStandaloneGoodsItemFlow } from '../goods-item/add-new-ffd-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import {
    FfdStandaloneConsignmentData, ffdStandaloneConsignment,
} from '../../test-data/ffd-standalone-consignment-data';
import { GoodsData, goods } from '../../test-data/goods-data';
import { initialFormData } from '../../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../../constant/initial-form-declaration-constants';
import { LOCAL_REFERENCE } from '../../constant/local-reference-constants';
import { UserCredentials } from '../../auth/credentials';
import { reportTestAccount, reportDeclarationCodes } from '../../helper/report-helper';

/**
 * Create and submit an FFD standalone consignment. One flow per standalone journey:
 * IMMI, SFD and FFD diverge at the consignment wizard and (for FFD) the goods wizard,
 * so each owns its own spine rather than branching inside a shared one.
 *
 * FFD is the journey that diverges most - it reaches screens the other two never do
 * (flight details, inland mode of transport, intended declaration type, warehouse
 * type) and its goods item will branch on its own answers. Those land in this flow
 * and AddNewFfdStandaloneConsignmentFlow as they are built, without touching IMMI/SFD.
 *
 * Composes other flows - it never drives a page directly.
 */
export class CreateAndSubmitFfdStandaloneFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly initialFormFlow: InitialFormDeclarationFlow,
        private readonly addConsignmentFlow: AddNewFfdStandaloneConsignmentFlow,
        private readonly addGoodsItemFlow: AddNewFfdStandaloneGoodsItemFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        // The account this worker was assigned by the auth fixture - the same source
        // that picked the replayed session, so the report never names another account.
        private readonly authAccount: UserCredentials | null,
    ) { }

    async completeFfdStandaloneFlow(options: {
        testInfo: TestInfo;
        url: string;
        consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
        goodsItemOverrides?: Partial<GoodsData>;
    }): Promise<void> {
        const { testInfo, url } = options;
        const consignmentData = ffdStandaloneConsignment(options.consignmentOverrides);
        const goodsData = goods(options.goodsItemOverrides);

        reportTestAccount(this.authAccount, 'completeFfdStandaloneFlow');
        reportDeclarationCodes(goodsData);

        await this.accessFlow.openService({ baseUrl: url, testInfo });
        await this.initialFormFlow.completeInitialFormDeclaration(initialFormData({
            typeOfSubmission: INITIAL_FORM_DECLARATION.TYPE_OF_SUBMISSION.STANDALONE,
            standaloneDeclarationType: INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.STANDARD_DECLARATION,
            typeOfEnsSubmission: undefined,
        }));
        await this.addConsignmentFlow.addNewFfdStandaloneConsignment(consignmentData);
        // Report the LRN as soon as the draft exists, before anything that could fail.
        // The "FFD" prefix asserts the journey that actually ran rather than merely
        // that some standalone draft exists.
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentLrn(LOCAL_REFERENCE.FFD_PREFIX);
        // Consignment-overview tabs, declared before the goods item (no-op on empty lists).
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);

        await this.addGoodsItemFlow.addNewFfdStandaloneGoodsItem(goodsData);
        // Goods-item-overview tabs, declared while on the goods item's overview.
        await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
        await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);

        // The goods-item work above leaves the browser on the GOODS ITEM overview;
        // submit lives on the consignment overview, so walk back up first.
        await this.consignmentOverviewFlow.goToConsignmentOverview();

        await this.consignmentOverviewFlow.submitConsignment();
        // NOSONAR TODO: verify the post-submit state - what FFD is expected to produce (an MRN
        // like SFD/IMMI, or something else) is not yet confirmed.
    }
}
