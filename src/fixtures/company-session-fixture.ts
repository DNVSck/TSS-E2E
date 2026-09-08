import { test, BrowserContext, Page } from '@playwright/test';
import { BASE_URL } from '../../config/environment';
import { CompanyProfile, accountFor } from '../auth/credentials';
import { authStatePath, isSessionYoungEnough, sessionFor } from '../auth/auth-state';
import { BasePage } from '../page-object/base-page';
import { SignInPage } from '../page-object/sign-in-page';
import { SignInFlow } from '../flows/sign-in-flow';
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
import { AddNewGMRFlow } from '../flows/add-new-gmr-flow';
import { GmrDeclarePage } from '../page-object/gmr-declare-page';
import { GmrDetailsPage } from '../page-object/gmr-details-page';
import { ExternalContactDeclarePage } from '../page-object/external-contact-declare-page';
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
     * The movement's GMR, for a company that has to CHANGE one rather than read it.
     *
     * A GMR belongs to whoever moves the goods, so the company that corrects it is
     * often not the account that created it - a haulier picks up a GMR an agent
     * submitted on its behalf. Without this the exercise half of that test would have
     * to be done from the agent's browser, which proves the wrong thing: the agent had
     * already submitted it once.
     */
    readonly gmr: AddNewGMRFlow;

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
 * Only the slice an authority test needs is assembled, not the whole graph. These
 * constructor calls repeat flow-fixture's deliberately: a shared builder was tried on
 * 2026-09-02 and taken back out - it is the same four lines either way, and one file
 * that plainly says what it builds beats two files that have to be read together.
 */
function buildCompanySession(
    page: Page,
    t: LocaleFixtureType['t'],
    profile: string
): Omit<CompanySession, 'close'> {
    const record = new ConsignmentDetailPage(page, t);
    const overview = new ConsignmentOverviewPage(page, t);
    const movement = new MovementOverviewPage(page, t);

    const previousDocumentDeclarePage = new PreviousDocumentDeclarePage(page);

    return {
        consignment: new ConsignmentOverviewFlow(
            overview,
            previousDocumentDeclarePage,
            new HolderOfAuthorisationDeclarePage(page),
            record,
            new ConsignmentSteps(movement, new ConsignmentDeclarePage(page)),
            t
        ),
        declarations: new DeclarationAccessFlow(
            movement, record, new PortalPage(page), new DeclarationSearchPage(page), overview, t, profile
        ),
        gmr: new AddNewGMRFlow(
            movement,
            new GmrDeclarePage(page),
            new GmrDetailsPage(page, t),
            new ExternalContactDeclarePage(page),
            t,
        ),
        goods: new GoodsOverviewFlow(
            new GoodsOverviewPage(page, t),
            new DocumentReferenceDeclarePage(page),
            new AdditionalInformationDeclarePage(page),
            previousDocumentDeclarePage,
            new AdditionalProcedureCodeDeclarePage(page),
            new TaricAdditionalCodeDeclarePage(page),
            new NationalAdditionalCodeDeclarePage(page),
            t,
        ),
    };
}

export type CompanySessionFixtureType = {
    openAs: (profile: CompanyProfile) => Promise<CompanySession>;
};

type ExtendParams = Parameters<
    typeof test.extend<CompanySessionFixtureType & LocaleFixtureType & WorkerAuthFixtureType>
>;

export const companySessionFixture: ExtendParams[0] = {
    openAs: async ({ browser, t }, use, testInfo) => {
        const opened: BrowserContext[] = [];

        await use(async (profile: CompanyProfile): Promise<CompanySession> => {
            // Nothing serialises here. A company only one account can be signed in as
            // must not be opened by two tests at once, and that is declared by the spec
            // as a named lock - the runner will not start two tests sharing one, so no
            // worker sits waiting inside a fixture for its turn.
            //
            const account = accountFor(profile, testInfo.parallelIndex);
            const replayable = isSessionYoungEnough(account.profile, account.accountNumber);
            const context = await browser.newContext({
                storageState: replayable
                    ? sessionFor(profile, testInfo.parallelIndex)
                    : { cookies: [], origins: [] },
            });
            opened.push(context);

            const page = await context.newPage();

            if (!replayable) {

                const startedAt = Date.now();

                await new SignInFlow(
                    new BasePage(page), new PortalPage(page), new SignInPage(page)
                ).signIn(account, { baseUrl: BASE_URL, testInfo });

                // Kept for the rest of the run, so a second test asking for this company
                // replays rather than spending another login on it.
                await context.storageState({
                    path: authStatePath(account.profile, account.accountNumber),
                });

                // Signing in must not come out of the test's own budget. A timeout of 0
                // means no timeout - the debug runners set it - and adding to that would
                // turn "unlimited" into a few seconds.
                const signInMs = Date.now() - startedAt;
                if (signInMs > 0 && testInfo.timeout > 0) {
                    testInfo.setTimeout(testInfo.timeout + signInMs);
                }
            }

            return {
                ...buildCompanySession(page, t, profile),
                close: () => context.close(),
            };
        });

        // Whatever a test did not close itself. Closing an already-closed context is a
        // no-op, so an early close() costs nothing.
        await Promise.allSettled(opened.map(context => context.close()));
    },
};
