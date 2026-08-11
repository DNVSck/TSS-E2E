import { TestInfo } from '@playwright/test';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewSfdStandaloneConsignmentFlow } from '../consignment/add-new-sfd-standalone-consignment-flow';
import { AddNewSfdStandaloneGoodsItemFlow } from '../goods-item/add-new-sfd-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import {
    SfdStandaloneConsignmentData, sfdStandaloneConsignment,
} from '../../test-data/sfd-standalone-consignment-data';
import { GoodsData, goods } from '../../test-data/goods-data';
import { initialFormData } from '../../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../../constant/initial-form-declaration-constants';
import { UserCredentials } from '../../auth/credentials';
import { reportTestAccount, reportDeclarationCodes } from '../../helper/report-helper';
import { LOCAL_REFERENCE } from '../../constant/local-reference-constants';
import { TranslationKey } from '../../fixtures/locale-fixture';

/**
 * The status a submitted SFD standalone consignment settles on. Confirmed with the
 * business 2026-08-11:
 *
 *   - controlled goods = No (the EIDR route): always "Authorised", whether the
 *     movement was pre-lodged or arrived - EIDR has no arrival to wait for;
 *   - controlled goods = Yes (the SFD route): "Awaiting arrival" when pre-lodged,
 *     "Arrived" when the goods have already arrived.
 *
 * Stated here, beside the journey that produces it, rather than inside the page that
 * polls for it: it is a fact about this journey, and the page serves all of them.
 */
function submittedStatusKey(data: SfdStandaloneConsignmentData): TranslationKey {
    if (!data.isControlledGoods) {
        return 'status.authorised';
    }
    return data.isPreLodged ? 'status.awaitingArrival' : 'status.arrived';
}

/**
 * Create and submit an SFD standalone consignment. One flow per standalone journey:
 * IMMI, SFD and FFD diverge at the consignment wizard and (for FFD) the goods wizard,
 * so each owns its own spine rather than branching inside a shared one.
 *
 * Composes other flows - it never drives a page directly. SFD is the only standalone
 * journey with no "Representation information" screen.
 */
export class CreateAndSubmitSfdStandaloneFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly initialFormFlow: InitialFormDeclarationFlow,
        private readonly addConsignmentFlow: AddNewSfdStandaloneConsignmentFlow,
        private readonly addGoodsItemFlow: AddNewSfdStandaloneGoodsItemFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        // The account this worker was assigned by the auth fixture - the same source
        // that picked the replayed session, so the report never names another account.
        private readonly authAccount: UserCredentials | null,
    ) { }

    async completeSfdStandaloneFlow(options: {
        testInfo: TestInfo;
        url: string;
        consignmentOverrides?: Partial<SfdStandaloneConsignmentData>;
        goodsItemOverrides?: Partial<GoodsData>;
    }): Promise<void> {
        const { testInfo, url } = options;
        const consignmentData = sfdStandaloneConsignment(options.consignmentOverrides);
        const goodsData = goods(options.goodsItemOverrides);

        reportTestAccount(this.authAccount, 'completeSfdStandaloneFlow');
        reportDeclarationCodes(goodsData);

        await this.accessFlow.openService({ baseUrl: url, testInfo });
        await this.initialFormFlow.completeInitialFormDeclaration(initialFormData({
            typeOfSubmission: INITIAL_FORM_DECLARATION.TYPE_OF_SUBMISSION.STANDALONE,
            standaloneDeclarationType: INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.SIMPLIFIED_DECLARATION,
            typeOfEnsSubmission: undefined,
        }));
        await this.addConsignmentFlow.addNewSfdStandaloneConsignment(consignmentData);
        // Report the LRN as soon as the draft exists, before anything that could fail.
        // The "SFD" prefix asserts the journey that actually ran rather than merely
        // that some standalone draft exists.
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentLrn(LOCAL_REFERENCE.DEC_PREFIX);
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);

        await this.addGoodsItemFlow.addNewSfdStandaloneGoodsItem(goodsData, {
            isControlledConsignment: consignmentData.isControlledGoods,
        });
        // Goods-item-overview tabs, declared while on the goods item's overview.
        await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
        await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);

        await this.consignmentOverviewFlow.submitConsignment();
        await this.verifyPostSubmit(consignmentData);
    }

    /**
     * Post-submit verification for standalone SFD: the consignment settles on a status
     * and is assigned an MRN.
     */
    private async verifyPostSubmit(consignmentData: SfdStandaloneConsignmentData): Promise<void> {
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            submittedStatusKey(consignmentData)
        );
        // One consignment, so one check - which one depends on the route. The EIDR route
        // has no MRN check yet (see verifySfdEidrDeclarationType); calling the SFD one
        // for it would read the same row and report whatever it holds as "SFD MRN".
        if (consignmentData.isControlledGoods) {
            await this.consignmentOverviewFlow.verifySfdConsignmentMrn();
            return;
        }
        await this.consignmentOverviewFlow.verifySfdEidrDeclarationType();
    }
}
