import { CreateAndSubmitSfdStandaloneFlow } from './create-and-submit-sfd-standalone-flow';
import { SfdStandaloneDeclarationOptions } from './create-draft-sfd-standalone-flow';
import { SupplementaryDeclarationSource } from './generate-sd-draft-from-ens-sfd-flow';
import { TriggerFinalStatusThroughCdsFlow } from './trigger-final-status-through-cds-flow';

export class GenerateSdDraftFromSfdStandaloneFlow {
    constructor(
        private readonly createAndSubmitSfdStandaloneFlow: CreateAndSubmitSfdStandaloneFlow,
        private readonly triggerFinalStatusThroughCdsFlow: TriggerFinalStatusThroughCdsFlow,
    ) { }

    async generateSdDraft(options: SfdStandaloneDeclarationOptions): Promise<SupplementaryDeclarationSource> {
        const sfd = await this.createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
            ...options,
            consignmentOverrides: { ...options.consignmentOverrides, isControlledGoods: true },
        });

        if (!sfd) {
            throw new Error(
                'The SFD standalone returned no LRN and MRN, so no supplementary declaration will be '
                + 'raised from it. Only the controlled goods route is authorised with an MRN.'
            );
        }

        await this.triggerFinalStatusThroughCdsFlow.arriveStandaloneSfd(sfd);
        return { movementLrn: sfd.lrn, frontierLrn: sfd.lrn };
    }
}
