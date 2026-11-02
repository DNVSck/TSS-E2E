import { TestInfo } from '@playwright/test';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { FfdStandaloneConsignmentData } from '../../test-data/ffd-standalone-consignment-data';
import { FfdH1GoodsData } from '../../test-data/ffd-standalone-goods-item-data';
import { MRN_COUNTRY_CODE } from '../../constant/local-reference-constants';
import { standaloneSubmittedStatusKey } from '../../helper/declaration-status-helper';
import { TranslationKey } from '../../fixtures/locale-fixture';
import { DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { CreateDraftFfdH1StandaloneFlow } from './create-draft-ffd-h1-standalone-flow';
import { TriggerFinalStatusThroughCdsFlow } from './trigger-final-status-through-cds-flow';
import { ReportLog } from '../../core/report/report-log';
import { DraftFfdStandaloneDeclaration, FfdGoodsItemsOptions } from './create-draft-ffd-standalone-flow';
import { CompletePaymentFlow } from '../payment/complete-payment-flow';
import { PaymentCardData } from '../../test-data/payment-card-data';
import { ConfirmDutyByTraderFlow } from './confirm-duty-by-trader-flow';

type SubmitDraftOptions = {
    testInfo: TestInfo;
    url: string;
    expectedStatusKey?: TranslationKey;
    expectsTir?: boolean;
    awaitingExternalPayment?: boolean;
    cardData?: PaymentCardData;
    confirmDutyByTraderFlow?: ConfirmDutyByTraderFlow;
};

type CompleteFfdH1Options = SubmitDraftOptions & {
    declaringForEori?: string;
    consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
};

export class CreateAndSubmitFfdH1StandaloneFlow {
    constructor(
        private readonly createDraftFfdH1StandaloneFlow: CreateDraftFfdH1StandaloneFlow,
        private readonly triggerFinalStatusThroughCdsFlow: TriggerFinalStatusThroughCdsFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly completePaymentFlow: CompletePaymentFlow,
    ) { }

    async readMrnAfterPayment(lrn: string): Promise<DeclarationIdentity> {
        const mrn = await this.consignmentOverviewFlow.verifyStandaloneConsignmentMrn('FFD', MRN_COUNTRY_CODE.FFD);
        return { lrn, mrn };
    }

    async declareAndClose(
        options: Omit<CompleteFfdH1Options, 'expectsTir' | 'awaitingExternalPayment'> & FfdGoodsItemsOptions<FfdH1GoodsData>
    ): Promise<DeclarationIdentity> {
        const { ffd, isPreLodged } = await ReportLog.step('Create and submit the FFD H1 standalone declaration', async () => {
            const draft = await this.createDraftFfdH1StandaloneFlow.createDraftFfdH1Standalone(options);
            await this.submitAndConfirmDraft(draft, options);
            return {
                ffd: await this.readMrnAfterPayment(draft.consignmentReference),
                isPreLodged: draft.consignmentData.isPreLodged,
            };
        });
        await this.triggerFinalStatusThroughCdsFlow.settleStandaloneFfd(ffd, isPreLodged);
        return ffd;
    }

    async completeFfdH1StandaloneFlow(
        options: CompleteFfdH1Options & FfdGoodsItemsOptions<FfdH1GoodsData>
    ): Promise<DeclarationIdentity | undefined> {
        const draft = await this.createDraftFfdH1StandaloneFlow.createDraftFfdH1Standalone(options);
        return this.submitDraft(draft, options);
    }

    async completeFfdH1StandaloneFlowWithGoodsCsv(options: {
        testInfo: TestInfo;
        url: string;
        declaringForEori?: string;
        consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
        expectedStatusKey?: TranslationKey;
    }, csvFile: string): Promise<DeclarationIdentity | undefined> {
        const draft = await this.createDraftFfdH1StandaloneFlow.createDraftFfdH1StandaloneWithGoodsCsv(options, csvFile);
        return this.submitDraft(draft, options);
    }

    private async submitDraft(
        draft: DraftFfdStandaloneDeclaration,
        options: SubmitDraftOptions,
    ): Promise<DeclarationIdentity | undefined> {
        await this.submitAndConfirmDraft(draft, options);
        if (options.expectsTir) {
            return undefined;
        }
        if (options.awaitingExternalPayment) {
            return { lrn: draft.consignmentReference, mrn: '' };
        }
        return this.readMrnAfterPayment(draft.consignmentReference);
    }

    private async submitAndConfirmDraft(
        { consignmentReference: lrn, consignmentData }: DraftFfdStandaloneDeclaration,
        options: SubmitDraftOptions,
    ): Promise<void> {
        const { expectedStatusKey, expectsTir, awaitingExternalPayment, cardData, confirmDutyByTraderFlow, url, testInfo } = options;
        await this.consignmentOverviewFlow.submitConsignment(expectedStatusKey);
        if (consignmentData.isPreLodged && !expectsTir && !awaitingExternalPayment) {
            if (confirmDutyByTraderFlow) {
                await confirmDutyByTraderFlow.confirmDuty(lrn, url, testInfo);
            } else {
                await this.consignmentOverviewFlow.confirmDutyCalculation();
                if (cardData) {
                    await this.completePaymentFlow.completeTssDdaPayment({ lrn, card: cardData });
                }
            }
        }
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            expectedStatusKey ?? standaloneSubmittedStatusKey(consignmentData.isPreLodged)
        );
    }
}
