import { TestInfo } from '@playwright/test';
import { DeclareEnsThroughApiFlow, DeclareEnsOptions } from './declare-ens-through-api-flow';
import { CdsNotificationFlow } from '../../cds-notification-flow';
import { RepresentTraderFlow } from '../../represent-trader-flow';
import { SupplementaryDeclarationSource } from '../generate-sd-draft-from-ens-sfd-flow';
import { CDS_RESPONSE } from '../../../test-data/payload/cds-notification-payload';
import { BasePage } from '../../../page-object/base-page';
import { IMPORTER_COMPANY_NAME } from '../../../../config/environment';
import { ReportLog } from '../../../core/report/report-log';

export interface GenerateSdDraftThroughApiOptions extends DeclareEnsOptions {
    testInfo: TestInfo;
    url: string;
}

export class GenerateSdDraftThroughApiFlow {
    constructor(
        private readonly declareEnsThroughApiFlow: DeclareEnsThroughApiFlow,
        private readonly cdsNotificationFlow: CdsNotificationFlow,
        private readonly representTraderFlow: RepresentTraderFlow,
        private readonly basePage: BasePage,
    ) { }

    async generateSdDraft(
        options: GenerateSdDraftThroughApiOptions
    ): Promise<SupplementaryDeclarationSource> {
        const { testInfo, url, ...declarationOverrides } = options;

        const { movementLrn, sfd } = await this.declareEnsThroughApiFlow
            .declareEnsSfd(declarationOverrides);

        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSACC_01, sfd);
        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSCLE_09, sfd);

        await this.declareEnsThroughApiFlow.waitForSfdArrived(sfd.lrn);

        await this.basePage.navigateToPortal(url, testInfo);
        await this.representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);

        ReportLog.setParameter('Supplementary declaration raised under', movementLrn);
        ReportLog.setParameter('Supplementary declaration raised from', sfd.lrn);
        return { movementLrn, frontierLrn: sfd.lrn };
    }
}
