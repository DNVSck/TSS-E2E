import { CdsNotificationFlow } from '../cds-notification-flow';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { CDS_RESPONSE, DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { TranslationKey } from '../../fixtures/locale-fixture';
import {
    CancelSupplementaryDeclarationFlow, LinkedSupplementaryDeclaration,
} from './cancel-supplementary-declaration-flow';
import {
    SimplifiedFrontierDeclarationService,
} from '../../api-service/trader-api/simplified-frontier-declaration-service';
import { ReportLog } from '../../core/report/report-log';


export class TriggerFinalStatusThroughCdsFlow {
    constructor(
        private readonly cdsNotificationFlow: CdsNotificationFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly cancelSupplementaryDeclarationFlow: CancelSupplementaryDeclarationFlow,
        private readonly simplifiedFrontierDeclarationService: SimplifiedFrontierDeclarationService,
    ) { }

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
