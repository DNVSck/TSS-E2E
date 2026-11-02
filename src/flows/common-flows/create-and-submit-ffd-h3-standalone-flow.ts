import { TestInfo } from '@playwright/test';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { FfdStandaloneConsignmentData } from '../../test-data/ffd-standalone-consignment-data';
import { FfdH3GoodsData } from '../../test-data/ffd-standalone-goods-item-data';
import { MRN_COUNTRY_CODE } from '../../constant/local-reference-constants';
import { standaloneSubmittedStatusKey } from '../../helper/declaration-status-helper';
import { TranslationKey } from '../../fixtures/locale-fixture';
import { RENDER_TIMEOUT } from '../../constant/timeout-constant';
import { DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { CreateDraftFfdH3StandaloneFlow } from './create-draft-ffd-h3-standalone-flow';
import { TriggerFinalStatusThroughCdsFlow } from './trigger-final-status-through-cds-flow';
import { ReportLog } from '../../core/report/report-log';
import { DraftFfdStandaloneDeclaration, FfdGoodsItemsOptions } from './create-draft-ffd-standalone-flow';
import { ConfirmDutyByTraderFlow } from './confirm-duty-by-trader-flow';

export class CreateAndSubmitFfdH3StandaloneFlow {
    constructor(
        private readonly createDraftFfdH3StandaloneFlow: CreateDraftFfdH3StandaloneFlow,
        private readonly triggerFinalStatusThroughCdsFlow: TriggerFinalStatusThroughCdsFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
    ) { }

    async declareAndClose(
        options: Parameters<CreateAndSubmitFfdH3StandaloneFlow['completeFfdH3StandaloneFlow']>[0]
    ): Promise<DeclarationIdentity> {
        const { ffd, isPreLodged } = await ReportLog.step('Create and submit the FFD H3 standalone declaration', async () => {
            const draft = await this.createDraftFfdH3StandaloneFlow.createDraftFfdH3Standalone(options);
            return { ffd: await this.submitDraft(draft, options), isPreLodged: draft.consignmentData.isPreLodged };
        });
        await this.triggerFinalStatusThroughCdsFlow.settleStandaloneFfd(ffd, isPreLodged);
        return ffd;
    }

    async completeFfdH3StandaloneFlow(options: {
        testInfo: TestInfo;
        url: string;
        declaringForEori?: string;
        consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
        expectedStatusKey?: TranslationKey;
        confirmDutyByTraderFlow?: ConfirmDutyByTraderFlow;
    } & FfdGoodsItemsOptions<FfdH3GoodsData>): Promise<DeclarationIdentity> {
        const draft = await this.createDraftFfdH3StandaloneFlow.createDraftFfdH3Standalone(options);
        return this.submitDraft(draft, options);
    }

    private async submitDraft(
        { consignmentReference: lrn, consignmentData }: DraftFfdStandaloneDeclaration,
        options: {
            testInfo: TestInfo;
            url: string;
            expectedStatusKey?: TranslationKey;
            confirmDutyByTraderFlow?: ConfirmDutyByTraderFlow;
        },
    ): Promise<DeclarationIdentity> {
        const { expectedStatusKey, confirmDutyByTraderFlow, url, testInfo } = options;
        await this.consignmentOverviewFlow.submitConsignment();
        if (consignmentData.isPreLodged) {
            if (confirmDutyByTraderFlow) {
                await confirmDutyByTraderFlow.confirmDuty(lrn, url, testInfo);
            } else {
                await this.consignmentOverviewFlow.confirmDutyCalculation();
            }
        }
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            expectedStatusKey ?? standaloneSubmittedStatusKey(consignmentData.isPreLodged),
            RENDER_TIMEOUT.AUTHORISED_PROCEDURE_SETTLE
        );
        const mrn = await this.consignmentOverviewFlow.verifyStandaloneConsignmentMrn('FFD', MRN_COUNTRY_CODE.FFD);
        return { lrn, mrn };
    }
}
