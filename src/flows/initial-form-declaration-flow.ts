import { InitialFormDeclaraPage } from '../page-object/initial-form-declare-page';
import { ReportLog } from '../core/report/report-log';
import { InitialFormData } from '../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../constant/initial-form-declaration-constants';
import {
    CompanyPermissionService,
} from '../api-service/portal-api/company-permission-service';
import { ENV } from '../../config/environment';

export class InitialFormDeclarationFlow {
    constructor(
        private readonly initialFormDeclaraPage: InitialFormDeclaraPage,
        private readonly companyPermissionService: CompanyPermissionService,
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
        const {
            typeOfSubmission, typeOfEnsSubmission, standaloneDeclarationType, declaringForEori,
        } = input;

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
                await this.verifyImmiOfferedToDeclarer(standaloneDeclarationType, declaringForEori);
                await this.initialFormDeclaraPage.selectStandaloneDeclarationType(standaloneDeclarationType);
            });
            return;
        }

        throw new Error(`Unsupported typeOfSubmission: "${typeOfSubmission}".`);
    }

    private async verifyImmiOfferedToDeclarer(
        standaloneDeclarationType: string,
        declaringForEori: string
    ): Promise<void> {
        const grant = await this.companyPermissionService.readPermissionGrant(declaringForEori);
        const offered = await this.initialFormDeclaraPage.isInternalMarketMovementOffered();
        const immiOption =
            INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.INTERNAL_MARKET_MOVEMENT_INFORMATION;

        ReportLog.setParameter(
            'Internal Market Movement option',
            offered ? `offered for ${declaringForEori}` : `not offered for ${declaringForEori}`
        );

        if (offered === grant.hasUkimsAccess) {
            return;
        }

        throw new Error(
            grant.hasUkimsAccess
                ? `"${immiOption}" was not offered, but ${declaringForEori} HAS UKIMS access on `
                + `"${ENV}" (access_ukims true), so the screen should have listed it. This run `
                + `wanted "${standaloneDeclarationType}" - the option that is missing is the `
                + `IMMI one.`
                : `"${immiOption}" was offered, but ${declaringForEori} has NO UKIMS access on `
                + `"${ENV}" (access_ukims false), so the screen should not have listed it. `
                + `The permission and the screen disagree.`
        );
    }

    private async finishInitialFormDeclaration(): Promise<void> {
        await ReportLog.step('Finish Initial form declaration', async () => {
            await this.initialFormDeclaraPage.clickFinishButton();
        });
    }
}
