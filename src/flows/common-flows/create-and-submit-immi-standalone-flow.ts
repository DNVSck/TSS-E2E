import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import {
    CreateDraftImmiStandaloneFlow, DraftImmiStandaloneDeclaration, ImmiStandaloneDeclarationOptions,
} from './create-draft-immi-standalone-flow';
import { ImmiStandaloneConsignmentData } from '../../test-data/immi-standalone-consignment-data';
import { DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { MRN_COUNTRY_CODE } from '../../constant/local-reference-constants';
import { TranslationKey } from '../../fixtures/locale-fixture';
import { standaloneSubmittedStatusKey } from '../../helper/declaration-status-helper';

/**
 * Create and submit an IMMI standalone consignment. One flow per standalone journey:
 * IMMI, SFD and FFD diverge at the consignment wizard and (for FFD) the goods wizard,
 * so each owns its own spine rather than branching inside a shared one.
 *
 * Building is delegated to CreateDraftImmiStandaloneFlow, which the authority specs use
 * on its own; this flow adds the ending - submit, then verify what the service made of
 * it. Composes other flows and never drives a page directly. Runs as whichever company
 * the spec signed in as; the "Representation information" screen is reached only when
 * the consignment data carries a representationType.
 */
export class CreateAndSubmitImmiStandaloneFlow {
    constructor(
        private readonly createDraftImmiStandaloneFlow: CreateDraftImmiStandaloneFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
    ) { }

    async completeImmiStandaloneFlow(options: ImmiStandaloneDeclarationOptions & {
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
    }): Promise<DeclarationIdentity> {
        const draft = await this.createDraftImmiStandaloneFlow.createDraftImmiStandalone(options);

        return this.submitDraft(draft, options.expectedStatusKey);
    }

    async completeImmiStandaloneWithGoodsCsv(
        options: ImmiStandaloneDeclarationOptions,
        csvFile: string
    ): Promise<DeclarationIdentity> {
        const draft = await this.createDraftImmiStandaloneFlow.createDraftImmiStandaloneWithGoodsCsv(options, csvFile);

        return this.submitDraft(draft);
    }

    private async submitDraft(
        { consignmentReference: lrn, consignmentData }: DraftImmiStandaloneDeclaration,
        expectedStatusKey?: TranslationKey
    ): Promise<DeclarationIdentity> {
        await this.consignmentOverviewFlow.submitConsignment(expectedStatusKey);
        const mrn = await this.verifyPostSubmit(consignmentData, expectedStatusKey);

        return { lrn, mrn };
    }

    /**
     * Post-submit verification for standalone IMMI. Unlike SFD, this journey has no
     * second route to branch on, so it follows the shared standalone rule outright: a
     * pre-lodged movement waits for its goods, an arrived one is already there, and the
     * consignment is assigned an MRN opening with the IMMI country code - the same
     * check the ENS journey makes of the IMMI consignment it auto-generates.
     */
    private async verifyPostSubmit(
        consignmentData: ImmiStandaloneConsignmentData,
        expectedStatusKey?: TranslationKey
    ): Promise<string> {
        await this.consignmentOverviewFlow.verifyStandaloneConsignmentSubmitted(
            expectedStatusKey ?? standaloneSubmittedStatusKey(consignmentData.isPreLodged)
        );

        // A caller that expected a rejection was never going to get an MRN - see the
        // option's own note.
        if (expectedStatusKey) {
            return '';
        }

        return this.consignmentOverviewFlow
            .verifyStandaloneConsignmentMrn('IMMI', MRN_COUNTRY_CODE.IMMI);
    }
}
