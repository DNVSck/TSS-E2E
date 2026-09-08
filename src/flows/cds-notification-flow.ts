import { CdsMockApiClient } from '../api-client/cds-mock-api-client';
import { ReportLog } from '../core/report/report-log';
import { ENV, IS_CDS_MOCK_AVAILABLE } from '../../config/environment';
import {
    buildCdsNotification, DeclarationIdentity, CdsResponseMessage,
} from '../test-data/payload/cds-notification-payload';

/**
 * Makes CDS say something about a declaration.
 *
 * A flow, so it is where the reporting and the decisions live: the client only sends,
 * the payload builders only state facts, and this decides whether a response is due at
 * all and refuses to send one that names no declaration.
 *
 * Which message to send is the caller's choice, passed in as a row of CDS_RESPONSE,
 * so a new CDS message needs nothing here:
 *
 *     await cdsNotificationFlow.sendResponse(CDS_RESPONSE.DMSCLE_09, sfd);
 *
 * There is no wait in here, and that is deliberate. The Bruno script this replaces
 * opens with a three-second sleep, because a person driving it by hand has no way to
 * know the portal has finished registering the declaration. A test does: it has just
 * read the MRN off the screen, and a declaration without an MRN is one CDS has not
 * seen yet. So the precondition is expressed by HAVING the MRN, and an empty one fails
 * loudly below rather than being papered over by a timer that is either wasteful or
 * too short - and never says which.
 */
export class CdsNotificationFlow {
    constructor(private readonly cdsMockApiClient: CdsMockApiClient) { }

    /**
     * Push one CDS response back to the portal.
     */
    async sendResponse(
        response: CdsResponseMessage,
        // Optional, because the journey that produced it may not have produced one -
        // the caller then gets the message below instead of a type error it would have
        // silenced with a "!".
        declaration: DeclarationIdentity | undefined
    ): Promise<void> {
        this.assertMockConfigured(response);
        this.assertIdentified(response, declaration);

        await ReportLog.step(
            `CDS sends ${response.name} for declaration ${declaration.mrn}`,
            () => this.cdsMockApiClient.sendDeclarationResponse(
                buildCdsNotification(response, declaration)
            )
        );
    }

    /**
     * Refuse to answer as CDS without the token that lets us.
     *
     * This used to skip quietly, on the reasoning that an environment wired to the real
     * CDS has nothing to stand in for. What that hid is the case it cannot tell apart:
     * a run that simply forgot CDS_TOKEN. Nothing then moves the consignment, the status
     * stays where submission left it, and the journey ends green having proved none of
     * the thing it exists to prove. A test that cannot fail is worse than one that does.
     */
    private assertMockConfigured(response: CdsResponseMessage): void {
        if (IS_CDS_MOCK_AVAILABLE) return;

        throw new Error(
            `Cannot send ${response.name}: no CDS_TOKEN is set, so nothing can answer as CDS ` +
            `and the consignment will never leave the status submitting left it in. ` +
            `Set CDS_TOKEN in .env.${ENV}, or run a suite that does not trigger CDS.`
        );
    }

    /**
     * Refuse to send a response for a declaration that has not been identified.
     *
     * An empty MRN means the poll that reads it timed out. A response naming no
     * declaration is not a weaker test - it is a call the service will discard, leaving
     * the test to fail later on a screen that says nothing about the real cause.
     */
    private assertIdentified(
        response: CdsResponseMessage,
        declaration: DeclarationIdentity | undefined
    ): asserts declaration is DeclarationIdentity {
        if (!declaration) {
            throw new Error(
                `Cannot send ${response.name}: the journey generated no declaration to answer.`
            );
        }

        const missing = (['lrn', 'mrn'] as const).filter(key => !declaration[key]);

        if (missing.length > 0) {
            throw new Error(
                `Cannot send ${response.name}: ${missing.join(' and ')} is empty. `
                + 'The declaration must be submitted and its MRN read from the portal first.'
            );
        }
    }
}
