import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { AddNewEnsConsignmentFlow } from '../consignment/add-new-ens-consignment-flow';
import {
    CreateDraftEnsDeclarationFlow, DraftEnsDeclaration, EnsDeclarationOptions,
} from './create-draft-ens-declaration-flow';
import { initialFormData } from '../../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../../constant/initial-form-declaration-constants';
import { UserCredentials, accountEnvKey } from '../../auth/credentials';
import { reportTestAccount } from '../../helper/report-helper';
import { checkpointFor } from '../accessibility-audit-flow';
import { ENV } from '../../../config/environment';

export class CreateDraftConsignmentFirstFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly routeFlow: InitialFormDeclarationFlow,
        private readonly createDraftEnsDeclarationFlow: CreateDraftEnsDeclarationFlow,
        private readonly addNewEnsConsignmentFlow: AddNewEnsConsignmentFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly authAccount: UserCredentials | null,
    ) { }

    async createDraftConsignmentFirstDeclaration(options: EnsDeclarationOptions): Promise<DraftEnsDeclaration> {
        reportTestAccount(this.authAccount, 'createDraftConsignmentFirstDeclaration');

        const submitterEori = this.readSubmitterEori();
        const checkpoint = checkpointFor(options.audit, options.testInfo);
        const { TYPE_OF_ENS_SUBMISSION } = INITIAL_FORM_DECLARATION;

        await this.accessFlow.openService({ baseUrl: options.url, testInfo: options.testInfo });
        await this.routeFlow.completeInitialFormDeclaration(
            initialFormData({
                ...options.initialFormOverrides,
                typeOfEnsSubmission: TYPE_OF_ENS_SUBMISSION.CONSIGNMENT_FIRST_PROCESS,
            }),
            checkpoint
        );
        const draftConsignment = await this.createDraftEnsDeclarationFlow.declareConsignmentAndGoods(
            options,
            consignmentData => this.addNewEnsConsignmentFlow.addConsignmentFirstConsignment(
                consignmentData, submitterEori, checkpoint
            ),
            checkpoint
        );

        const movementLrn = await this.createDraftEnsDeclarationFlow.createDraftMovement(
            {
                ...options,
                initialFormOverrides: {
                    ...options.initialFormOverrides,
                    typeOfEnsSubmission: TYPE_OF_ENS_SUBMISSION.ENS_CUSTOM_OR_ENS_ONLY,
                },
            },
            checkpoint
        );
        await this.addNewEnsConsignmentFlow.associateExistingConsignment(draftConsignment.consignmentReference);
        await this.movementOverviewFlow.verifyConsignmentListed(draftConsignment.consignmentReference);

        return { ...draftConsignment, movementLrn };
    }

    private readSubmitterEori(): string {
        const eori = this.authAccount?.eori;

        if (!eori) {
            throw new Error(
                'The consignment-first journey names the signed-in account as the ENS submitter, '
                + `but ${this.authAccount ? accountEnvKey(this.authAccount, 'EORI') : 'its EORI'} `
                + `is not set in .env.${ENV}.`
            );
        }

        return eori;
    }
}
