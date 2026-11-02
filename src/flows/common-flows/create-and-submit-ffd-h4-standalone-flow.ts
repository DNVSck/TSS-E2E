import { TestInfo } from '@playwright/test';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { FfdStandaloneConsignmentData } from '../../test-data/ffd-standalone-consignment-data';
import { FfdH4GoodsData } from '../../test-data/ffd-standalone-goods-item-data';
import { MRN_COUNTRY_CODE } from '../../constant/local-reference-constants';
import { standaloneSubmittedStatusKey } from '../../helper/declaration-status-helper';
import { TranslationKey } from '../../fixtures/locale-fixture';
import { RENDER_TIMEOUT } from '../../constant/timeout-constant';
import { DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { CreateDraftFfdH4StandaloneFlow } from './create-draft-ffd-h4-standalone-flow';
import { TriggerFinalStatusThroughCdsFlow } from './trigger-final-status-through-cds-flow';
import { ReportLog } from '../../core/report/report-log';
import { DraftFfdStandaloneDeclaration } from './create-draft-ffd-standalone-flow';

export class CreateAndSubmitFfdH4StandaloneFlow {
    constructor(
        private readonly createDraftFfdH4StandaloneFlow: CreateDraftFfdH4StandaloneFlow,
        private readonly triggerFinalStatusThroughCdsFlow: TriggerFinalStatusThroughCdsFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
    ) { }

    async declareAndClose(
        options: Parameters<CreateAndSubmitFfdH4StandaloneFlow['completeFfdH4StandaloneFlow']>[0]
    ): Promise<DeclarationIdentity> {
        const { ffd, isPreLodged } = await ReportLog.step('Create and submit the FFD H4 standalone declaration', async () => {
            const draft = await this.createDraftFfdH4StandaloneFlow.createDraftFfdH4Standalone(options);
            return { ffd: await this.submitDraft(draft, options.expectedStatusKey), isPreLodged: draft.consignmentData.isPreLodged };
        });
        await this.triggerFinalStatusThroughCdsFlow.settleStandaloneFfd(ffd, isPreLodged);
        return ffd;
    }

    async completeFfdH4StandaloneFlow(options: {
        testInfo: TestInfo;
        url: string;
        declaringForEori?: string;
        consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
        goodsItemOverrides?: Partial<FfdH4GoodsData>;
        expectedStatusKey?: TranslationKey;
    }): Promise<DeclarationIdentity> {
        const draft = await this.createDraftFfdH4StandaloneFlow.createDraftFfdH4Standalone(options);
        return this.submitDraft(draft, options.expectedStatusKey);
    }

    private async submitDraft(
        { consignmentReference: lrn, consignmentData }: DraftFfdStandaloneDeclaration,
        expectedStatusKey?: TranslationKey,
    ): Promise<DeclarationIdentity> {
        await this.consignmentOverviewFlow.submitConsignment();
        // H4 (inward processing) suspends duties at IP entry — no duty calculation
        // confirmation screen, even for pre-lodged movements.
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            expectedStatusKey ?? standaloneSubmittedStatusKey(consignmentData.isPreLodged),
            RENDER_TIMEOUT.AUTHORISED_PROCEDURE_SETTLE
        );
        const mrn = await this.consignmentOverviewFlow.verifyStandaloneConsignmentMrn('FFD', MRN_COUNTRY_CODE.FFD);
        return { lrn, mrn };
    }
}
