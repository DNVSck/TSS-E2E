import { test, BrowserContext, Page } from '@playwright/test';
import {
    CompanyProfile, accountFor, isSingleAccountProfile, isOnDemandProfile,
} from '../auth/credentials';
import { sessionFor } from '../auth/auth-state';
import { signInOnDemand } from '../auth/ensure-auth-state';
import { acquireAccountLock, AccountLock } from '../auth/account-lock';
import { WorkerAuthFixtureType } from './worker-auth-fixture';
import { ConsignmentDetailPage } from '../page-object/consignment-detail-page';
import { ConsignmentOverviewPage } from '../page-object/consignment-overview-page';
import { ConsignmentDeclarePage } from '../page-object/consignment-declare-page';
import { MovementOverviewPage } from '../page-object/movement-overview-page';
import { PreviousDocumentDeclarePage } from '../page-object/header-previous-documents-declare-page';
import { HolderOfAuthorisationDeclarePage } from '../page-object/holder-of-authorisation-declare-page';
import { ConsignmentSteps } from '../flows/consignment/consignment-steps';
import { ConsignmentOverviewFlow } from '../flows/consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../flows/goods-item/goods-overview-flow';
import { GoodsOverviewPage } from '../page-object/goods-overview-page';
import { DocumentReferenceDeclarePage } from '../page-object/document-reference-declare-page';
import { AdditionalInformationDeclarePage } from '../page-object/additional-information-declare-page';
import { AdditionalProcedureCodeDeclarePage } from '../page-object/additional-procedure-code-declare-page';
import { TaricAdditionalCodeDeclarePage } from '../page-object/taric-additional-code-declare-page';
import { NationalAdditionalCodeDeclarePage } from '../page-object/national-additional-code-declare-page';
import { DeclarationAccessFlow } from '../flows/declaration-access-flow';
import { PortalPage } from '../page-object/portal-page';
import { DeclarationSearchPage } from '../page-object/declaration-search-page';
import { LocaleFixtureType } from './locale-fixture';

/**
 * A second company, signed in alongside the one the test itself runs as.
 *
 * It hands back the SAME flows the rest of the suite uses, bound to this company's
 * own page, rather than a wrapper of its own. Reading is not enough on its own: the
 * permission table says some companies hold Full, and the only honest proof of Full
 * is exercising it - correcting a rejected declaration and putting it back in. A
 * company merely SHOWN a Change link has not been shown the service accepts changes.
 */
export interface CompanySession {
    /**
     * Asking what this company may see and do - the same flow the test's own company
     * uses, built with its name so a report tells the two answers apart.
     *
     * The whole flow rather than the one method an authority test started with: opening
     * a record by URL says whether the service will SERVE it, searching the declarations
     * overview says whether this company is shown it EXISTS, and a rule about access is
     * only half asked without both.
     */
    readonly declarations: DeclarationAccessFlow;

    /** Correcting and submitting, through the flow every other spec uses. */
    readonly consignment: ConsignmentOverviewFlow;

    /**
     * The same, a level down. Some rejections are corrected on the GOODS ITEM rather
     * than the consignment - a document reference naming the wrong party, say - and a
     * company that holds Full has to be able to reach those too.
     */
    readonly goods: GoodsOverviewFlow;

    /**
     * Close this company's window as soon as it has done its part.
     *
     * Optional - the fixture closes whatever is left at the end of the test - but
     * worth calling in a test that carries on afterwards as somebody else: two open
     * windows showing the same declaration are easy to confuse while watching a run,
     * and the second one has nothing left to say.
     */
    close(): Promise<void>;
}

/**
 * Wire up one company's view of the service on its own page.
 *
 * This is DI, not business logic - the same job flow-fixture does for the primary
 * page, which is why it lives here beside the fixture rather than among the flows.
 * It knows only which objects to construct; every rule about what the screens MEAN
 * stays in the flows it builds.
 *
 * Only the slice an authority test needs is assembled, not the whole graph. Each
 * constructor repeated here has to be kept in step with flow-fixture by hand - the
 * compiler catches a drift at once, and the way to keep that cheap is to copy little.
 */
function buildCompanySession(
    page: Page,
    t: LocaleFixtureType['t'],
    profile: string
): Omit<CompanySession, 'close'> {
    const record = new ConsignmentDetailPage(page, t);
    const overview = new ConsignmentOverviewPage(page, t);
    const movement = new MovementOverviewPage(page, t);

    return {
        consignment: new ConsignmentOverviewFlow(
            overview,
            new PreviousDocumentDeclarePage(page),
            new HolderOfAuthorisationDeclarePage(page),
            record,
            new ConsignmentSteps(movement, new ConsignmentDeclarePage(page)),
            t
        ),
        declarations: new DeclarationAccessFlow(
            movement, record, new PortalPage(page), new DeclarationSearchPage(page), overview, t, profile
        ),
        goods: new GoodsOverviewFlow(
            new GoodsOverviewPage(page, t),
            new DocumentReferenceDeclarePage(page),
            new AdditionalInformationDeclarePage(page),
            new PreviousDocumentDeclarePage(page),
            new AdditionalProcedureCodeDeclarePage(page),
            new TaricAdditionalCodeDeclarePage(page),
            new NationalAdditionalCodeDeclarePage(page),
            t,
        ),
    };
}

export type CompanySessionFixtureType = {
    /**
     * Sign in as a second company for the rest of this test.
     *
     * Permission rules are comparisons - "this company may, that one may not" - and
     * both halves have to be asked of the SAME record, which only exists inside the
     * test that built it. `test.use({ authProfile })` cannot do that: it is set per
     * describe block, so it names one company for the whole file.
     *
     * A second BrowserContext can. It is an entirely separate cookie jar and
     * localStorage, so the two sessions never see each other and nothing has to be
     * signed out - which matters, because the test still needs the first session
     * afterwards, and signing in for real mid-test would spend a TOTP code the suite
     * has already used this window.
     *
     * Which session file the profile resolves to is NOT decided here: it comes from
     * sessionFor(), the same rule the worker's own storageState obeys. That is
     * deliberate - the two once disagreed, and the second session quietly replayed a
     * leftover `AGENT.json` while the worker used `AGENT-2.json`.
     *
     * Contexts opened here are closed when the test ends, so a caller never has to.
     *
     * A single-login company IS serialised, with the same disk lock authAccount uses.
     * Measured 2026-08-17: without it, two workers open one server-side session and the
     * first to call close() takes the other's page with it - "locator.count: Target page,
     * context or browser has been closed", mid-read, in a test that did nothing wrong.
     * The lock is held until the window closes, so the two take turns instead.
     *
     * A profile the SPEC ITSELF runs as is skipped: authAccount already holds that lock
     * for the whole test, and asking for it again in the same process would wait on
     * itself for ever.
     */
    openAs: (profile: CompanyProfile) => Promise<CompanySession>;
};

type ExtendParams = Parameters<
    typeof test.extend<CompanySessionFixtureType & LocaleFixtureType & WorkerAuthFixtureType>
>;

export const companySessionFixture: ExtendParams[0] = {
    openAs: async ({ browser, t, authProfile }, use, testInfo) => {
        const opened: { context: BrowserContext; lock?: AccountLock }[] = [];

        await use(async (profile: CompanyProfile): Promise<CompanySession> => {
            // Queue for a company only one account can be signed in as - see the note on
            // openAs. The spec's own profile is skipped: authAccount holds that lock
            // already, and this process cannot wait on itself.
            const lock = isSingleAccountProfile(profile) && profile !== authProfile
                ? await acquireAccountLock(accountFor(profile, testInfo.parallelIndex), testInfo.title)
                : undefined;

            // Queueing must not come out of the test's own budget, or the LAST test in
            // the queue fails rather than the slow one. A timeout of 0 means no timeout
            // (the debug runners set it), and adding to that would make it two.
            if (lock && lock.waitedMs > 0 && testInfo.timeout > 0) {
                testInfo.setTimeout(testInfo.timeout + lock.waitedMs);
            }

            if (isOnDemandProfile(profile)) {
                const startedAt = Date.now();
                await signInOnDemand(profile, testInfo.parallelIndex);
                const signInMs = Date.now() - startedAt;

                if (signInMs > 0 && testInfo.timeout > 0) {
                    testInfo.setTimeout(testInfo.timeout + signInMs);
                }
            }

            const context = await browser.newContext({
                storageState: sessionFor(profile, testInfo.parallelIndex),
            });
            opened.push({ context, lock });

            return {
                ...buildCompanySession(await context.newPage(), t, profile),
                close: async () => {
                    await context.close();
                    lock?.release();
                },
            };
        });

        // Whatever a test did not close itself. Closing an already-closed context is a
        // no-op, and releasing a released lock is too, so an early close() costs nothing.
        for (const { context, lock } of opened) {
            await context.close();
            lock?.release();
        }
    },
};
