import { test } from '@playwright/test';
import { PortalAccessFlow } from '../flows/portal-access-flow';
import { RouteDeclarationFlow } from '../flows/route-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../flows/movement-header-declaration-flow';
import { NewGoodsMovementTransportDetailsFlow } from '../flows/new-goods-movement-transport-details-flow';
import { NewGoodsMovementMovementDetailsFlow } from '../flows/new-goods-movement-movement-details-flow';
import { NewGoodsMovementLoadingDetailsFlow } from '../flows/new-goods-movement-loading-details-flow';
import { MovementOverviewFlow } from '../flows/movement-overview-flow';
import { PageFixtureType } from './page-fixture';
import { GBNiRoRoSimpleAccoFlow } from '../flows/common-flows/gb-ni-roro-simplified-flow';

export type FlowFixtureType = {
    gbNiRoRoSimpleAccoFlow: GBNiRoRoSimpleAccoFlow;
}

type ExtendParams = Parameters<typeof test.extend<FlowFixtureType & PageFixtureType>>;

export const flowFixture: ExtendParams[0] = {
    gbNiRoRoSimpleAccoFlow: async ({ basePage, portalPage, signInPage, initialFormDeclaraPage, goodsMovementTaskListPage, newGoodsMovementDeclarePage, declarationOverviewPage }, use) => {
        await use(new GBNiRoRoSimpleAccoFlow(
            new PortalAccessFlow(basePage, portalPage, signInPage),
            new RouteDeclarationFlow(initialFormDeclaraPage),
            new MovementHeaderDeclarationFlow(goodsMovementTaskListPage),
            new NewGoodsMovementTransportDetailsFlow(newGoodsMovementDeclarePage),
            new NewGoodsMovementMovementDetailsFlow(newGoodsMovementDeclarePage),
            new NewGoodsMovementLoadingDetailsFlow(newGoodsMovementDeclarePage),
            new MovementOverviewFlow(declarationOverviewPage),
        ));
    },
};