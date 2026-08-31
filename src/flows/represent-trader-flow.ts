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
            await this.agentBanner.openTradersList();
            await this.representTraderPage.startRepresenting(companyName);
            await this.agentBanner.waitUntilRepresenting();
        });
        // Surface who the Agent is representing in the Allure "Parameters" table
        // so a run is trackable without scrolling the step timeline. Only specs
        // that represent reach this flow, so non-representing journeys stay clean.
        ReportLog.setParameter('Representing', companyName);
    }

    /**
     * Stop representing, so the Agent acts as itself again.
     *
     * The authority specs need this to ask their sharpest question: an Agent that
     * has stopped representing must lose sight of the declarations it made while it
     * was. Representation is server-side session state, not part of the replayed
     * storageState, so it has to be turned off deliberately - nothing else clears it
     * mid-test.
     */
    async stopRepresenting(): Promise<void> {
        await ReportLog.step('Stop representing', async () => {
            await this.agentBanner.stopRepresenting();
        });
    }
}
