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
import { DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { LOCAL_REFERENCE, MRN_COUNTRY_CODE } from '../../constant/local-reference-constants';
import { TranslationKey } from '../../fixtures/locale-fixture';
import { standaloneSubmittedStatusKey } from '../../helper/consignment-status-helper';

/**
 * The status a submitted SFD standalone consignment settles on.
 *
 * The EIDR route (controlled goods = No) is this journey's ONE exception to the rule
 * every standalone journey otherwise follows: it is authorised outright, whether the
 * movement was pre-lodged or arrived, because it has no arrival to wait for. Only that
 * exception is stated here; the rest defers to standaloneSubmittedStatusKey, so the
 * shared rule has one home and this file says only what is peculiar to SFD.
 */
function submittedStatusKey(data: SfdStandaloneConsignmentData): TranslationKey {
    if (!data.isControlledGoods) {
        return 'status.authorised';
    }
    return standaloneSubmittedStatusKey(data.isPreLodged);
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
    }): Promise<DeclarationIdentity | undefined> {
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
        const lrn = await this.consignmentOverviewFlow
            .verifyStandaloneConsignmentLrn(LOCAL_REFERENCE.DEC_PREFIX);
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);

        await this.addGoodsItemFlow.addNewSfdStandaloneGoodsItem(goodsData, {
            isControlledConsignment: consignmentData.isControlledGoods,
        });
        // Goods-item-overview tabs, declared while on the goods item's overview.
        await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
        await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);

        await this.consignmentOverviewFlow.submitConsignment();
        const mrn = await this.verifyPostSubmit(consignmentData);

        // Undefined on the EIDR route, which has no MRN and needs no CDS response.
        return mrn ? { lrn, mrn } : undefined;
    }

    /**
     * Post-submit verification for standalone SFD: the consignment settles on a status
     * and is assigned an MRN.
     */
    private async verifyPostSubmit(
        consignmentData: SfdStandaloneConsignmentData
    ): Promise<string | undefined> {
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            submittedStatusKey(consignmentData)
        );
        // One consignment, so one check - which one depends on the route. The EIDR route
        // has no MRN check yet (see verifySfdEidrDeclarationType); calling the SFD one
        // for it would read the same row and report whatever it holds as "SFD MRN".
        if (consignmentData.isControlledGoods) {
            return this.consignmentOverviewFlow
                .verifyStandaloneConsignmentMrn('SFD', MRN_COUNTRY_CODE.SFD);
        }

        // The EIDR route returns nothing to name to CDS, and needs nothing: it is
        // authorised outright, with no MRN and no arrival to wait for.
        await this.consignmentOverviewFlow.verifySfdEidrDeclarationType();
        return undefined;
    }
}
