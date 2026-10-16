import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import {
    CreateDraftSfdStandaloneFlow, DraftSfdStandaloneDeclaration, SfdStandaloneDeclarationOptions,
} from './create-draft-sfd-standalone-flow';
import { SfdStandaloneConsignmentData } from '../../test-data/sfd-standalone-consignment-data';
import { DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { MRN_COUNTRY_CODE } from '../../constant/local-reference-constants';
import { TranslationKey } from '../../fixtures/locale-fixture';
import { standaloneSubmittedStatusKey } from '../../helper/declaration-status-helper';

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

    // An arrived SFD does not land on "Arrived" at submit: the service takes it to
    // "Processing" and only the CDS responses move it on - see arriveStandaloneSfd,
    // which is where "Arrived" is asserted. Stated here rather than in the shared rule
    // because it has only been measured on this journey.
    if (!data.isPreLodged) {
        return 'status.processing';
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
        /**
         * The status this submission is expected to settle on, when it is NOT the one
         * the journey would normally reach.
         *
         * The authority specs submit deliberately invalid data to get a declaration
         * handed back, so for them "Trader Input Required" is the precondition of the
         * test rather than its failure - and it has to be told apart from the state
         * everybody else treats as a problem.
         *
         * Given, the MRN check is skipped too: a rejected consignment was never
         * authorised, so asking for its authorised MRN would fail for a second reason
         * that says nothing new.
         */
        expectedStatusKey?: TranslationKey;
    }): Promise<DeclarationIdentity | undefined> {
        const draft = await this.createDraftSfdStandaloneFlow.createDraftSfdStandalone(options);

        return this.submitDraft(draft, options.expectedStatusKey);
    }

    async completeSfdStandaloneWithGoodsCsv(
        options: SfdStandaloneDeclarationOptions,
        csvFile: string
    ): Promise<DeclarationIdentity | undefined> {
        const draft = await this.createDraftSfdStandaloneFlow.createDraftSfdStandaloneWithGoodsCsv(options, csvFile);

        return this.submitDraft(draft);
    }

    private async submitDraft(
        { consignmentReference: lrn, consignmentData }: DraftSfdStandaloneDeclaration,
        expectedStatusKey?: TranslationKey
    ): Promise<DeclarationIdentity | undefined> {
        if (expectedStatusKey) {
            await this.consignmentOverviewFlow.submitConsignmentExpectingCdsRefusal();
        } else {
            await this.consignmentOverviewFlow.submitConsignment();
        }
        const mrn = await this.verifyPostSubmit(consignmentData, expectedStatusKey);

        // Undefined on the EIDR route, which has no MRN and needs no CDS response.
        return mrn ? { lrn, mrn } : undefined;
    }

    /**
     * What the service made of the submission. Which check applies is decided by the
     * route the consignment took, not by the caller.
     */
    private async verifyPostSubmit(
        consignmentData: SfdStandaloneConsignmentData,
        expectedStatusKey?: TranslationKey
    ): Promise<string | undefined> {
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            expectedStatusKey ?? submittedStatusKey(consignmentData)
        );

        // A caller that expected a rejection was never going to get an MRN - see the
        // option's own note.
        if (expectedStatusKey) {
            return undefined;
        }

        // One consignment, so one check - which one depends on the route. The EIDR route
        // has no MRN check yet (see verifySfdEidrDeclarationType); calling the SFD one
        // for it would read the same row and report whatever it holds as "SFD MRN".
        if (consignmentData.isControlledGoods) {
            return this.consignmentOverviewFlow
                .verifyStandaloneConsignmentMrn('SFD', MRN_COUNTRY_CODE.SFD);
        }

        // The EIDR route returns nothing to name to CDS, and needs nothing: it is
        // authorised outright, with no MRN and no arrival to wait for.
        await this.consignmentOverviewFlow.verifySfdEidrDeclarationType();
        return undefined;
    }
}
