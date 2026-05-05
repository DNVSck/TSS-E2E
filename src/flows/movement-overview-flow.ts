import { NewGoodsMovementDeclarePage } from "../page-object/new-goods-movement-declare-page";
import { ReportLog } from '../core/report/report-log';
import { MovementData } from "../test-data/movements";
import { DeclarationOverviewPage } from "../page-object/declaration-overview-page";
import { expect } from "../../tests/test-hooks";

export class MovementOverviewFlow {
    constructor(
        private readonly declarationOverviewPage: DeclarationOverviewPage,
    ) { }

    async MovementOverview(input: MovementData
    ): Promise<void> {

        await ReportLog.step('Validate goods movement overview', async () => {
            const localReferenceNumber = await this.declarationOverviewPage.getTextLocalReferenceNumber();
            const declarationStatus = await this.declarationOverviewPage.getTextDeclarationStatus();

            expect(localReferenceNumber).toBeTruthy();
            expect(localReferenceNumber.startsWith('ENS')).toBeTruthy();
            expect(localReferenceNumber.length).toBe(17);

            expect(declarationStatus).toBe('Draft');

        });
    }

}