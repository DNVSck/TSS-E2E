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
    companyName?: string;
}

export interface SupplementaryDeclarationSource {
    movementLrn: string;
    frontierLrn: string;
}


export class GenerateSdDraftFromEnsSfdFlow {
    constructor(
        private readonly createAndSubmitEnsDeclarationFlow: CreateAndSubmitEnsDeclarationFlow,
        private readonly triggerFinalStatusThroughCdsFlow: TriggerFinalStatusThroughCdsFlow,
        private readonly representTraderFlow: RepresentTraderFlow,
    ) { }

    /** Declare an ENS-SFD movement, clear it, and represent the trader it belongs to. */
    async generateSdDraft(
        options: GenerateSdDraftOptions
    ): Promise<SupplementaryDeclarationSource> {
        const { testInfo, url, companyName = IMPORTER_COMPANY_NAME } = options;
        const input = supplementaryDeclarationMovement(options.overrides);

        const { generatedConsignment: sfd, movementLrn } = await this.createAndSubmitEnsDeclarationFlow
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
        await this.representTraderFlow.representTrader(companyName);

        // Reported as well as returned, so a run that later fails to find the SD says
        // which movement it was looking under and which declaration it expected.
        ReportLog.setParameter('SD raised under', movementLrn);
        ReportLog.setParameter('SD raised from', sfd.lrn);
        return { movementLrn, frontierLrn: sfd.lrn };
    }
}
