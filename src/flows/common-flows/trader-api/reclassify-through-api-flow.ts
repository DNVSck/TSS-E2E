import { SupplementaryDeclarationService } from '../../../api-service/trader-api/supplementary-declaration-service';
import { InternalMarketMovementService } from '../../../api-service/trader-api/internal-market-movement-service';
import { ReportLog } from '../../../core/report/report-log';
import { waitForDeclarationStatus, waitForImmiStatus } from '../../../helper/declaration-status-helper';

const REVERSAL_SETTLES_TIMEOUT = 60_000;

export class ReclassifyThroughApiFlow {
    constructor(
        private readonly supplementaryDeclarationService: SupplementaryDeclarationService,
        private readonly internalMarketMovementService: InternalMarketMovementService,
    ) { }

    async convertToImmi(reference: string, expectedImmiStatus: string): Promise<string> {
        return ReportLog.step(`Convert supplementary declaration ${reference} to an IMMI declaration through the Trader API`, async () => {
            const immiLrn = await this.supplementaryDeclarationService.reclassifyToImmi(reference);
            await waitForImmiStatus(this.internalMarketMovementService, immiLrn, expectedImmiStatus);
            return immiLrn;
        });
    }

    async revertToSupplementaryDeclaration(immiLrn: string, reference: string, expectedSdStatus: string): Promise<void> {
        await ReportLog.step(`Revert IMMI ${immiLrn} to supplementary declaration ${reference} through the Trader API`, async () => {
            await this.internalMarketMovementService.reclassifyToSupplementaryDeclaration(immiLrn);

            await waitForDeclarationStatus({
                what: `Supplementary declaration ${reference} once reverted`,
                expected: expectedSdStatus,
                timeout: REVERSAL_SETTLES_TIMEOUT,
                unread: { status: '' },
                read: async () => ({ status: await this.supplementaryDeclarationService.readStatus(reference) }),
            });
        });
    }
}
