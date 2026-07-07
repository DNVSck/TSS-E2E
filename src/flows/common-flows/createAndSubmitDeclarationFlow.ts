import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../movement-header-declaration-flow';
import { MovementOverviewFlow } from '../movement-overview-flow';
import { route, InitialFormData } from '../../test-data/initial-form-data';
import { movement, MovementData } from '../../test-data/movements-data';
import { TestInfo } from '@playwright/test';
import { AddNewConsignmentFlow } from '../add-new-consignment-flow';
import { consignment, ConsignmentData } from '../../test-data/consignment-data';
import { ReportLog } from '../../core/report/report-log';
import { AddNewGoodsItemFlow } from '../add-new-goods-item-flow';
import { goods, GoodsData } from '../../test-data/goods-data';
import { CompanyProfile } from '../../core/auth/credentials';

export class CreateAndSubmitEnsDeclarationFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly routeFlow: InitialFormDeclarationFlow,
        private readonly movementHeaderFlow: MovementHeaderDeclarationFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly addNewConsignmentFlow: AddNewConsignmentFlow,
        private readonly addNewGoodsItemFlow: AddNewGoodsItemFlow,
    ) { }

    async completeEnsDeclarationFlow(
        testInfo: TestInfo,
        url: string,
        profile: CompanyProfile,
        routeOverrides?: Partial<InitialFormData>,
        movementOverrides?: Partial<MovementData>,
        consignmentOverrides?: Partial<ConsignmentData>,
        goodsItemOverrides?: Partial<GoodsData>

    ): Promise<void> {
        const routeData = route(routeOverrides);
        const movementData = movement(movementOverrides);
        const consignmentData = consignment(consignmentOverrides);
        const goodsData = goods(goodsItemOverrides);

        await ReportLog.step('Start Login to Portal', async () => {
            await this.accessFlow.accessService({
                baseUrl: url,
                testInfo,
                profile,
            })
        });

        await ReportLog.step('Start Initial Form Declaration', async () => {
            await this.routeFlow.completeInitialFormDeclaration(route(routeData));
        });
        await ReportLog.step('Start Movement Header Declaration', async () => {
            await this.movementHeaderFlow.completeNewGoodsMovementDeclaration(movementData);
        });
        await ReportLog.step('Verify data at Movement Overview', async () => {
            await this.movementOverviewFlow.MovementOverview(movementData);
        });
        await ReportLog.step('Start Add New Consignment', async () => {
            await this.addNewConsignmentFlow.AddNewENSConsignment(consignmentData);
        });
        await ReportLog.step('Start Add New Goods Item', async () => {
            await this.addNewGoodsItemFlow.addNewGoodsItem(goodsData);
        });
    }
}
