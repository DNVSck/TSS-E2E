import { RepresentationBanner } from '../page-object/components/representation-banner';
import { RepresentTraderPage } from '../page-object/represent-trader-page';
import { PortalPage } from '../page-object/portal-page';
import { CompanyProfilePage } from '../page-object/company-profile-page';
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
        private readonly representationBanner: RepresentationBanner,
        private readonly representTraderPage: RepresentTraderPage,
        private readonly portalPage: PortalPage,
        private readonly companyProfilePage: CompanyProfilePage,
    ) { }

    async representTrader(companyName: string): Promise<void> {
        await ReportLog.step(`Start representing "${companyName}"`, async () => {
            // Finish any session already running, even though "Switch business" would
            // move straight across. What that route does not leave is anything to WAIT
            // on: the strip is already on the page, so waitUntilRepresenting below
            // would pass on the OLD representation and the test would carry on -
            // possibly declaring on behalf of the previous company - before the new one
            // took effect. Finishing first makes the strip go away and come back, which
            // is a real signal.
            //
            // Not hypothetical on a shared session. Representing is SERVER-SIDE state
            // and is not part of the replayed storageState, so a session left
            // representing by an earlier test arrives here still doing so - and no
            // journey spec turns it off at the end.
            await this.representationBanner.clearRepresentation();

            // Portal home -> "View business profile" -> "View businesses you're
            // authorised to represent". The strip that used to carry a "Select a
            // company" link on every page is now rendered only DURING a representation,
            // so a session that represents nobody has nothing to click and has to walk
            // in through the profile.
            await this.portalPage.openCompanyProfile();
            await this.companyProfilePage.openTradersList();

            await this.representTraderPage.startRepresenting(companyName);
            await this.representationBanner.waitUntilRepresenting();
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
            await this.representationBanner.clearRepresentation();
        });
    }
}
