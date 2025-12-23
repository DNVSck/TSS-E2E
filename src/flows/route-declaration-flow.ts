import { RouteDeclarePage } from '../page-object/route-declare-page';
import { ReportLog } from '../core/report/ReportLog';

export class RouteDeclarationFlow {
    constructor(
        private readonly routeDeclarePage: RouteDeclarePage
    ) { }


    async completeRouteDeclaration(
        route: string,
        goodsMovementProcess: string,
        process: string
    ): Promise<void> {

        await ReportLog.step('Start declaration journey', async () => {
            await this.routeDeclarePage.startDeclareRouteJourney();
            console.log('Clicked on Start Now button 2');
        });

        await ReportLog.step('Complete route declaration', async () => {
            await this.routeDeclarePage.completeRouteDeclaration(
                route,
                goodsMovementProcess,
                process
            );
        });
    }
}
