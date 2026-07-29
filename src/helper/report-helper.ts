import { ReportLog } from '../core/report/report-log';
import { UserCredentials } from '../auth/credentials';
import { TEST_LINK_CONFIG } from '../constant/test-link.constant';

// Helpers that record DOMAIN facts into the report, sitting on top of ReportLog -
// which stays a thin wrapper over allure/test.step and knows nothing about
// consignments, journeys or accounts. Same split as element-helper: the primitive
// underneath, the value-add named for what it means here.
//
// A one-off ReportLog.setParameter call belongs inline in the flow that makes it.
// What earns a place here is a report call several flows would otherwise repeat, or
// one that carries a rule worth stating once.

/**
 * Surface the account a journey runs as in the report (for tracking). Reads the
 * account the auth fixture actually assigned - the same one whose session
 * `storageState` replayed - so the report can never name a different account than
 * the test signed in as.
 *
 * Shared by every common flow: a spec running one is always signed in, so a null
 * account means it forgot `test.use({ authProfile })`. Throwing rather than
 * reporting "unknown" stops that misconfiguration before the browser opens, where it
 * would otherwise surface much later as an unexplained sign-in screen. `flowName`
 * only shapes the error, so the message names the flow the spec actually called.
 */
export function reportTestAccount(authAccount: UserCredentials | null, flowName: string): void {
    if (!authAccount) {
        throw new Error(
            `${flowName} ran without an authenticated account - ` +
            'the spec must set test.use({ authProfile: ... }).'
        );
    }

    const { username, profile, accountNumber } = authAccount;
    ReportLog.setParameter('Test account', `${username} (${profile} account ${accountNumber ?? 1})`);
}

/**
 * Link a spec to its case in THIS service's test management system. The tracker URL
 * lives here rather than in ReportLog so the report facade stays generic - a spec
 * still passes only the case id, which is all it should have to know.
 */
export function reportTestCaseLink(testCaseId: string): void {
    ReportLog.setTestCaseLink(testCaseId, `${TEST_LINK_CONFIG.TEST_CASES_URL}${testCaseId}`);
}
