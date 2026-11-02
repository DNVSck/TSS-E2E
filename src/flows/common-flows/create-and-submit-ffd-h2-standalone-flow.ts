import { TestInfo } from '@playwright/test';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { FfdStandaloneConsignmentData } from '../../test-data/ffd-standalone-consignment-data';
import { FfdH2GoodsData } from '../../test-data/ffd-standalone-goods-item-data';
import { MRN_COUNTRY_CODE } from '../../constant/local-reference-constants';
import { standaloneSubmittedStatusKey } from '../../helper/declaration-status-helper';
import { DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { CreateDraftFfdH2StandaloneFlow } from './create-draft-ffd-h2-standalone-flow';
import { TriggerFinalStatusThroughCdsFlow } from './trigger-final-status-through-cds-flow';
import { ReportLog } from '../../core/report/report-log';
import { DraftFfdStandaloneDeclaration } from './create-draft-ffd-standalone-flow';

export class CreateAndSubmitFfdH2StandaloneFlow {
    constructor(
        private readonly createDraftFfdH2StandaloneFlow: CreateDraftFfdH2StandaloneFlow,
        private readonly triggerFinalStatusThroughCdsFlow: TriggerFinalStatusThroughCdsFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
    ) { }

    async declareAndClose(
        options: Parameters<CreateAndSubmitFfdH2StandaloneFlow['completeFfdH2StandaloneFlow']>[0]
    ): Promise<DeclarationIdentity> {
        const { ffd, isPreLodged } = await ReportLog.step('Create and submit the FFD H2 standalone declaration', async () => {
            const draft = await this.createDraftFfdH2StandaloneFlow.createDraftFfdH2Standalone(options);
            return { ffd: await this.submitDraft(draft), isPreLodged: draft.consignmentData.isPreLodged };
        });
        await this.triggerFinalStatusThroughCdsFlow.settleStandaloneFfd(ffd, isPreLodged);
        return ffd;
    }

    async completeFfdH2StandaloneFlow(options: {
        testInfo: TestInfo;
        url: string;
        consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
        goodsItemOverrides?: Partial<FfdH2GoodsData>;
    }): Promise<DeclarationIdentity> {
        const draft = await this.createDraftFfdH2StandaloneFlow.createDraftFfdH2Standalone(options);
        return this.submitDraft(draft);
    }

    private async submitDraft(
        { consignmentReference: lrn, consignmentData }: DraftFfdStandaloneDeclaration,
    ): Promise<DeclarationIdentity> {
        await this.consignmentOverviewFlow.submitConsignment();
        // H2 (customs warehousing) suspends duties at warehouse entry — no duty
        // calculation confirmation screen, even for pre-lodged movements.
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            standaloneSubmittedStatusKey(consignmentData.isPreLodged)
        );
        const mrn = await this.consignmentOverviewFlow.verifyStandaloneConsignmentMrn('FFD', MRN_COUNTRY_CODE.FFD);
        return { lrn, mrn };
    }
}
