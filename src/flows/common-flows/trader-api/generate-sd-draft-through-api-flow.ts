import { TestInfo } from '@playwright/test';
import { DeclareEnsThroughApiFlow, DeclareEnsOptions } from './declare-ens-through-api-flow';
import { CdsNotificationFlow } from '../../cds-notification-flow';
import { RepresentTraderFlow } from '../../represent-trader-flow';
import { SupplementaryDeclarationSource } from '../generate-sd-draft-from-ens-sfd-flow';
import { CDS_RESPONSE } from '../../../test-data/payload/cds-notification-payload';
import { ReportLog } from '../../../core/report/report-log';

export interface RepresentedCompany {
    companyName: string;
    testInfo: TestInfo;
    url: string;
}

export interface RaiseSdDraftOptions {
    declaration?: DeclareEnsOptions;
    representing?: RepresentedCompany;
}

export class GenerateSdDraftThroughApiFlow {
    constructor(
        private readonly declareEnsThroughApiFlow: DeclareEnsThroughApiFlow,
        private readonly cdsNotificationFlow: CdsNotificationFlow,
        private readonly representTraderFlow: RepresentTraderFlow,
    ) { }

    async raiseSdDraft(options: RaiseSdDraftOptions = {}): Promise<SupplementaryDeclarationSource> {
        const source = await ReportLog.step('Raise the supplementary declaration from a movement declared through the Trader API', () =>
            this.generateSdDraft(options.declaration)
        );

        if (options.representing) {
            const { url, testInfo, companyName } = options.representing;
            await this.representTraderFlow.openPortalAndRepresent(url, testInfo, companyName);
        }

        return source;
    }

    async generateSdDraft(
        options: DeclareEnsOptions = {}
    ): Promise<SupplementaryDeclarationSource> {
        const { movementLrn, sfd } = await this.declareEnsThroughApiFlow
            .declareEnsSfd(options);

        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSACC_01, sfd);
        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSCLE_09, sfd);

        await this.declareEnsThroughApiFlow.waitForSfdArrived(sfd.lrn);

        ReportLog.setParameter('SD raised under', movementLrn);
        ReportLog.setParameter('SD raised from', sfd.lrn);
        return { movementLrn, frontierLrn: sfd.lrn };
    }
}
