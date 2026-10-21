import { expect } from '@playwright/test';
import { SupplementaryDeclarationOverviewPage } from '../../page-object/supplementary-declaration-overview-page';
import { ConsignmentDetailPage } from '../../page-object/consignment-detail-page';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import { AddNewImmiStandaloneGoodsItemFlow } from '../goods-item/add-new-immi-standalone-goods-item-flow';
import { DeclarationAccessFlow } from '../declaration-access-flow';
import { ReportLog } from '../../core/report/report-log';
import { TFunction, TranslationKey } from '../../fixtures/locale-fixture';
import { standaloneSubmittedStatusKey, verifyDeclarationStatus } from '../../helper/declaration-status-helper';
import { LOCAL_REFERENCE, MRN_COUNTRY_CODE } from '../../constant/local-reference-constants';
import { DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { LinkedSupplementaryDeclaration } from './cancel-supplementary-declaration-flow';
import { AccessibilityCheckpoint } from '../accessibility-audit-flow';
import { TgpRecordData } from '../../test-data/tgp-record-data';
import { goods } from '../../test-data/goods-data';
import { IMPORTER_EORI } from '../../../config/environment';

export interface ConvertedGoodsItemUpdate {
    additionalProcedureCode: string;
    tgp?: { record: TgpRecordData; procedureCode: string };
    useNirms?: boolean;
}

export interface ConvertedImmiUpdate extends ConvertedGoodsItemUpdate {
    additionalProcedureCodes?: string[];
    representationType?: string;
}

export class ConvertSupplementaryDeclarationFlow {
    constructor(
        private readonly overviewPage: SupplementaryDeclarationOverviewPage,
        private readonly consignmentDetailPage: ConsignmentDetailPage,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly goodsItemFlow: AddNewImmiStandaloneGoodsItemFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        private readonly declarationAccessFlow: DeclarationAccessFlow,
        private readonly t: TFunction,
    ) { }

    async convertToImmi(checkpoint?: AccessibilityCheckpoint): Promise<string> {
        return ReportLog.step('Convert the supplementary declaration to an IMMI declaration', async () => {
            await checkpoint?.('Supplementary declaration - overview (convertible)');
            await this.overviewPage.openConversion();
            await checkpoint?.('Supplementary declaration - convert to an IMMI declaration');
            await this.overviewPage.confirmConversion();

            const lrn = await this.consignmentOverviewFlow.verifyStandaloneConsignmentLrn(LOCAL_REFERENCE.GLR_PREFIX);
            await this.consignmentOverviewFlow.verifyConsignmentOverviewStatus('status.draft');
            return lrn;
        });
    }

    async completeConvertedImmi(
        lrn: string,
        update: ConvertedImmiUpdate,
        expectedStatusKey?: TranslationKey
    ): Promise<DeclarationIdentity> {
        if (update.representationType) {
            await this.consignmentOverviewFlow.declareRepresentationType(update.representationType);
        }

        await this.updateConvertedGoodsItem(update);
        await this.goodsOverviewFlow.declareAdditionalProcedureCodes(update.additionalProcedureCodes ?? []);

        await this.consignmentOverviewFlow.submitConsignment(expectedStatusKey);
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            expectedStatusKey ?? standaloneSubmittedStatusKey(false)
        );

        if (expectedStatusKey) {
            return { lrn, mrn: '' };
        }

        const mrn = await this.consignmentOverviewFlow.verifyStandaloneConsignmentMrn('IMMI', MRN_COUNTRY_CODE.IMMI);
        return { lrn, mrn };
    }

    async updateConvertedGoodsItem(
        update: ConvertedGoodsItemUpdate,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        const input = goods({
            additionalProcedureCode: update.additionalProcedureCode,
            useNirms: update.useNirms ?? false,
            ...(update.tgp && {
                useTGP: true, tgpRecord: update.tgp.record, procedureCode: update.tgp.procedureCode,
            }),
        });

        await this.consignmentOverviewFlow.openGoodsItem();
        const usesTgp = await this.goodsItemFlow.changeGoodsItem(input, IMPORTER_EORI, checkpoint);

        await this.goodsOverviewFlow.verifyTgpPopulatedFields(
            usesTgp ? input.tgpRecord : undefined, input.additionalProcedureCode
        );
        if (input.useNirms) {
            await this.goodsOverviewFlow.verifyImmiNirmsDocumentReference();
        }
    }

    async verifySourceAfterConversion(declaration: LinkedSupplementaryDeclaration): Promise<void> {
        await ReportLog.step('Verify the supplementary declaration is converted and its SFD is untouched', async () => {
            await this.declarationAccessFlow.openDeclarationFromSearch(declaration.reference);
            verifyDeclarationStatus(
                await this.overviewPage.waitForStatus('status.converted'),
                this.t('status.converted'),
                'Supplementary declaration status once converted'
            );

            await this.declarationAccessFlow.openDeclarationFromSearch(declaration.frontierLrn);
            verifyDeclarationStatus(
                await this.consignmentDetailPage.waitForStatus('status.arrived'),
                this.t('status.arrived'),
                `Linked SFD ${declaration.frontierLrn} status once its supplementary declaration is converted`
            );
        });
    }

    async verifyConversionNotOffered(reference: string, after: string): Promise<void> {
        await ReportLog.step(`Verify the supplementary declaration cannot be converted once ${after}`, async () => {
            await this.declarationAccessFlow.openDeclarationFromSearch(reference);
            expect(await this.overviewPage.isConversionOffered(), `Convert to IMMI offered on a supplementary declaration ${after} (expects none)`)
                .toBe(false);
        });
    }
}
