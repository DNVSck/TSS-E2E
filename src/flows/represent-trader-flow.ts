import { AgentBanner } from '../page-object/components/agent-banner';
import { RepresentTraderPage } from '../page-object/represent-trader-page';
import { ReportLog } from '../core/report/report-log';

/**
 * Agent starts representing a trader.
 *
 * Kept as its own flow rather than folded into the declaration flow: representing
 * is a server-side session state that persists across later navigation, so a spec
 * composes it as a separate step *before* the declaration journey. A spec that does
 * not represent simply never calls this, and the declaration flow stays untouched.
 *
 * The journey follows the real user path: open the traders list from the Agent
 * banner's "Select" link, pick the company row, then confirm the banner now shows
 * an active representation — rather than deep-linking the traders URL.
 */
export class RepresentTraderFlow {
    constructor(
        private readonly agentBanner: AgentBanner,
        private readonly representTraderPage: RepresentTraderPage,
    ) { }

    async representTrader(companyName: string): Promise<void> {
        await ReportLog.step(`Start representing "${companyName}"`, async () => {
            // Stop first, even though the banner offers "Select a different company"
            // and switching straight across works. What that route does not leave is
            // anything to WAIT on: the "Stop representing" link is already on the page,
            // so waitUntilRepresenting below would pass on the OLD representation and
            // the test would carry on - possibly declaring on behalf of the previous
            // company - before the new one took effect. Stopping first makes the link
            // go away and come back, which is a real signal.
            //
            // Not hypothetical on a shared session. Representing is SERVER-SIDE state
            // and is not part of the replayed storageState, so a session left
            // representing by an earlier test arrives here still doing so - and no
            // journey spec turns it off at the end.
            //
            // A no-op when not representing, which is every first call.
            await this.agentBanner.stopRepresenting();

            await this.agentBanner.openTradersList();
            await this.representTraderPage.startRepresenting(companyName);
            await this.agentBanner.waitUntilRepresenting();
        });
        // Surface who the Agent is representing in the Allure "Parameters" table
        // so a run is trackable without scrolling the step timeline. Only specs
        // that represent reach this flow, so non-representing journeys stay clean.
        ReportLog.setParameter('Representing', companyName);
    }
}
