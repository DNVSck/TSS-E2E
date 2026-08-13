import { InitialFormDeclaraPage } from '../page-object/initial-form-declare-page';
import { ReportLog } from '../core/report/report-log';
import { InitialFormData } from '../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../constant/initial-form-declaration-constants';

export class InitialFormDeclarationFlow {
    constructor(
        private readonly initialFormDeclaraPage: InitialFormDeclaraPage
    ) { }

    async completeInitialFormDeclaration(input: InitialFormData): Promise<void> {
        await ReportLog.step('Complete Initial form', async () => {
            await this.selectDirectionOfDeclaration(input);
            await this.selectTypeOfSubmission(input);
            await this.declareSubmissionDetails(input);
            await this.finishInitialFormDeclaration();
        });
    }

    private async selectDirectionOfDeclaration(input: InitialFormData): Promise<void> {
        await ReportLog.step('Select the direction of the declaration', async () => {
            await this.initialFormDeclaraPage.selectDirectionOfDeclaration(input.directionOfDeclaration);
        });
    }

    private async selectTypeOfSubmission(input: InitialFormData): Promise<void> {
        await ReportLog.step('Select the type of submission', async () => {
            await this.initialFormDeclaraPage.selectTypeOfSubmission(input.typeOfSubmission);
        });
    }

    /** Which follow-up screen the type of submission opens - one screen either way. */
    async declareSubmissionDetails(input: InitialFormData): Promise<void> {
        const { TYPE_OF_SUBMISSION } = INITIAL_FORM_DECLARATION;
        const { typeOfSubmission, typeOfEnsSubmission, standaloneDeclarationType } = input;

        if (typeOfSubmission === TYPE_OF_SUBMISSION.ENS) {
            await ReportLog.step('Select the type of ENS submission', async () => {
                if (!typeOfEnsSubmission) {
                    throw new Error('Test data for an ENS submission must set "typeOfEnsSubmission".');
                }
                await this.initialFormDeclaraPage.selectTypeOfEnsSubmission(typeOfEnsSubmission);
            });
            return;
        }

        if (typeOfSubmission === TYPE_OF_SUBMISSION.STANDALONE) {
            await ReportLog.step('Select the standalone declaration type', async () => {
                if (!standaloneDeclarationType) {
                    throw new Error('Test data for a standalone submission must set "standaloneDeclarationType".');
                }
                await this.initialFormDeclaraPage.selectStandaloneDeclarationType(standaloneDeclarationType);
            });
            return;
        }

        throw new Error(`Unsupported typeOfSubmission: "${typeOfSubmission}".`);
    }

    private async finishInitialFormDeclaration(): Promise<void> {
        await ReportLog.step('Finish Initial form declaration', async () => {
            await this.initialFormDeclaraPage.clickFinishButton();
        });
    }
}
