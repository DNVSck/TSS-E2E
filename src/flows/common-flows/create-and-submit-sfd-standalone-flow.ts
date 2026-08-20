import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import {
    CreateDraftSfdStandaloneFlow, SfdStandaloneDeclarationOptions,
} from './create-draft-sfd-standalone-flow';
import { SfdStandaloneConsignmentData } from '../../test-data/sfd-standalone-consignment-data';
import { MRN_COUNTRY_CODE } from '../../constant/local-reference-constants';
import { TranslationKey } from '../../fixtures/locale-fixture';
import { standaloneSubmittedStatusKey } from '../../helper/consignment-status-helper';

/**
 * The status a submitted SFD standalone consignment settles on.
 *
 * The EIDR route (controlled goods = No) is this journey's ONE exception to the rule
 * every standalone journey otherwise follows: it is authorised outright, whether the
 * movement was pre-lodged or arrived, because it has no arrival to wait for. Only that
 * exception is stated here; the rest defers to standaloneSubmittedStatusKey, so the
 * shared rule has one home and this file says only what is peculiar to SFD.
 */
function submittedStatusKey(data: SfdStandaloneConsignmentData): TranslationKey {
    if (!data.isControlledGoods) {
        return 'status.authorised';
    }
    return standaloneSubmittedStatusKey(data.isPreLodged);
}

/**
 * Create and submit an SFD standalone consignment. One flow per standalone journey:
 * IMMI, SFD and FFD diverge at the consignment wizard and (for FFD) the goods wizard,
 * so each owns its own spine rather than branching inside a shared one.
 *
 * Building is delegated to CreateDraftSfdStandaloneFlow, which the authority specs use
 * on its own; this flow adds the ending - submit, then verify what the service made of
 * it. Composes other flows and never drives a page directly. SFD is the only standalone
 * journey with no "Representation information" screen.
 */
export class CreateAndSubmitSfdStandaloneFlow {
    constructor(
        private readonly createDraftSfdStandaloneFlow: CreateDraftSfdStandaloneFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
    ) { }

    async completeSfdStandaloneFlow(options: SfdStandaloneDeclarationOptions & {
        /** See the IMMI standalone flow's option of the same name - only the authority
         *  specs pass it, to say this journey is expected to be refused. */
        expectedStatusKey?: TranslationKey;
    }): Promise<void> {
        const { consignmentData } =
            await this.createDraftSfdStandaloneFlow.createDraftSfdStandalone(options);

        await this.consignmentOverviewFlow.submitConsignment();
        await this.verifyPostSubmit(consignmentData, options.expectedStatusKey);
    }

    /**
     * Post-submit verification for standalone SFD: the consignment settles on a status
     * and is assigned an MRN.
     */
    private async verifyPostSubmit(
        consignmentData: SfdStandaloneConsignmentData,
        expectedStatusKey?: TranslationKey
    ): Promise<void> {
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            expectedStatusKey ?? submittedStatusKey(consignmentData)
        );

        // A caller that expected a rejection was never going to get an MRN.
        if (expectedStatusKey) {
            return;
        }
        // One consignment, so one check - which one depends on the route. The EIDR route
        // has no MRN check yet (see verifySfdEidrDeclarationType); calling the SFD one
        // for it would read the same row and report whatever it holds as "SFD MRN".
        if (consignmentData.isControlledGoods) {
            await this.consignmentOverviewFlow.verifyStandaloneConsignmentMrn('SFD', MRN_COUNTRY_CODE.SFD);
            return;
        }
        await this.consignmentOverviewFlow.verifySfdEidrDeclarationType();
    }
}
