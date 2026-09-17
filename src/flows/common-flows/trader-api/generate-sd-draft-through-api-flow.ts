import { DeclareEnsThroughApiFlow, DeclareEnsOptions } from './declare-ens-through-api-flow';
import { CdsNotificationFlow } from '../../cds-notification-flow';
import { SupplementaryDeclarationSource } from '../generate-sd-draft-from-ens-sfd-flow';
import { CDS_RESPONSE } from '../../../test-data/payload/cds-notification-payload';
import { ReportLog } from '../../../core/report/report-log';

export class GenerateSdDraftThroughApiFlow {
    constructor(
        private readonly declareEnsThroughApiFlow: DeclareEnsThroughApiFlow,
        private readonly cdsNotificationFlow: CdsNotificationFlow,
    ) { }

    async generateSdDraft(
        options: DeclareEnsOptions = {}
    ): Promise<SupplementaryDeclarationSource> {
        const { movementLrn, sfd } = await this.declareEnsThroughApiFlow
            .declareEnsSfd(options);

        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSACC_01, sfd);
        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSCLE_09, sfd);

        await this.declareEnsThroughApiFlow.waitForSfdArrived(sfd.lrn);

        ReportLog.setParameter('Supplementary declaration raised under', movementLrn);
        ReportLog.setParameter('Supplementary declaration raised from', sfd.lrn);
        return { movementLrn, frontierLrn: sfd.lrn };
    }
}
