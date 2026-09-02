import { expect, test } from '@playwright/test';
import { COMPANY_PROFILE, CompanyProfile } from '../auth/credentials';
import { CompanySession } from '../fixtures/company-session-fixture';
import {
    DeclarationAccessFlow, DeclarationAccess, TabAccess, RecordUrls,
} from './declaration-access-flow';
import { RecordTab, DECLARATION_TABS } from '../constant/record-tab-constant';
import { CONSIGNMENT_ACTION } from '../constant/consignment-action-constant';
import { TFunction } from '../fixtures/locale-fixture';
import { ReportLog } from '../core/report/report-log';
import { attachScreenshotIfFailedSince } from '../helper/report-helper';
import { RepresentTraderFlow } from './represent-trader-flow';
import { ACCESS_LEVEL, AccessLevel } from '../constant/access-level-constant';
import {
    PARTY, Party, authorityLabel, authorityStepTitle,
    expectNoAccess, expectReadOnly, expectFullControl,
    expectReadOnlyAcrossTabs, expectFullControlAcrossTabs,
} from '../helper/access-level-helper';

/**
 * Reads one row of the permission table against the running service.
 *
 * The rules ARE a table - who may do what to which record in which situation - so the
 * tests are a table too, and this is what runs one row of it. Written out by hand, the
 * same twenty lines appeared once per company per state, and they had already drifted:
 * of seven places claiming "this company has Full", no two checked the same facts. A
 * table cannot drift, and a permission that changes becomes one edited cell rather than
 * a hunt through a spec for every place that spelled it out.
 *
 * What it does NOT cover, deliberately: building the declaration, getting it into the
 * state being asked about, and EXERCISING a right (correcting a record and putting it
 * back in). Those differ per journey and per company, and a table that tried to hold
 * them would be a worse version of the code it replaced.
 */

/** What each party may do with one record in one situation - a row of the table. */
export type AuthoritySituation = Partial<Record<Party, AccessLevel>>;

/**
 * The parties that answer from a login of their own rather than from the test's own
 * browser. Everything else is the Agent the spec runs as, in whichever representation
 * the spec has just put it into - which is why those keys name the representation
 * ("agentAsImporter") and not the account.
 */
const OWN_LOGIN: Partial<Record<Party, CompanyProfile>> = {
    importer: COMPANY_PROFILE.IMPORTER,
    haulier: COMPANY_PROFILE.HAULIER,
    anotherAgent: COMPANY_PROFILE.AGENT_B,
};

/**
 * The half of a question that is the same all test long: whose browser is the Agent's,
 * how a second company gets one, and the words the service refuses in.
 *
 * Bound once per test rather than repeated at every call - see authorityCheckerFlowFor.
 */
export interface AuthoritySession {
    /** The test's own browser, signed in as the Agent. */
    agent: DeclarationAccessFlow;
    /** How a party with its own login gets a second browser. */
    openAs: (profile: CompanyProfile) => Promise<CompanySession>;
    /** Reads the refusal heading, so the check stays correct in Welsh. */
    t: TFunction;
}

/** The half that changes: which record, in which situation, asked of whom. */
export interface AuthorityQuestion {
    /** The record being asked about, e.g. "the rejected consignment". */
    what: string;
    /**
     * Where the two records live. A second company never walked the journey that built
     * them, so a URL is the only thing that identifies them across sessions.
     */
    records: RecordUrls;
    /**
     * The tabs each level is swept across. Defaults to DECLARATION_TABS, which every
     * declaration type measured so far shares; pass a table only for a type that has
     * been MEASURED to differ.
     */
    tabs?: { consignment: readonly RecordTab[]; goodsItem: readonly RecordTab[] };
    /**
     * What this record must offer a party holding Full. Defaults to a consignment's
     * submit and cancel; a movement header carries its own actions instead, and a goods
     * item is asked for none - which the runner handles itself.
     */
    recordActions?: readonly string[];
    /**
     * Check only these parties now.
     *
     * The Agent can only be in one representation at a time, so a row naming both
     * "agent" and "agentAsImporter" is measured in two calls with the switch between
     * them. The row still holds the whole truth; this says which part of it is
     * true to ask right now.
     */
    parties?: readonly Party[];
    /**
     * When given, each party's view of the declarations SEARCH is checked as well.
     *
     * The other half of an access question, and the half a URL cannot answer: a record
     * kept out of a company's list is a different promise from one its URL refuses.
     * Costs a portal round trip per party, so a spec asks for it where it means
     * something - a draft that has just been created - rather than everywhere.
     */
    reference?: string;
    /**
     * Parties whose window stays open, and is handed back to the caller.
     *
     * For the company that goes on to EXERCISE what it was just shown - correcting the
     * record and resubmitting it. Everything else is closed as soon as it has answered,
     * so a run being watched shows one browser on the declaration at a time.
     */
    keepOpen?: readonly Party[];
    /**
     * Why this row is asked even though no company on it holds Full - and therefore why
     * assertFalsifiable is stood down for it.
     *
     * There is one honest reason: a record the service lets NOBODY edit, which is what a
     * generated EIDR is. The rule really is "everybody gets Read", so the row states it,
     * and what it still catches is the direction that matters - a company GAINING an
     * action it should not have. What it cannot catch is the screen being empty for some
     * unrelated reason, and that is the cost being accepted here.
     *
     * A sentence rather than a boolean, so the cost has to be argued in writing at the
     * call site and shows up in the report rather than passing quietly.
     */
    unfalsifiableBecause?: string;
    /**
     * Ask the record itself and stop - no goods item, no tab sweep.
     *
     * For a screen that HAS neither: the movement header lists consignments, not goods,
     * and its tabs are those consignment lists rather than the record tabs the sweep
     * expects. Sweeping them would compare against a table that does not describe them.
     */
    surfaceOnly?: boolean;
}

/**
 * Every absence in this row is measured against a presence.
 *
 * "This company is offered nothing" passes just as happily on a screen that offers
 * nobody anything - a submitted consignment, a page that failed to render - so a row
 * that claims Read or None and never claims Full cannot fail, and would sit in the
 * suite looking like coverage. A configuration mistake, not a product failure, so it
 * throws rather than soft-failing.
 */
function assertFalsifiable(situation: AuthoritySituation, what: string): void {
    const levels = Object.values(situation);

    if (levels.some(level => level !== ACCESS_LEVEL.FULL) && !levels.includes(ACCESS_LEVEL.FULL)) {
        throw new Error(
            `The authority row for "${what}" claims ${levels.join(', ')} and gives nobody Full. ` +
            'Every "offered nothing" needs a company offered something on the same record, ' +
            'or the check passes on a screen that is simply empty.'
        );
    }
}

function expectLevel(
    level: AccessLevel,
    access: DeclarationAccess,
    label: string,
    refusalHeading: string,
    requiredActions: readonly string[]
): void {
    if (level === ACCESS_LEVEL.NONE) {
        expectNoAccess(access, label, refusalHeading);
        return;
    }
    if (level === ACCESS_LEVEL.READ) {
        expectReadOnly(access, label);
        return;
    }
    expectFullControl(access, label, requiredActions);
}

/** The names of the tabs that failed - see the note on expectFullControlAcrossTabs. */
function expectLevelAcrossTabs(
    level: AccessLevel,
    tabs: TabAccess[],
    label: string,
    expectedTabs: readonly RecordTab[],
    alwaysEnabled: readonly string[],
    record: DeclarationAccess
): string[] {
    if (level === ACCESS_LEVEL.READ) {
        return expectReadOnlyAcrossTabs(tabs, label, expectedTabs, record);
    }
    return expectFullControlAcrossTabs(tabs, label, expectedTabs, alwaysEnabled);
}


async function attachFailedTabs(
    failed: string[],
    tabs: TabAccess[],
    label: string,
    declarations: DeclarationAccessFlow
): Promise<void> {
    for (const name of failed) {
        const tab = tabs.find(one => one.name === name);
        if (!tab) {
            continue;
        }

        try {
            await declarations.openRecord(tab.access.url);
            ReportLog.addAttachment(
                `FAILED - ${label} - "${name}" tab`,
                await declarations.captureCompanyView(),
                'image/png'
            );
        } catch { /* the failure being illustrated matters more than the picture */ }
    }
}

/**
 * Ask one party everything, at both depths and in every tab.
 *
 * A refused record is asked no further: it rendered no tabs to sweep, and the refusal
 * IS the answer.
 */
async function checkOneParty(
    party: Party,
    level: AccessLevel,
    question: AuthorityQuestion,
    session: AuthoritySession
): Promise<CompanySession | undefined> {
    const {
        what, records,
        tabs = DECLARATION_TABS,
        recordActions = [CONSIGNMENT_ACTION.SUBMIT, CONSIGNMENT_ACTION.CANCEL],
    } = question;

    const profile = OWN_LOGIN[party];
    const ownWindow = profile ? await session.openAs(profile) : undefined;
    const declarations = ownWindow?.declarations ?? session.agent;

    const refusalHeading = session.t('accessDenied.heading');
    const consignmentLabel = authorityLabel(party, level, what);
    const goodsLabel = authorityLabel(party, level, `${what} goods item`);


    let handBack = false;

    // Soft assertions do not throw, so "did this company fail?" cannot be caught - it
    // has to be counted. Playwright collects each soft failure on testInfo.errors, so
    // the difference across this block is exactly what THIS party got wrong.
    const errorsBefore = test.info().errors.length;
    let threw = false;

    try {
        // Searching first, because it navigates away from whatever is open.
        if (question.reference !== undefined) {
            const matches = await declarations.searchForDeclaration(question.reference);
            const listed = expect.soft(matches, `${consignmentLabel} - listed in the declarations search`);
            if (level === ACCESS_LEVEL.NONE) {
                listed.toEqual([]);
            } else {
                listed.not.toEqual([]);
            }
        }

        const consignment = await declarations.readAccessAt(what, records.consignment);
        expectLevel(level, consignment, consignmentLabel, refusalHeading, recordActions);

        const deeperToAsk = level !== ACCESS_LEVEL.NONE && !question.surfaceOnly;

        if (deeperToAsk) {
            const consignmentTabs = await declarations.readEveryTabAccess(what);
            const failed = expectLevelAcrossTabs(level, consignmentTabs, consignmentLabel,
                tabs.consignment, recordActions, consignment);

            await attachFailedTabs(failed, consignmentTabs, consignmentLabel, declarations);
            // Back to the record, so the goods-item checks below and the party-level
            // screenshot in the finally both start from where they expect to.
            await declarations.openRecord(records.consignment);
        }

        if (records.goodsItem !== undefined) {
            const goodsItem = await declarations.readAccessAt(`${what} goods item`, records.goodsItem);
            // No required actions: submit and cancel belong to the consignment, so a goods
            // item holds Full without them.
            expectLevel(level, goodsItem, goodsLabel, refusalHeading, []);

            if (deeperToAsk) {
                const goodsTabs = await declarations.readEveryTabAccess(`${what} goods item`);
                const failed = expectLevelAcrossTabs(
                    level, goodsTabs, goodsLabel, tabs.goodsItem, [], goodsItem);

                await attachFailedTabs(failed, goodsTabs, goodsLabel, declarations);
                await declarations.openRecord(records.goodsItem);
            }
        }

        handBack = Boolean(ownWindow) && Boolean(question.keepOpen?.includes(party));
        return handBack ? ownWindow : undefined;
    } catch (error) {
        // Recorded, not handled - so the screenshot below knows to fire. A read that
        // TIMES OUT is the loudest failure a party can have and the one whose page most
        // needs photographing, yet a soft-error count cannot see it.
        threw = true;
        throw error;
    } finally {
        await attachScreenshotIfFailedSince(
            errorsBefore, consignmentLabel, () => declarations.captureCompanyView(), threw
        );

        if (ownWindow && !handBack) {
            await ownWindow.close();
        }
    }
}

/**
 * Asks rows of the permission table, one party at a time, each under its own step.
 *
 * Returns the windows the caller asked to keep open, so a company that has just been
 * shown it may correct a record can go on and do it.
 */
export type AuthorityCheckerFlow = (
    situation: AuthoritySituation,
    question: AuthorityQuestion
) => Promise<Partial<Record<Party, CompanySession>>>;

/**
 * Bind the session half of a question once, and get back something that asks the rest.
 *
 * A test asks the table three or four times, and the browser, the way to open a second
 * one and the refusal wording are the same every time. Passing them at each call put
 * five identical lines in front of the two that differed.
 */
export function authorityCheckerFlowFor(session: AuthoritySession): AuthorityCheckerFlow {
    return async (situation, question) => {
        if (question.unfalsifiableBecause) {
            ReportLog.setParameter(
                `${question.what} - no contrast available`, question.unfalsifiableBecause
            );
        } else {
            assertFalsifiable(situation, question.what);
        }

        const kept: Partial<Record<Party, CompanySession>> = {};

        for (const party of question.parties ?? (Object.keys(situation) as Party[])) {
            const level = situation[party];
            if (level === undefined) {
                throw new Error(
                    `The authority row for "${question.what}" says nothing about ${PARTY[party]}.`
                );
            }

            const stayedOpen = await ReportLog.step(authorityStepTitle(party, level, question.what),
                () => checkOneParty(party, level, question, session));
            if (stayedOpen) {
                kept[party] = stayedOpen;
            }
        }

        return kept;
    };
}

/**
 * Give the representation up, then ask the same question of the same record again.
 *
 * The second half of every representation test, and the half that carries the claim:
 * a company shown a record while it acts for somebody is only interesting if the same
 * account is shown something DIFFERENT once it stops. It is also the half that needs
 * no lever to mean anything: nothing about the record changed, only who is asking.
 *
 * Written out, the pair appeared eight times with three words of English between
 * them, and a step that is copied eight times is a step that gets updated seven.
 * eight times is a step that gets updated seven.
 *
 * `subject` completes "check ..." - what this record is, in the sentence a reader of
 * the report meets it in.
 */
export const checkRefusedOnceRepresentationEnds = (
    representTraderFlow: RepresentTraderFlow,
    checkAuthorityFlow: AuthorityCheckerFlow,
    situation: AuthoritySituation,
    question: Omit<AuthorityQuestion, 'parties'>,
    subject: string,
): Promise<void> =>
    ReportLog.step(`The same account representing nobody - check ${subject}`, async () => {
        await representTraderFlow.stopRepresenting();
        await checkAuthorityFlow(situation, { ...question, parties: ['agentNotRepresenting'] });
    });