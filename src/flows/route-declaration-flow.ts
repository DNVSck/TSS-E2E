import { InitialFormDeclaraPage } from '../page-object/initial-form-declare-page';
import { ReportLog } from '../core/report/report-log';

export class RouteDeclarationFlow {
    constructor(
        private readonly initialFormDeclaraPage: InitialFormDeclaraPage
    ) { }

    
    async completeRouteDeclaration(
        input: {
            route: string;
            goodsMovementProcess: string;
            process: string;
            howToStart: string;
        }
    ): Promise<void> {

        await ReportLog.step('Start declaration journey', async () => {
            await this.initialFormDeclaraPage.startDeclareRouteJourney();
        });

        await ReportLog.step('Complete Initial form', async () => {
            const { route, goodsMovementProcess, process, howToStart } = input;
            await this.initialFormDeclaraPage.routeDeclaration(
                route,
                goodsMovementProcess,
                process,
                howToStart
            );
        });
    }
}
