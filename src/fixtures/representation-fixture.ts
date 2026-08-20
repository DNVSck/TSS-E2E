import { test } from '@playwright/test';
import { canRepresentTraders } from '../auth/credentials';
import { ReportLog } from '../core/report/report-log';
import { PageFixtureType } from './page-fixture';
import { WorkerAuthFixtureType } from './worker-auth-fixture';

export type RepresentationFixtureType = {
    /**
     * Clears any representation left in the session before the test starts.
     *
     * Auto, and therefore not something a spec asks for: representing is SERVER-SIDE
     * session state, every test in a worker replays one session file, and a test that
     * ends while representing hands the next one an agent still acting for somebody.
     * That was a real failure twice - once when a beforeEach called stopRepresenting on
     * a blank page and did nothing, and once when wave 1 removed the representTrader
     * call from the ENS specs and took the reset away with it as a side effect. Both
     * times the reset was a thing each spec had to remember, and both times a spec
     * forgot. This is that obligation moved somewhere it cannot be forgotten.
     *
     * BEFORE the test, deliberately, not after. A test cannot control what ran before
     * it, so cleaning up after yourself only covers the mess you made - not the mess you
     * inherited from a crashed test, an interrupted run, or a session that outlived the
     * run that dirtied it (they live 30 minutes and the session file is replayed). And
     * an afterEach here would cost real evidence: screenshots and video are captured in
     * the page fixture's teardown, which runs AFTER every afterEach hook, so navigating
     * to the portal to tidy up would replace the failure screenshot of every red test
     * with a picture of the portal home.
     */
    representationReset: void;
};

type ExtendParams = Parameters<
    typeof test.extend<RepresentationFixtureType & PageFixtureType & WorkerAuthFixtureType>
>;

export const representationFixture: ExtendParams[0] = {
    representationReset: [async ({ authProfile, agentBanner }, use) => {
        // Anonymous specs (the accessibility and sign-in ones) must start signed out,
        // and a profile that cannot represent has no banner to clear - either way there
        // is nothing to do and no reason to navigate.
        if (authProfile && canRepresentTraders(authProfile)) {
            const cleared = await agentBanner.stopRepresenting();

            // Silent in the ordinary case: a reset that found nothing is not a step
            // anybody needs to read, and 40-odd of them would bury the ones that matter.
            // A test that started dirty says so, because that means some earlier test
            // did not end where it thought it did.
            if (cleared) {
                ReportLog.setParameter(
                    'Representation on entry',
                    'left over from an earlier test - cleared'
                );
            }
        }

        await use();

        // Nothing after use() on purpose - see the note on the type above.
    }, { auto: true }],
};
