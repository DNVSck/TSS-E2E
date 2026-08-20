import { CdsNotificationFlow } from '../cds-notification-flow';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { CDS_RESPONSE, DeclarationIdentity } from '../../test-data/payload/cds-notification-payload';
import { TranslationKey } from '../../fixtures/locale-fixture';

/**
 * Stands in for CDS answering a generated declaration, and waits for the portal to
 * show the status that answer drives it to.
 *
 * Named for the effect rather than for the messages. "DMSCLE" reads like "cleared",
 * but that is a guess at a wire code and a flow named after a guess spreads it. What
 * IS known is where each journey ends up - and it differs: the same two messages take
 * an SFD to "Arrived" and an IMMI to "Closed" (Trung, 2026-08-20). So there is one
 * method per outcome, each naming its own, over a shared middle that must not drift.
 *
 * A composed flow because the SEQUENCE is knowledge, not a choice a spec should make:
 * DMSACC-01 then DMSCLE-09, in that order, and only then does the consignment leave
 * "Awaiting arrival". A spec restating those two lines would be restating a fact about
 * CDS, and the second spec to do it would be free to get the order wrong.
 *
 * What is asserted here is what was OBSERVED (2026-08-20): those two messages, in that
 * order, take a generated SFD to "Arrived". The message names are left as CDS's own -
 * translating "DMSCLE-09" into a guess at its meaning would put an unchecked
 * interpretation into every report.
 *
 * No ReportLog.step of its own, for the same reason completeEnsDeclarationFlow has
 * none: every flow it calls reports its own, and a wrapper here would add a nesting
 * level and a second name for the same phase.
 */
export class TriggerFinalStatusThroughCdsFlow {
    constructor(
        private readonly cdsNotificationFlow: CdsNotificationFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
    ) { }

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

    /**
     * Take a standalone SFD to "Arrived", and a standalone IMMI to "Closed".
     *
     * No record to open first, unlike the generated pair above: a standalone
     * declaration IS the consignment, and the journey that submitted it leaves the
     * browser on it. Where an integrated journey has to walk back to the movement and
     * pick the right tab, these only have to ask the page already showing.
     *
     * The destinations are the same as their integrated counterparts (Trung,
     * 2026-08-20), and hold for both the pre-lodged and the arrived variant.
     */
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
