import { InitialFormDeclaraPage } from '../page-object/initial-form-declare-page';
import { ReportLog } from '../core/report/report-log';
import { InitialFormData } from '../test-data/initial-form-data';

export class InitialFormDeclarationFlow {
    constructor(
        private readonly initialFormDeclaraPage: InitialFormDeclaraPage
    ) { }

    async completeInitialFormDeclaration(input: InitialFormData): Promise<void> {
        await this.startDeclarationJourney();
        await this.completeInitialForm(input);
    }

    private async startDeclarationJourney(): Promise<void> {
        await ReportLog.step('Start declaration journey', async () => {
            await this.initialFormDeclaraPage.startDeclareRouteJourney();
        });
    }

    private async completeInitialForm(input: InitialFormData): Promise<void> {
        await ReportLog.step('Complete Initial form', async () => {
            await this.initialFormDeclaraPage.selectRouteAndProcess(input);
        });
    }
}
