import { expect } from '@playwright/test';
import { DeclarationAccess, TabAccess, enabledActions, wasRefused } from '../flows/declaration-access-flow';
import { RecordTab } from '../constant/record-tab-constant';
import { CONSIGNMENT_ACTION } from '../constant/consignment-action-constant';

/**
 * The permission levels the authority rules are written in, as assertions.
 *
 * They exist because the levels were being spelled out by hand at every check, and
 * had already drifted: of seven places claiming "this company has Full", no two
 * asserted the same set of facts, and one asserted a single one of them. A weaker
 * check still passes, so nothing ever pointed it out. Naming the level once means a
 * new case cannot accidentally assert less than the case beside it.
 *
 * This does NOT move the verdict into the flow. DeclarationAccessFlow still reports
 * facts and nothing else; what a level MEANS is a reading of the permission table,
 * and it stays on the test side of that line - written once instead of twenty times.
 *
 * Soft throughout: one wrong level should not hide the others, so a run reports the
 * whole row of the table rather than stopping at its first mistake.
 *
 * `what` names the record AND the company asking, e.g. "the rejected SFD as the
 * Agent" - both halves matter, because the same record answers differently depending
 * on who opened it, and the label is what tells them apart in the report.
 */

/**
 * The principals the permission rules distinguish.
 *
 * Spelled out rather than composed from a company name, because "the Agent acting for
 * the Importer" and "the Importer on its own login" are different askers that a company
 * name alone would collapse into one - and the whole point of these tests is which of
 * them was offered what.
 *
 * The keys are what an authority table is written in; the values are what a report and
 * a failure message say.
 */
export const PARTY = {
    agent: 'the Agent on its own account',
    agentAsImporter: 'the Agent acting as the Importer',
    agentNotRepresenting: 'the Agent representing nobody',
    anotherAgent: 'a second Agent company with no part in the declaration',
    importer: 'the Importer on its own login',
} as const;

export type Party = keyof typeof PARTY;

/**
 * The heading a party's reads are gathered under.
 *
 * One authority test makes dozens of reads across two levels and fourteen tabs. Flat,
 * they are one long list in which the company each answer belongs to is easy to lose.
 */
export const authorityStepTitle = (party: Party, what: string): string =>
    `Authority: ${PARTY[party]} - ${what}`;

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
    expect.soft(wasRefused(access), `${what} - a page shown instead of the record`).toBe(true);
    expect.soft(access.refusalHeading, `${what} - refusal heading`).toBe(expectedHeading);
    expect.soft(access.rowCount, `${what} - record content shown`).toBe(0);
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
export function expectVisible(access: DeclarationAccess, what: string): void {
    expect.soft(access.reachable, `${what} - reachable`).toBe(true);
    // The anchor every absence check below needs: "offers nothing" passes just as
    // happily on a page that never rendered.
    expect.soft(access.rowCount, `${what} - rows rendered`).toBeGreaterThan(0);
}

/** Read: visible, but the screen offers this company nothing it can act on. */
export function expectReadOnly(access: DeclarationAccess, what: string): void {
    expectVisible(access, what);
    // toEqual([]) rather than a length check: a failure then names what leaked.
    expect.soft(access.actionHrefs, `${what} - fields offered to change`).toEqual([]);
    // ENABLED rather than present, because the service withholds an action two ways -
    // omitting the button, or rendering it disabled - and this is the one question
    // both answers agree on. See BasePage.listActionButtons.
    expect.soft(enabledActions(access), `${what} - actions offered`).toEqual([]);
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
    expect.soft(access.actionHrefs, `${what} - fields offered to change`).not.toEqual([]);

    if (requiredActions.length === 0) {
        expect.soft(enabledActions(access), `${what} - actions offered`).not.toEqual([]);
        return;
    }

    expect.soft(enabledActions(access), `${what} - actions offered`)
        .toEqual(expect.arrayContaining([...requiredActions]));
}

/** The actions on a tab that would remove one of its records. */
const enabledDeletes = (access: DeclarationAccess): string[] =>
    enabledActions(access).filter(action => action.startsWith(CONSIGNMENT_ACTION.DELETE_PREFIX));

/**
 * Every tab was visited, and the expected ones were there.
 *
 * Run before either sweep below, because both are mostly ABSENCE checks and a tab
 * that never loaded offers nothing just as convincingly as one that withholds
 * everything. Names, not a count: a failure then says which tab went missing.
 */
function expectEveryTabVisited(tabs: TabAccess[], what: string, expected: readonly RecordTab[]): void {
    expect.soft(tabs.map(tab => tab.name), `${what} - tabs shown`)
        .toEqual(expected.map(tab => tab.name));

    for (const tab of tabs) {
        expect.soft(tab.access.rowCount, `${what} - ${tab.name} tab rendered`).toBeGreaterThan(0);
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
 */
export function expectFullControlAcrossTabs(
    tabs: TabAccess[],
    what: string,
    expected: readonly RecordTab[],
    alwaysEnabled: readonly string[] = []
): void {
    expectEveryTabVisited(tabs, what, expected);

    for (const { name, create } of expected) {
        const found = tabs.find(tab => tab.name === name);
        if (!found) {
            continue;
        }
        const { access } = found;
        const actions = enabledActions(access);

        if (create) {
            expect.soft(actions, `${what} - ${name} tab offers "${create}"`).toContain(create);
        }
        if (alwaysEnabled.length > 0) {
            expect.soft(actions, `${what} - ${name} tab still offers the page actions`)
                .toEqual(expect.arrayContaining([...alwaysEnabled]));
        }

        // A record is edited by opening it and deleted by its own button, so Full means
        // one of each per record. Counted rather than merely "some", so a screen listing
        // three records and offering one Delete cannot pass.
        expect.soft(access.records.links.length, `${what} - ${name} tab records that open`)
            .toBe(access.records.count);
        expect.soft(enabledDeletes(access).length, `${what} - ${name} tab records that delete`)
            .toBe(access.records.count);
    }
}

/**
 * Read, tab by tab: nothing anywhere is usable.
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
    expected: readonly RecordTab[]
): void {
    expectEveryTabVisited(tabs, what, expected);

    for (const { name, readableRecordLinks } of expected) {
        const found = tabs.find(tab => tab.name === name);
        if (!found) {
            continue;
        }
        const { access } = found;

        // toEqual([]) rather than a length check: a failure then names what leaked.
        expect.soft(enabledActions(access), `${what} - ${name} tab actions offered`).toEqual([]);
        expect.soft(access.actionHrefs, `${what} - ${name} tab fields offered to change`).toEqual([]);

        const openable = readableRecordLinks ? access.records.count : 0;
        expect.soft(access.records.links.length, `${what} - ${name} tab records that open`)
            .toBe(openable);
    }
}
