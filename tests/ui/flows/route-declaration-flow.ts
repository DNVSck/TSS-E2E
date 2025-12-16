import { RouteDeclarePage } from '../../../src/page-object/route-declare-page';
import { ReportLog } from '../../../src/core/report/ReportLog';

export class RouteDeclarationFlow {
    constructor(
        private readonly routeDeclarePage: RouteDeclarePage
    ) { }

    async completeRouteDeclaration(
        route: string,
        goodsMovementProcess: string,
        process: string
    ): Promise<void> {

        await ReportLog.step('Complete route declaration', async () => {
            await this.routeDeclarePage.completeRouteDeclaration(
                route,
                goodsMovementProcess,
                process
            );
        });
    }
}
