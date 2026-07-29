import { TestInfo } from '@playwright/test';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewSfdStandaloneConsignmentFlow } from '../add-new-sfd-standalone-consignment-flow';
import { AddNewSfdStandaloneGoodsItemFlow } from '../add-new-sfd-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-overview-flow';
import {
    SfdStandaloneConsignmentData, sfdStandaloneConsignment,
} from '../../test-data/sfd-standalone-consignment-data';
import { GoodsData, goods } from '../../test-data/goods-data';
import { initialFormData } from '../../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../../constant/initial-form-declaration-constants';
import { LOCAL_REFERENCE } from '../../constant/local-reference-constants';
import { UserCredentials } from '../../auth/credentials';
import { reportTestAccount } from '../../helper/report-helper';

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
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentLrn(LOCAL_REFERENCE.SFD_PREFIX);
        // Consignment-overview tabs, declared before the goods item (no-op on empty lists).
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);

        await this.addGoodsItemFlow.addNewSfdStandaloneGoodsItem(goodsData);
        // Goods-item-overview tabs, declared while on the goods item's overview.
        await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
        await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);

        await this.consignmentOverviewFlow.submitConsignment();
        // NOSONAR
        // TODO: submitting an SFD standalone consignment also auto-generates a linked
        // EIDR consignment. Verify it here (the ENS flow's verifyPostSubmit is the
        // model) once it is known where a standalone journey surfaces it - there is no
        // movement overview to reach it from.
    }
}
