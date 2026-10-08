import { expect, TestInfo } from '@playwright/test';
import type AxeBuilder from '@axe-core/playwright';
import { BasePage, WizardStep } from '../page-object/base-page';
import { RecordTabs } from '../page-object/components/record-tabs';
import { StringUtil } from '../core/util/string-util';
import { ReportLog } from '../core/report/report-log';
import {
    attachScreenReport, attachText, CriterionRow, outcomeForRules, scanOutcome, scopeOf,
    sightingsOf, violationDigest, violationReport, violationSummary, ViolationSighting, ViolationTally,
} from '../core/report/accessibility-report';
import { BEST_PRACTICE_TAGS } from '../constant/accessibility-rules';
import { readAccessibilityScan } from '../core/util/accessibility-scanner';
import { UNDERSTANDING_BASE, WCAG_CRITERIA } from '../test-data/wcag-criteria';

export interface AccessibilityCheck {
    testInfo: TestInfo;
    screen: string;
}

/** Which record's tabs to walk - a record, not one of its screens. */
export interface RecordTabAudit {
    testInfo: TestInfo;
    record: string;
    skipTabs?: string[];
}

/** One "New ..." wizard to walk: where it is opened from and what to answer. */
export interface RecordWizardAudit {
    testInfo: TestInfo;
    record: string;
    name: string;
    open: () => Promise<void>;
    steps: () => WizardStep[];
}

/** What a journey flow needs of the audit, and all it is given. */
export interface AccessibilityAudit {
    verifyScreen(options: AccessibilityCheck): Promise<void>;
    verifyScreenAndItsErrorState(options: AccessibilityCheck): Promise<void>;
    verifyEveryTab(options: RecordTabAudit): Promise<void>;
    verifyWizard(options: RecordWizardAudit): Promise<void>;
}

// Named rules rather than WCAG tags: a tag scan silently drops the rules axe disables
// by default, so a criterion would be reported as checked with rules that never ran.
const WCAG_RULE_IDS = [...new Set(WCAG_CRITERIA.flatMap(criterion => criterion.rules))];

const ERROR_STATE_SUFFIX = ' (error shown)';

export interface CheckpointOptions {
    /**
     * Submit the screen unanswered first and audit the error state it reports. A screen
     * that accepts the empty submit is sent back, so a wrong guess costs a round trip
     * and a finding rather than the rest of the run.
     */
    probeErrors?: boolean;
}

export type AccessibilityCheckpoint =
    (screen: string, options?: CheckpointOptions) => Promise<void>;

export function checkpointFor(
    audit: AccessibilityAudit | undefined,
    testInfo: TestInfo
): AccessibilityCheckpoint | undefined {
    if (!audit) {
        return undefined;
    }

    return (screen, options) => options?.probeErrors
        ? audit.verifyScreenAndItsErrorState({ testInfo, screen })
        : audit.verifyScreen({ testInfo, screen });
}

export class AccessibilityAuditFlow implements AccessibilityAudit {
    /** One line per thing worth reporting, so the description can summarise the run. */
    private readonly audited: string[] = [];

    /** Screens actually scanned. Not audited.length, which also carries the tab counts
     * and the screens that took an empty submit. */
    private screens = 0;

    /** The last screen scanned and where it was - see verifyScreenWasReached. */
    private last?: { screen: string; path: string; heading: string };

    private readonly tallies = new Map<string, ViolationTally>();

    private errorStates = 0;

    private readonly noErrorWhenEmpty: string[] = [];

    constructor(
        private readonly basePage: BasePage,
        private readonly recordTabs: RecordTabs,
        private readonly makeAxeBuilder: () => AxeBuilder,
    ) { }

    /**
     * Every tab panel of the record on show, driven by the tabs the record carries
     * rather than a list written here. The wizard a tab offers is walked separately, by
     * verifyWizard; opening it here too would scan its first screen under two names.
     */
    async verifyEveryTab(options: RecordTabAudit): Promise<void> {
        const { testInfo, record, skipTabs = [] } = options;
        const overview = this.basePage.getCurrentUrl();
        const routes = await this.recordTabs.waitForTabs()
            ? await this.recordTabs.listRoutes()
            : [];

        // Recorded even when zero, because a walk that finds no tabs looks exactly like
        // a walk that was never reached.
        this.audited.push(`${String(routes.length).padStart(2)} tab(s)      ${record}`);

        for (const route of routes) {
            if (skipTabs.some(skipped => route.includes(skipped))) {
                continue;
            }

            if (!await this.recordTabs.openTab(route)) {
                this.audited.push(`${'NO PANEL'.padEnd(15)}${record} - ${route}`);
                continue;
            }

            const tab = await this.recordTabs.readOpenTabName() || 'overview';

            await this.verifyScreen({ testInfo, screen: `${record} - ${tab} tab` });
        }

        await this.recordTabs.openTab(overview);
    }

    async verifyWizard(options: RecordWizardAudit): Promise<void> {
        const { testInfo, record, name, open, steps } = options;

        await ReportLog.step(`Audit the "new ${name}" wizard`, async () => {
            const overview = this.basePage.getCurrentUrl();

            try {
                await open();

                for (const step of steps()) {
                    await this.verifyScreenAndItsErrorState({
                        testInfo, screen: `${record} - new ${name}: ${step.screen}`,
                    });
                    await step.answer();
                }

                await this.verifyScreen({
                    testInfo, screen: `${record} - new ${name}: check your answers`,
                });
            } catch (error) {
                await ReportLog.info(
                    `The "new ${name}" wizard could not be walked to its end: `
                    + `${(error as Error).message}`
                );
            }

            await this.basePage.returnTo(overview);
        });
    }

    /**
     * Whatever screen is on show, against every WCAG criterion axe can test. One scan
     * answers all of them and one verdict is raised per screen; the per-criterion matrix
     * goes in the attachment.
     */
    async verifyScreen(options: AccessibilityCheck): Promise<void> {
        const { testInfo, screen } = options;

        await ReportLog.step(`Check accessibility - ${screen}`, async () => {
            const results = await this.scan({ rules: WCAG_RULE_IDS });

            // A second pass because withRules above replaced the tag filter. Same page,
            // no navigation; these are reported without ever failing a test.
            const bestPractice = await this.scan({ tags: BEST_PRACTICE_TAGS });

            const rows = WCAG_CRITERIA.map<CriterionRow>(criterion => {
                const scoped = scopeOf(results, criterion.rules);

                return {
                    id: criterion.id,
                    name: criterion.name,
                    level: criterion.level,
                    outcome: outcomeForRules(scoped.passes, scoped.violations, scoped.incomplete),
                    why: criterion.why,
                    understandingUrl: `${UNDERSTANDING_BASE}${criterion.understanding}`,
                    violations: scoped.violations,
                    incomplete: scoped.incomplete,
                };
            });

            const violations = violationSummary(rows);
            const sightings = sightingsOf(rows);
            const unseen = sightings.some(sighting => !this.tallies.has(sighting.key));

            const screenshot = await attachScreenReport({
                screen,
                url: results.url,
                rows,
                nonWcag: bestPractice.violations
                    .filter(violation => !WCAG_RULE_IDS.includes(violation.id)),
                screenshot: unseen
                    ? await this.basePage.readScreenshot()
                    : undefined,
                testInfo,
            });

            this.tally(screen, sightings, screenshot);
            this.screens++;
            if (screen.endsWith(ERROR_STATE_SUFFIX)) {
                this.errorStates++;
            }
            this.audited.push(`${scanOutcome(rows).padEnd(15)}${screen}`);
            await ReportLog.setDescription(this.describeRun());

            this.verifyScreenWasReached(screen, results.url, await this.basePage.readPageHeading());

            expect.soft(
                violations,
                `${screen} should have no WCAG 2.2 AA violations - criteria violated of `
                + `${rows.length} checked at ${results.url} `
                + `(each entry is "criterion - rule -> failing css selector")`
            ).toEqual([]);
        });
    }


    private async scan(
        scope: { rules?: string[]; tags?: string[] }
    ): Promise<Awaited<ReturnType<typeof readAccessibilityScan>>> {
        await this.basePage.waitForPageSettled();

        try {
            return await readAccessibilityScan({ makeAxeBuilder: this.makeAxeBuilder, ...scope });
        } catch (error) {
            if (!(error as Error).message.includes('Execution context was destroyed')) {
                throw error;
            }
            await ReportLog.info('The page navigated while it was being scanned; scanning again.');
            await this.basePage.waitForPageSettled();
            return readAccessibilityScan({ makeAxeBuilder: this.makeAxeBuilder, ...scope });
        }
    }

    /** The screen as it arrives, then the error state it reports when submitted empty. */
    async verifyScreenAndItsErrorState(options: AccessibilityCheck): Promise<void> {
        await this.verifyScreen(options);

        if (await this.enterErrorState(options.screen)) {
            await this.verifyScreen({
                ...options, screen: `${options.screen}${ERROR_STATE_SUFFIX}`,
            });
        }
    }

    /**
     * Returns whether the error state was reached. A screen that accepts the empty
     * submit has moved on, so the journey is sent back: auditing from where it landed
     * would file every later screen under the wrong name.
     */
    private async enterErrorState(screen: string): Promise<boolean> {
        return ReportLog.step(`Put ${screen} into its error state`, async () => {
            const before = this.basePage.getCurrentUrl();
            const errors = await this.basePage.continueAndReadErrors();

            if (errors.length > 0) {
                return true;
            }

            const moved = this.basePage.getCurrentUrl() !== before;

            if (moved) {
                await this.basePage.clickBrowserBackButton();
            }

            this.audited.push(`${'NO ERROR'.padEnd(15)}${screen} (submitted empty)`);
            this.noErrorWhenEmpty.push(screen);
            await ReportLog.setDescription(this.describeRun());

            expect.soft(
                errors,
                `${screen} should report at least one error when submitted empty - `
                + `messages read from the error summary at ${before}. `
                + (moved
                    ? `The screen accepted it and the journey moved on, so it was sent `
                    + `back to carry on; its error state was never reached and no `
                    + `"(error shown)" scan exists for this screen.`
                    : `The screen stayed put but named no error, so nothing tells a `
                    + `screen reader what went wrong.`)
            ).not.toEqual([]);

            return false;
        });
    }

    /**
     * Two named screens in a row at the same route AND heading mean the second was never
     * shown, so its scan is a second reading of the one before it. The heading is part
     * of the comparison because the identity provider serves three screens at one route.
     * The "(error shown)" scan repeats the route on purpose, so it is exempt.
     */
    private verifyScreenWasReached(screen: string, url: string, heading: string): void {
        if (screen.endsWith(ERROR_STATE_SUFFIX)) {
            return;
        }

        // Trailing slashes differ between a record's overview and the same overview
        // reached as a tab route, and two spellings of one route would slip past.
        const path = StringUtil.stripTrailingSlashes(new URL(url).pathname);
        const previous = this.last;

        this.last = { screen, path, heading };

        if (previous?.path !== path || previous.heading !== heading) {
            return;
        }

        expect.soft(
            screen,
            `"${screen}" should be a screen of its own - the route it was scanned at, `
            + `${path}, and its heading, "${heading}", are the ones "${previous.screen}" was `
            + `just scanned at, so this screen was never shown and its scan is a second `
            + `reading of the one before it. The checkpoint belongs behind whatever `
            + `condition decides the screen`
        ).toEqual(previous.screen);
    }

    /** The run summed up per violation rather than per screen, once the test is over. */
    async publishSummary(testInfo: TestInfo): Promise<void> {
        if (this.screens === 0) {
            return;
        }

        await attachText(testInfo, 'a11y-summary.txt', violationReport([...this.tallies.values()], this.coverage()));
        await attachText(testInfo, 'a11y-screens.txt', this.screenList());
    }

    private tally(screen: string, sightings: ViolationSighting[], screenshot?: string): void {
        for (const sighting of sightings) {
            const known = this.tallies.get(sighting.key);

            if (known) {
                known.screens.push(screen);
            } else {
                this.tallies.set(sighting.key, { ...sighting, screens: [screen], screenshot });
            }
        }
    }

    private coverage() {
        return {
            screens: this.screens,
            errorStates: this.errorStates,
            noErrorWhenEmpty: this.noErrorWhenEmpty,
        };
    }

    private describeRun(): string {
        return violationDigest([...this.tallies.values()], this.coverage());
    }

    private screenList(): string {
        return [
            `Accessibility audit - ${this.screens} screen(s), WCAG 2.2 AA`,
            '',
            ...this.audited,
            '',
            'One line per screen. The attachment beside each screen carries its criterion',
            'matrix and the failing selectors; a screenshot is attached only where a',
            'violation first appears, so a repeated one (the header on every screen) is shown once.',
        ].join('\n');
    }
}
