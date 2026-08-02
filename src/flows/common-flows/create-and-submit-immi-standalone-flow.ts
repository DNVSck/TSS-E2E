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
import { LOCAL_REFERENCE } from '../../constant/local-reference-constants';
import { UserCredentials } from '../../auth/credentials';
import { reportTestAccount } from '../../helper/report-helper';

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
    }): Promise<void> {
        const { testInfo, url } = options;
        const consignmentData = immiStandaloneConsignment(options.consignmentOverrides);
        const goodsData = goods(options.goodsItemOverrides);

        reportTestAccount(this.authAccount, 'completeImmiStandaloneFlow');

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
        // Goods-item-overview tabs, declared while on the goods item's overview.
        await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
        await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);

        await this.consignmentOverviewFlow.submitConsignment();
        // NOSONAR TODO: verify the post-submit state once the standalone consignment overview
        // exposes a Status field - see verifyStandaloneConsignmentSubmitted.
    }
}
