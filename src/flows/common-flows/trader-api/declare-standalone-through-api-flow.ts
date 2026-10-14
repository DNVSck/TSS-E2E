import { TraderApiClient } from '../../../api-client/trader-api-client';
import { InternalMarketMovementService } from '../../../api-service/trader-api/internal-market-movement-service';
import { GoodsService } from '../../../api-service/trader-api/goods-service';
import {
    ImmiStandaloneConsignmentData, immiStandaloneConsignment,
} from '../../../test-data/immi-standalone-consignment-data';
import { GoodsData, goods } from '../../../test-data/goods-data';
import { immiStandaloneGoodsPayload, immiStandalonePayload } from '../../../helper/api-payload-helper';
import { waitForImmiStatus } from '../../../helper/declaration-status-helper';
import { attachRequest } from '../../../helper/report-helper';
import { ReportLog } from '../../../core/report/report-log';

export interface DeclareStandaloneOptions<C> {
    consignmentOverrides?: Partial<C>;
    goodsItemOverrides?: Partial<GoodsData>;
    representingCompanyId?: string;
}

export class DeclareStandaloneThroughApiFlow {
    constructor(
        private readonly traderApi: TraderApiClient,
        private readonly immiService: InternalMarketMovementService,
        private readonly goodsService: GoodsService,
    ) { }

    async declareImmiStandaloneDraft(
        options: DeclareStandaloneOptions<ImmiStandaloneConsignmentData> = {}
    ): Promise<string> {
        return this.traderApi.whileRepresenting(options.representingCompanyId, () =>
            this.createImmiStandalone(options)
        );
    }

    async declareAndSubmitImmiStandalone(
        options: DeclareStandaloneOptions<ImmiStandaloneConsignmentData>,
        expectedStatus: string
    ): Promise<string> {
        return this.traderApi.whileRepresenting(options.representingCompanyId, async () => {
            const glrNumber = await this.createImmiStandalone(options);

            await ReportLog.step(`Submit IMMI ${glrNumber}`, () => this.immiService.submitImmi(glrNumber));
            await ReportLog.step(`Wait for IMMI ${glrNumber} to reach "${expectedStatus}"`, () =>
                waitForImmiStatus(this.immiService, glrNumber, expectedStatus)
            );

            return glrNumber;
        });
    }

    private async createImmiStandalone(
        options: DeclareStandaloneOptions<ImmiStandaloneConsignmentData>
    ): Promise<string> {
        const consignmentData = immiStandaloneConsignment(options.consignmentOverrides);
        const goodsData = goods(options.goodsItemOverrides);

        const glrNumber = await ReportLog.step('Create the standalone IMMI through the Trader API', async () => {
            const payload = immiStandalonePayload(consignmentData);
            attachRequest('Standalone IMMI', payload);
            return this.immiService.createImmi(payload);
        });

        await ReportLog.step(`Add a goods item to ${glrNumber}`, async () => {
            const payload = immiStandaloneGoodsPayload(glrNumber, goodsData);
            attachRequest('Goods item', payload);
            await this.goodsService.createGoodsItem(payload);
        });

        return glrNumber;
    }
}
