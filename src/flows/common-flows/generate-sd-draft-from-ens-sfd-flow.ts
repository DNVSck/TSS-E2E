import { TestInfo } from '@playwright/test';
import { CreateAndSubmitEnsDeclarationFlow } from './create-and-submit-ens-declaration-flow';
import { TriggerFinalStatusThroughCdsFlow } from './trigger-final-status-through-cds-flow';
import { RepresentTraderFlow } from '../represent-trader-flow';
import {
    SupplementaryDeclarationMovementData, supplementaryDeclarationMovement,
} from '../../test-data/supplementary-declaration-movement-data';
import { IMPORTER_COMPANY_NAME } from '../../../config/environment';
import { ReportLog } from '../../core/report/report-log';

export interface GenerateSdDraftOptions {
    testInfo: TestInfo;
    url: string;
    overrides?: Partial<SupplementaryDeclarationMovementData>;
}

/**
 * SET-UP, not a journey: it produces an auto-generated supplementary declaration DRAFT
 * out of the ENS-SFD journey, and leaves the browser in a position to work on it.
 *
 * Nobody creates a supplementary declaration. The service generates one for every
 * frontier declaration that clears, so the only way to have a draft is to make a
 * movement and let it clear - which is what this does, in the three steps that journey
 * takes:
 *
 *   1. the Agent declares an ENS-SFD movement as ITSELF. An integrated declaration is
 *      made on the agent's own account; representing first would make the whole
 *      movement the importer's.
 *   2. CDS clears the SFD. THIS is what raises the supplementary declaration - no GMR
 *      is involved (confirmed with Trung, 2026-08-21). The ENS-SFD journeys create one
 *      because a real movement needs it to cross the water, but nothing about raising
 *      an SD depends on it, and creating one only lengthens the journey.
 *   3. the Agent starts representing the importer, because the declaration is theirs
 *      and is not on the agent's own list at all.
 *
 * Returns the frontier declaration's reference, which is how the supplementary
 * declaration is then found - see DeclarationOverviewPage.openSupplementaryDeclarationFor.
 *
 * A flow rather than a helper inside a spec: every supplementary declaration test needs
 * all of this before it can start, and the order of the three steps is the part that is
 * easy to get wrong.
 */
export class GenerateSdDraftFromEnsSfdFlow {
    constructor(
        private readonly createAndSubmitEnsDeclarationFlow: CreateAndSubmitEnsDeclarationFlow,
        private readonly triggerFinalStatusThroughCdsFlow: TriggerFinalStatusThroughCdsFlow,
        private readonly representTraderFlow: RepresentTraderFlow,
    ) { }

    /** Declare an ENS-SFD movement, clear it, and represent the trader it belongs to. */
    async generateSdDraft(
        options: GenerateSdDraftOptions
    ): Promise<string> {
        const { testInfo, url } = options;
        const input = supplementaryDeclarationMovement(options.overrides);

        const { generatedConsignment: sfd } = await this.createAndSubmitEnsDeclarationFlow
            .completeEnsDeclarationFlow({
                testInfo,
                url,
                movementOverrides: input.movementOverrides,
                consignmentOverrides: input.consignmentOverrides,
                goodsItemOverrides: input.goodsItemOverrides,
            });

        // Checked rather than asserted with "!". The journey types this as optional
        // because the ENS routes that generate no customs declaration share the same
        // result, and a non-null assertion here would be a claim with nothing behind
        // it - the failure would surface later as a TypeError reading `lrn` of
        // undefined, pointing at the wrong place entirely.
        if (!sfd) {
            throw new Error(
                'The ENS-SFD journey generated no SFD consignment, so no supplementary '
                + 'declaration will be raised and there is nothing to complete. Check the '
                + 'movement declared a customs declaration at all.'
            );
        }

        await this.triggerFinalStatusThroughCdsFlow.arriveSfdConsignment(sfd);
        await this.representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);

        // Reported as well as returned, so a run that later fails to find the SD says
        // which declaration it was looking for.
        ReportLog.setParameter('Supplementary declaration raised from', sfd.lrn);
        return sfd.lrn;
    }
}
