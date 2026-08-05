import { ReportLog } from '../core/report/report-log';
import { UserCredentials } from '../auth/credentials';
import { GoodsData } from '../test-data/goods-data';
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
 * Surface the procedure codes a goods item declares, so a report can be read without
 * opening the spec that produced it.
 *
 * Parameters rather than log lines: they sit in a table at the head of the test, which
 * is where someone scanning a run looks, and Allure can group and compare runs by them
 * - "every 4051 test failed" is visible at a glance, which is the question these codes
 * are usually asked in.
 *
 * The three are reported apart because the app treats them apart, and conflating them
 * is the usual mistake: the procedure code and the additional procedure code are two
 * separate screens of the goods wizard, while the third is a LIST declared afterwards
 * on the goods-item overview tab, on top of the second - not instead of it.
 *
 * Shared by all four common flows, which is what earns it a place here.
 */
export function reportDeclarationCodes(goods: GoodsData): void {
    ReportLog.setParameter('Procedure code', goods.procedureCode);
    ReportLog.setParameter('Additional procedure code', goods.additionalProcedureCode);

    // Omitted rather than reported empty: most journeys declare none, and a column of
    // blanks buries the few runs where this actually carries something.
    if (goods.additionalProcedureCodes.length > 0) {
        ReportLog.setParameter(
            'Additional procedure codes (tab)',
            goods.additionalProcedureCodes.join(', ')
        );
    }
}

/**
 * Link a spec to its case in THIS service's test management system. The tracker URL
 * lives here rather than in ReportLog so the report facade stays generic - a spec
 * still passes only the case id, which is all it should have to know.
 */
export function reportTestCaseLink(testCaseId: string): void {
    ReportLog.setTestCaseLink(testCaseId, `${TEST_LINK_CONFIG.TEST_CASES_URL}${testCaseId}`);
}
