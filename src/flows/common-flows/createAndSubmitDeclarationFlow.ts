import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../movement-header-declaration-flow';
import { MovementOverviewFlow } from '../movement-overview-flow';
import { initialFormData, InitialFormData } from '../../test-data/initial-form-data';
import { movement, MovementData } from '../../test-data/movements-data';
import { TestInfo } from '@playwright/test';
import { AddNewConsignmentFlow } from '../add-new-consignment-flow';
import { consignment, ConsignmentData } from '../../test-data/consignment-data';
import { AddNewGoodsItemFlow } from '../add-new-goods-item-flow';
import { goods, GoodsData } from '../../test-data/goods-data';

export class CreateAndSubmitEnsDeclarationFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly routeFlow: InitialFormDeclarationFlow,
        private readonly movementHeaderFlow: MovementHeaderDeclarationFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly addNewConsignmentFlow: AddNewConsignmentFlow,
        private readonly addNewGoodsItemFlow: AddNewGoodsItemFlow,
    ) { }

    /**
     * The signed-in company profile is chosen by the spec through
     * `test.use({ storageState: authStatePath(PROFILE) })`, not here — the sign-in
     * itself happens once, in globalSetup.
     */
    async completeEnsDeclarationFlow(
        testInfo: TestInfo,
        url: string,
        initialFormOverrides?: Partial<InitialFormData>,
        movementOverrides?: Partial<MovementData>,
        consignmentOverrides?: Partial<ConsignmentData>,
        goodsItemOverrides?: Partial<GoodsData>

    ): Promise<void> {
        const routeData = initialFormData(initialFormOverrides);
        const movementData = movement(movementOverrides);
        const consignmentData = consignment(consignmentOverrides);
        const goodsData = goods(goodsItemOverrides);

        // Each flow reports its own top-level step; re-wrapping here would add a
        // redundant nesting level with a second name for the same phase.
        await this.accessFlow.openService({ baseUrl: url, testInfo });
        await this.routeFlow.completeInitialFormDeclaration(routeData);
        await this.movementHeaderFlow.completeNewGoodsMovementDeclaration(movementData);
        await this.movementOverviewFlow.verifyDraftMovementOverview();
        await this.addNewConsignmentFlow.addNewEnsConsignment(consignmentData);
        await this.addNewGoodsItemFlow.addNewGoodsItem(goodsData);
    }
}
