import { TestInfo } from '@playwright/test';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewStandaloneConsignmentFlow, standaloneReferencePrefix } from '../add-new-standalone-consignment-flow';
import { AddNewStandaloneGoodsItemFlow } from '../add-new-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-overview-flow';
import { StandaloneConsignmentData } from '../../test-data/standalone-consignment-data';
import { GoodsData, goods } from '../../test-data/goods-data';
import { initialFormData } from '../../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../../constant/initial-form-declaration-constants';
import { ReportLog } from '../../core/report/report-log';
import { UserCredentials } from '../../core/auth/credentials';

/**
 * Create and submit a standalone consignment (IMMI / SFD / FFD). The journey is
 * chosen entirely by the consignment data the spec passes (see the immi/sfd/ffd
 * factories), so one flow serves all three.
 *
 * Composes other flows - it never drives a page directly (each phase is owned by
 * the flow that models it). Runs as the Agent's OWN company: standalone journeys
 * do NOT represent a trader.
 */
export class CreateAndSubmitStandaloneFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly initialFormFlow: InitialFormDeclarationFlow,
        private readonly addStandaloneConsignmentFlow: AddNewStandaloneConsignmentFlow,
        private readonly addStandaloneGoodsItemFlow: AddNewStandaloneGoodsItemFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        // The account this worker was assigned by the auth fixture - the same source
        // that picked the replayed session, so the report never names another account.
        private readonly authAccount: UserCredentials | null,
    ) { }

    async completeStandaloneFlow(options: {
        testInfo: TestInfo;
        url: string;
        consignmentData: StandaloneConsignmentData;
        goodsItemOverrides?: Partial<GoodsData>;
    }): Promise<void> {
        const { testInfo, url, consignmentData } = options;
        const goodsData = goods(options.goodsItemOverrides);

        this.reportTestAccount();

        await this.accessFlow.openService({ baseUrl: url, testInfo });
        await this.initialFormFlow.completeInitialFormDeclaration(initialFormData({
            typeOfSubmission: INITIAL_FORM_DECLARATION.TYPE_OF_SUBMISSION.STANDALONE,
            standaloneDeclarationType: consignmentData.standaloneDeclarationType,
            typeOfEnsSubmission: undefined,
        }));
        await this.addStandaloneConsignmentFlow.addNewStandaloneConsignment(consignmentData);
        // Report the LRN as soon as the draft exists, before anything that could fail.
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentLrn(
            standaloneReferencePrefix(consignmentData.standaloneDeclarationType),
        );
        // Consignment-overview tabs, declared before the goods item (no-op on empty lists).
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);

        await this.addStandaloneGoodsItemFlow.addNewStandaloneGoodsItem(goodsData);
        // Goods-item-overview tabs, declared while on the goods item's overview.
        await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
        await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);

        await this.consignmentOverviewFlow.submitConsignment();
        // Post-submit: the status must flip to "Awaiting arrival".
        // NOSONAR - TODO: re-enable this once when Standalone consignments overview has Status field 
        // await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted();
    }

    private reportTestAccount(): void {
        if (!this.authAccount) {
            throw new Error(
                'completeStandaloneFlow ran without an authenticated account - ' +
                'the spec must set test.use({ authProfile: ... }).'
            );
        }

        const { username, profile, accountNumber } = this.authAccount;
        ReportLog.setParameter('Test account', `${username} (${profile} account ${accountNumber ?? 1})`);
    }
}
