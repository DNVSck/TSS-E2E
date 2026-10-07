import { CdsMockApiClient } from '../api-client/cds-mock-api-client';
import { ReportLog } from '../core/report/report-log';
import { reportAttempts } from '../helper/report-helper';
import { IS_CDS_MOCK_AVAILABLE } from '../../config/environment';
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
     *
     * Skipped where no mock CDS is configured: on an environment wired to the real CDS
     * there is nothing to stand in for.
     */
    async sendResponse(
        response: CdsResponseMessage,
        // Optional, because the journey that produced it may not have produced one -
        // the caller then gets the message below instead of a type error it would have
        // silenced with a "!".
        declaration: DeclarationIdentity | undefined
    ): Promise<void> {
        if (!IS_CDS_MOCK_AVAILABLE) {
            await ReportLog.step(
                `CDS ${response.name} - skipped (no mock CDS configured)`,
                async () => { }
            );
            return;
        }

        this.assertIdentified(response, declaration);

        const body = buildCdsNotification(response, declaration);

        await ReportLog.step(`CDS sends ${response.name} for declaration ${declaration.mrn}`, async () => {
            reportAttempts(`CDS ${response.name}`, await this.cdsMockApiClient.sendDeclarationResponse(body));
        });
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
