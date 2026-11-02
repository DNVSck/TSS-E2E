import { CdsNotificationFlow } from '../cds-notification-flow';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { CDS_RESPONSE, DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { TFunction, TranslationKey } from '../../fixtures/locale-fixture';
import {
    CancelSupplementaryDeclarationFlow, LinkedSupplementaryDeclaration,
} from './cancel-supplementary-declaration-flow';
import {
    SimplifiedFrontierDeclarationService,
} from '../../api-service/trader-api/simplified-frontier-declaration-service';
import { ReportLog } from '../../core/report/report-log';
import { ArrivalNotificationService } from '../../api-service/hmrc/arrival-notification-service';
import {
    SupplementaryDeclarationOverviewPage,
} from '../../page-object/supplementary-declaration-overview-page';
import { verifyDeclarationStatus } from '../../helper/declaration-status-helper';
import { DeclarationAccessFlow } from '../declaration-access-flow';


export class TriggerFinalStatusThroughCdsFlow {
    constructor(
        private readonly cdsNotificationFlow: CdsNotificationFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly cancelSupplementaryDeclarationFlow: CancelSupplementaryDeclarationFlow,
        private readonly simplifiedFrontierDeclarationService: SimplifiedFrontierDeclarationService,
        private readonly arrivalNotificationService: ArrivalNotificationService,
        private readonly supplementaryDeclarationOverviewPage: SupplementaryDeclarationOverviewPage,
        private readonly declarationAccessFlow: DeclarationAccessFlow,
        private readonly t: TFunction,
    ) { }

    async closeSupplementaryDeclaration(sd: DeclarationIdentity): Promise<void> {
        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSCLE_09, sd);

        await ReportLog.step('Verify the supplementary declaration is closed on its overview', async () => {
            await this.declarationAccessFlow.openDeclarationFromSearch(sd.lrn);
            const shown = await this.supplementaryDeclarationOverviewPage.waitForStatus('status.closed');
            verifyDeclarationStatus(shown, this.t('status.closed'),
                `Supplementary declaration ${sd.lrn} status after CDS sent ${CDS_RESPONSE.DMSCLE_09.name}`);
        });
    }

    async acceptSupplementaryDeclarationCancellationThroughCds(
        declaration: LinkedSupplementaryDeclaration
    ): Promise<void> {
        await ReportLog.step('Accept the supplementary declaration cancellation through CDS', async () => {
            const sfd = await this.simplifiedFrontierDeclarationService.readSfd(declaration.frontierLrn);

            await this.cdsNotificationFlow.sendResponse(
                CDS_RESPONSE.DMSINV, { lrn: declaration.frontierLrn, mrn: sfd.movementReferenceNumber }
            );

            await this.cancelSupplementaryDeclarationFlow.verifySupplementaryDeclarationAndLinkedSfdAreCancelled(
                declaration, `after CDS sent ${CDS_RESPONSE.DMSINV.name}`
            );
        });
    }

    /**
     * Take the SFD a movement generated from "Awaiting arrival" to "Arrived".
     *
     * SFD-specific in both halves: a movement lists each generated kind on its own tab,
     * and each kind settles on its own status. The IMMI equivalent is a sibling method
     * here - reusing answerDeclaration, opening the IMMI tab, expecting "Closed" - not
     * a parameter on this one. It needs a "status.closed" translation first, read off
     * the real screen in both languages rather than guessed.
     *
     * @param sfd the generated consignment's identity, as completeEnsDeclarationFlow
     *            returns it. Undefined is allowed through and refused with a message
     *            naming the missing half, rather than forcing a "!" at the call site.
     */
    async arriveSfdConsignment(sfd: DeclarationIdentity | undefined): Promise<void> {
        await this.answerDeclaration(sfd);
        await this.movementOverviewFlow.openGeneratedSfdConsignment();
        await this.consignmentOverviewFlow.verifyConsignmentStatus('status.arrived');
    }

    /**
     * Take the IMMI a movement generated to "Closed".
     *
     * The same two messages as the SFD, and a different destination - which is the
     * whole reason the expected status is not baked into the check they share.
     */
    async closeImmiConsignment(immi: DeclarationIdentity | undefined): Promise<void> {
        await this.answerDeclaration(immi);
        await this.movementOverviewFlow.openGeneratedImmiConsignment();
        await this.consignmentOverviewFlow.verifyConsignmentStatus('status.closed');
    }

    async arriveStandaloneSfd(sfd: DeclarationIdentity | undefined): Promise<void> {
        await this.settleWhereItStands(sfd, 'status.arrived');
    }

    /** The IMMI counterpart of {@link arriveStandaloneSfd}. */
    async closeStandaloneImmi(immi: DeclarationIdentity | undefined): Promise<void> {
        await this.settleWhereItStands(immi, 'status.closed');
    }

    async arriveAndCloseStandaloneFfd(
        ffd: DeclarationIdentity | undefined,
        arrivedStatusKey: TranslationKey = 'status.arrived',
    ): Promise<void> {
        if (!ffd) {
            throw new Error('FFD arrival notification requires a declaration identity');
        }
        await ReportLog.step(`Send the HMRC arrival notification for ${ffd.lrn}`, async () => {
            await this.arrivalNotificationService.sendArrivalNotification(ffd);
        });
        await this.consignmentOverviewFlow.verifyConsignmentStatus(arrivedStatusKey);

        await this.closeStandaloneFfd(ffd);
    }

    async settleStandaloneFfd(ffd: DeclarationIdentity | undefined, isPreLodged: boolean): Promise<void> {
        if (isPreLodged) {
            await ReportLog.step('Arrive and close the FFD standalone through HMRC and CDS', () =>
                this.arriveAndCloseStandaloneFfd(ffd)
            );
            return;
        }
        await ReportLog.step('Close the FFD standalone through CDS', () => this.closeStandaloneFfd(ffd));
    }

    async closeStandaloneFfd(ffd: DeclarationIdentity | undefined): Promise<void> {
        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSCLE_09, ffd);
        await this.consignmentOverviewFlow.verifyConsignmentStatus('status.closed');
    }

    async triggerFiscalHold(ffd: DeclarationIdentity | undefined): Promise<void> {
        if (!ffd) {
            throw new Error('Fiscal hold requires a declaration identity');
        }
        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSCPI, ffd);
        await this.consignmentOverviewFlow.verifyConsignmentStatus('status.fiscalHold');
    }

    async arriveAndTriggerFiscalHold(ffd: DeclarationIdentity | undefined): Promise<void> {
        if (!ffd) {
            throw new Error('FFD arrival notification requires a declaration identity');
        }
        await ReportLog.step(`Send the HMRC arrival notification for ${ffd.lrn}`, async () => {
            await this.arrivalNotificationService.sendArrivalNotification(ffd);
        });
        await this.consignmentOverviewFlow.verifyConsignmentStatus('status.arrived');
        await this.triggerFiscalHold(ffd);
    }

    private async settleWhereItStands(
        declaration: DeclarationIdentity | undefined,
        expectedStatusKey: TranslationKey
    ): Promise<void> {
        await this.answerDeclaration(declaration);
        await this.consignmentOverviewFlow.verifyConsignmentStatus(expectedStatusKey);
    }

    /**
     * The half that is the same whichever declaration was generated. Split out now
     * rather than when IMMI needs it, because the pair-and-order is the part that must
     * not drift between them.
     */
    private async answerDeclaration(declaration: DeclarationIdentity | undefined): Promise<void> {
        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSACC_01, declaration);
        await this.cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSCLE_09, declaration);
    }
}
