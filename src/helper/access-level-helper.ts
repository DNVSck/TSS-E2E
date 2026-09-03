import { expect, test } from '@playwright/test';
import { DeclarationAccess, TabAccess, enabledActions, wasRefused } from '../flows/declaration-access-flow';
import { RecordTab } from '../constant/record-tab-constant';
import { CONSIGNMENT_ACTION } from '../constant/consignment-action-constant';
import { AccessLevel } from '../constant/access-level-constant';


export const PARTY = {
    agent: 'the Agent on its own account',
    agentAsImporter: 'the Agent acting as the Importer',
    agentAsHaulier: 'the Agent acting as the Haulier',
    agentNotRepresenting: 'the Agent representing nobody',
    anotherAgent: 'a second Agent company with no part in the declaration',
    haulier: 'the Haulier on its own login',
    importer: 'the Importer on its own login',
} as const;

export type Party = keyof typeof PARTY;

/**
 * The heading a party's reads are gathered under.
 *
 * One authority test makes dozens of reads across two levels and fourteen tabs. Flat,
 * they are one long list in which the company each answer belongs to is easy to lose.
 *
 * The expected LEVEL is in the title because it is the one thing a reader cannot
 * recover from the step: the record and the company are named in every line beneath,
 * but which of Full, Read or None this party was supposed to get lives only in the
 * authority table, in another file.
 */
export const authorityStepTitle = (party: Party, level: AccessLevel, what: string): string =>
    `Authority: ${PARTY[party]} - ${level} on ${what}`;

/**
 * What one assertion about one party is called in the report and in its failure.
 *
 * A sentence, not a list of fragments: this string IS the "Error:" line a tester reads
 * first, and it has to answer who was asking, what was expected of them, and of which
 * record - before they start reading a diff. The old form ("the GMR the Agent made as
 * the Agent on its own account") named the record and the party but never the
 * expectation, so a diff of two tab names looked like a service fault when it was a
 * stale constant.
 */
export const authorityLabel = (party: Party, level: AccessLevel, what: string): string =>
    `${PARTY[party]} should have ${level} on ${what}`;

/**
 * None: the service shows its refusal page instead of the record.
 *
 * Asserted on the HEADING A PERSON READS, not on the 403 behind it. The status is a
 * fact about the transport and an API test's business; here the thing being promised
 * is that someone typing the URL is told, in words, that they may not see it. A blank
 * page or an unrelated error would carry the same status and must not pass.
 *
 * `expectedHeading` comes from the caller so it arrives through t() - this stays
 * correct in Welsh without the helper knowing anything about locales.
 */
export function expectNoAccess(
    access: DeclarationAccess,
    what: string,
    expectedHeading: string
): void {
    expect.soft(wasRefused(access), `${what} - refusal page shown instead of the record`).toBe(true);
    expect.soft(access.refusalHeading, `${what} - refusal heading`).toBe(expectedHeading);
    expect.soft(access.rowCount, `${what} - record rows rendered (a refusal shows none)`).toBe(0);
}

/**
 * The record is there and this company may see it. Makes NO claim about actions.
 *
 * For the states where nobody is offered anything - a consignment "Awaiting arrival"
 * shows no actions to its own owner - so asserting that none are offered would pass
 * whatever the company's authority was. Being able to see it is the only thing that
 * means anything there, and naming that explicitly stops the missing action check
 * reading as an oversight.
 */
function expectVisible(access: DeclarationAccess, what: string): void {
    expect.soft(access.reachable, `${what} - record reachable`).toBe(true);
    // The anchor every absence check below needs: "offers nothing" passes just as
    // happily on a page that never rendered.
    expect.soft(access.rowCount, `${what} - record rows rendered`).toBeGreaterThan(0);
}

/** Read: visible, but the screen offers this company nothing it can act on. */
export function expectReadOnly(access: DeclarationAccess, what: string): void {
    expectVisible(access, what);
    // toEqual([]) rather than a length check: a failure then names what leaked.
    expect.soft(access.actionHrefs, `${what} - fields offered to change (Read expects none)`)
        .toEqual([]);
    // ENABLED rather than present, because the service withholds an action two ways -
    // omitting the button, or rendering it disabled - and this is the one question
    // both answers agree on. See BasePage.listActionButtons.
    expect.soft(enabledActions(access), `${what} - actions offered (Read expects none)`)
        .toEqual([]);
}

/**
 * Full: visible, with fields to change and something usable to do.
 *
 * `requiredActions` names the ones that must be live where it matters - a consignment
 * has "Confirm and submit" and "Cancel", a goods item has neither, so demanding them
 * everywhere would fail a level that is genuinely Full. Left out, this asserts only
 * that SOMETHING is usable, which is what Full means at any depth.
 */
export function expectFullControl(
    access: DeclarationAccess,
    what: string,
    requiredActions: readonly string[] = []
): void {
    expectVisible(access, what);
    expect.soft(access.actionHrefs, `${what} - fields offered to change (Full expects at least one)`)
        .not.toEqual([]);

    if (requiredActions.length === 0) {
        expect.soft(enabledActions(access), `${what} - actions offered (Full expects at least one)`)
            .not.toEqual([]);
        return;
    }

    // The required list is spelled into the message: arrayContaining prints the whole
    // matcher object in its diff, which is where a reader stops being able to see which
    // single action went missing.
    expect.soft(enabledActions(access),
        `${what} - actions offered (must include ${requiredActions.join(', ')})`)
        .toEqual(expect.arrayContaining([...requiredActions]));
}

/** The actions on a tab that would remove one of its records. */
const enabledDeletes = (access: DeclarationAccess): string[] =>
    enabledActions(access).filter(action => action.startsWith(CONSIGNMENT_ACTION.DELETE_PREFIX));

/**
 * What is on the tab and was not already on the record.
 *
 * A record's own summary list and its page buttons sit OUTSIDE the tab panel, so they
 * are in the DOM whichever tab is open. Asserted per tab, one leaked Change link is
 * reported once per tab - five findings for one fault, each pointing at a tab that has
 * nothing to do with it. The record check has already made that claim once.
 *
 * What survives the subtraction is what the tab itself offers: its create button, and
 * the edit and delete on the records it lists - which appear only while it is open.
 */
const beyond = (onTab: string[], onRecord: string[]): string[] =>
    onTab.filter(one => !onRecord.includes(one));

/** The actions on a tab that would open one of its records for change. */
const enabledEdits = (access: DeclarationAccess): string[] =>
    enabledActions(access).filter(action => action.startsWith(CONSIGNMENT_ACTION.EDIT_PREFIX));

/**
 * Every tab was visited, and the expected ones were there.
 *
 * Run before either sweep below, because both are mostly ABSENCE checks and a tab
 * that never loaded offers nothing just as convincingly as one that withholds
 * everything. Names, not a count: a failure then says which tab went missing.
 */
function expectEveryTabVisited(tabs: TabAccess[], what: string, expected: readonly RecordTab[]): void {
    // "panel ids" because the diff is otherwise unreadable: these are not the tab
    // labels on screen, and a tester comparing them against the page would find neither
    // string anywhere on it.
    expect.soft(tabs.map(tab => tab.name), `${what} - tabs shown (panel ids, in order)`)
        .toEqual(expected.map(tab => tab.name));

    for (const tab of tabs) {
        expect.soft(tab.access.rowCount, `${what} - "${tab.name}" tab rows rendered`)
            .toBeGreaterThan(0);
    }
}

/**
 * Full, tab by tab: every record can be opened and removed, and every tab that offers
 * a create action offers it to this company.
 *
 * `expected` says which tabs have a create action at all, because three of them have
 * none for ANYBODY - Guarantee type, Documents, Attachments (measured 2026-08-14).
 * Demanding one everywhere would fail a service behaving correctly; demanding none
 * would pass a service that had stopped rendering them. The table is the difference.
 *
 * `alwaysEnabled` names the page-level actions that ride along on every tab: a
 * consignment carries "Confirm and submit" and "Cancel" below the panel, a goods item
 * carries neither.
 *
 * Returns the names of the tabs that failed, and does nothing with them. A tab is its
 * own route, and by the time these assertions run the sweep has already left it - so
 * something has to be able to go back and photograph the right screen, and deciding
 * what a report shows is not this file's job. See checkOneParty.
 */
export function expectFullControlAcrossTabs(
    tabs: TabAccess[],
    what: string,
    expected: readonly RecordTab[],
    alwaysEnabled: readonly string[] = []
): string[] {
    expectEveryTabVisited(tabs, what, expected);
    const failed: string[] = [];

    for (const { name, create, recordsEditedByButton } of expected) {
        const found = tabs.find(tab => tab.name === name);
        if (!found) {
            continue;
        }
        const { access } = found;
        const errorsBefore = test.info().errors.length;
        const actions = enabledActions(access);

        if (create) {
            expect.soft(actions, `${what} - "${name}" tab create action (must include "${create}")`)
                .toContain(create);
        }
        if (alwaysEnabled.length > 0) {
            expect.soft(actions,
                `${what} - "${name}" tab page actions (must include ${alwaysEnabled.join(', ')})`)
                .toEqual(expect.arrayContaining([...alwaysEnabled]));
        }

        // A record is edited by opening it and deleted by its own button, so Full means
        // one of each per record. Counted rather than merely "some", so a screen listing
        // three records and offering one Delete cannot pass.
        //
        // Where the table edits by button, the same demand is made of the button: the
        // rows carry no link there, so counting links would read a correct table as
        // offering nothing, and skipping the check would let a broken one pass.
        const listed = `${access.records.count} record(s) listed`;
        const openRule = recordsEditedByButton
            ? 'this table edits by button, so it links none'
            : `one link per record, ${listed}`;

        expect.soft(access.records.links.length,
            `${what} - "${name}" tab records that open (${openRule})`)
            .toBe(recordsEditedByButton ? 0 : access.records.count);
        if (recordsEditedByButton) {
            expect.soft(enabledEdits(access).length,
                `${what} - "${name}" tab records with an Edit button (one per record, ${listed})`)
                .toBe(access.records.count);
        }
        expect.soft(enabledDeletes(access).length,
            `${what} - "${name}" tab records with a Delete button (one per record, ${listed})`)
            .toBe(access.records.count);

        if (test.info().errors.length > errorsBefore) {
            failed.push(name);
        }
    }

    return failed;
}

/**
 * Read, tab by tab: nothing anywhere is usable.
 *
 * Each tab is asked what IT offers, over what the record already offered: the record's
 * own Change links and page buttons render on every tab, and asserting them again here
 * reports one leak once per tab. See `beyond`.
 *
 * The one exception is written in the table rather than here: a consignment's goods
 * items keep their link for a company that may only read, because reading a
 * declaration means reading its goods too. Every other tab renders its records as
 * plain text, which is the same refusal the buttons make - said in the one place a
 * button never appears.
 */
export function expectReadOnlyAcrossTabs(
    tabs: TabAccess[],
    what: string,
    expected: readonly RecordTab[],
    record: DeclarationAccess
): string[] {
    expectEveryTabVisited(tabs, what, expected);
    const failed: string[] = [];

    for (const { name, readableRecordLinks } of expected) {
        const found = tabs.find(tab => tab.name === name);
        if (!found) {
            continue;
        }
        const { access } = found;
        const errorsBefore = test.info().errors.length;

        // toEqual([]) rather than a length check: a failure then names what leaked.
        // Measured against the record, not against nothing - see `beyond`.
        expect.soft(beyond(enabledActions(access), enabledActions(record)),
            `${what} - "${name}" tab actions of its own (Read expects none)`).toEqual([]);
        expect.soft(beyond(access.actionHrefs, record.actionHrefs),
            `${what} - "${name}" tab fields of its own offered to change (Read expects none)`)
            .toEqual([]);

        const openable = readableRecordLinks ? access.records.count : 0;
        const openRule = readableRecordLinks
            ? `Read keeps the link here, ${access.records.count} record(s) listed`
            : 'Read renders these records as plain text';

        expect.soft(access.records.links.length,
            `${what} - "${name}" tab records that open (${openRule})`)
            .toBe(openable);

        if (test.info().errors.length > errorsBefore) {
            failed.push(name);
        }
    }

    return failed;
}
