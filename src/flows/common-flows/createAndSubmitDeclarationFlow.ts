import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../movement-header-declaration-flow';
import { MovementOverviewFlow } from '../movement-overview-flow';
import { route, InitialFormData } from '../../test-data/initial-form-data';
import { movement, MovementData } from '../../test-data/movements-data';
import { TestInfo } from '@playwright/test';

export class CreateAndSubmitEnsDeclarationFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly routeFlow: InitialFormDeclarationFlow,
        private readonly movementHeaderFlow: MovementHeaderDeclarationFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
    ) { }

    async completeEnsDeclarationFlow(
        testInfo: TestInfo,
        url: string,
        expectedTitle: string,
        routeOverrides?: Partial<InitialFormData>,
        movementOverrides?: Partial<MovementData>
    ): Promise<void> {
        const movementData = movement(movementOverrides);

        await this.accessFlow.accessServiceAsAdmin({
            baseUrl: url,
            testInfo,
            expectedTitle,
        });
        await this.routeFlow.completeInitialFormDeclaration(route(routeOverrides));
        await this.movementHeaderFlow.completeNewGoodsMovementDeclaration(movementData);
        await this.movementOverviewFlow.MovementOverview(movementData);
    }
}
