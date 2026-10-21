import { expect } from '@playwright/test';
import { SupplementaryDeclarationOverviewPage } from '../../page-object/supplementary-declaration-overview-page';
import { ConsignmentOverviewPage } from '../../page-object/consignment-overview-page';
import { DeclarationAccessFlow } from '../declaration-access-flow';
import { ReportLog } from '../../core/report/report-log';
import { TFunction, TranslationKey } from '../../fixtures/locale-fixture';
import { verifyDeclarationStatus } from '../../helper/declaration-status-helper';
import { LinkedSupplementaryDeclaration } from './cancel-supplementary-declaration-flow';
import { AccessibilityCheckpoint } from '../accessibility-audit-flow';

export interface Reversal {
    declaration: LinkedSupplementaryDeclaration;
    originalStatusKey: TranslationKey;
    checkpoint?: AccessibilityCheckpoint;
}

export class RevertImmiDeclarationFlow {
    constructor(
        private readonly supplementaryOverviewPage: SupplementaryDeclarationOverviewPage,
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly declarationAccessFlow: DeclarationAccessFlow,
        private readonly t: TFunction,
    ) { }

    async revertToSupplementaryDeclaration(reversal: Reversal): Promise<void> {
        const { declaration, originalStatusKey, checkpoint } = reversal;

        await ReportLog.step('Revert the IMMI declaration to its supplementary declaration', async () => {
            expect(await this.consignmentOverviewPage.isReversalOffered(),
                'Revert to the supplementary declaration offered on the IMMI declaration where the trader lands (expects it)')
                .toBe(true);

            await this.consignmentOverviewPage.openReversal();
            await checkpoint?.('Converted IMMI - convert back to a supplementary declaration');

            expect(await this.consignmentOverviewPage.confirmReversal(),
                'Supplementary declaration the IMMI declaration reverted to (expects the one it was converted from)')
                .toBe(declaration.reference);
            verifyDeclarationStatus(
                await this.supplementaryOverviewPage.waitForStatus(originalStatusKey),
                this.t(originalStatusKey),
                'Supplementary declaration status once reverted'
            );
            expect.soft(await this.supplementaryOverviewPage.isConversionOffered(),
                'Convert to IMMI offered on a supplementary declaration already converted and reverted (expects none - one conversion only)')
                .toBe(false);
            await checkpoint?.('Supplementary declaration - overview (reverted)');
        });
    }

    async verifyReversalNotOffered(immiLrn: string, after: string): Promise<void> {
        await ReportLog.step(`Verify the IMMI declaration cannot be reverted once ${after}`, async () => {
            await this.declarationAccessFlow.openDeclarationFromSearch(immiLrn);
            expect(await this.consignmentOverviewPage.isReversalOffered(),
                `Revert to the supplementary declaration offered on an IMMI declaration ${after} (expects none)`)
                .toBe(false);
        });
    }
}
