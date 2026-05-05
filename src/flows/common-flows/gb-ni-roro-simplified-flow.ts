import { PortalAccessFlow } from '../portal-access-flow';
import { RouteDeclarationFlow } from '../route-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../movement-header-declaration-flow';
import { NewGoodsMovementTransportDetailsFlow } from '../new-goods-movement-transport-details-flow';
import { NewGoodsMovementMovementDetailsFlow } from '../new-goods-movement-movement-details-flow';
import { NewGoodsMovementLoadingDetailsFlow } from '../new-goods-movement-loading-details-flow';
import { MovementOverviewFlow } from '../movement-overview-flow';
import { route, RouteData } from '../../test-data/route';
import { movement, MovementData } from '../../test-data/movements';
import { TestInfo } from '@playwright/test';

export class GBNiRoRoSimpleAccoFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly routeFlow: RouteDeclarationFlow,
        private readonly movementHeaderFlow: MovementHeaderDeclarationFlow,
        private readonly transportDetailsFlow: NewGoodsMovementTransportDetailsFlow,
        private readonly movementDetailsFlow: NewGoodsMovementMovementDetailsFlow,
        private readonly loadingDetailsFlow: NewGoodsMovementLoadingDetailsFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
    ) { }

    async completeGbToNiRoRoSimpleAcco(
        testInfo: TestInfo,
        url: string,
        expectedTitle: string,
        routeOverrides?: Partial<RouteData>,
        movementOverrides?: Partial<MovementData>
    ): Promise<void> {
        const movementData = movement(movementOverrides);

        await this.accessFlow.accessServiceAsAdmin(url, testInfo, expectedTitle);
        await this.routeFlow.completeRouteDeclaration(route(routeOverrides));
        await this.movementHeaderFlow.completeMovementHeaderDeclaration(movementData);
        await this.transportDetailsFlow.NewGoodsMovementTransportDetails(movementData);
        await this.movementDetailsFlow.NewGoodsMovementMovementDetails(movementData);
        await this.loadingDetailsFlow.NewGoodsMovementLoadingDetails(movementData);
        await this.movementOverviewFlow.MovementOverview(movementData);
    }
}