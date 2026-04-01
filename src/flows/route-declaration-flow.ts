import { MovementHeaderDeclarePage } from '../page-object/initial-form-declare-page';
import { ReportLog } from '../core/report/ReportLog';

export class RouteDeclarationFlow {
    constructor(
        private readonly MovementHeaderDeclarePage: MovementHeaderDeclarePage
    ) { }


    async completeRouteDeclaration(
        route: string,
        goodsMovementProcess: string,
        process: string,
        howToStart: string
    ): Promise<void> {

        await ReportLog.step('Start declaration journey', async () => {
            await this.MovementHeaderDeclarePage.startDeclareRouteJourney();
        });

        await ReportLog.step('Complete route declaration', async () => {
            await this.MovementHeaderDeclarePage.completeRouteDeclaration(
                route,
                goodsMovementProcess,
                process,
                howToStart
            );
        });
    }
}
