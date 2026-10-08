import {
    attachment,
    description,
    epic,
    feature,
    link,
    logStep,
    parameter,
    step,
    story,
    tags,
} from 'allure-js-commons';
import { test } from '@playwright/test';

/**
 * The single facade the test body and flows use to talk to Allure.
 *
 * Log messages become Allure *steps*, never attachments: an attachment per log
 * line produces one file per call, all sharing the same name, which floods the
 * report and the results directory.
 *
 * Screenshots, videos and traces are captured by Playwright itself (see
 * `use.screenshot` / `use.video` / `use.trace` in playwright.config.ts) and are
 * picked up automatically by allure-playwright. Do not attach them by hand.
 */
export class ReportLog {

    private static describedTestId?: string;

    public static async info(message: string): Promise<void> {
        console.log(message);
        await logStep(message);
    }

    /**
     * Records a business identifier (test account, LRN, ...) in the test's Allure
     * "Parameters" table, so it is filterable and visible without scrolling the
     * step timeline. Use for short key/value facts, not log narration.
     */
    /**
     * Text shown on the report's Overview tab, under the title.
     *
     * Allure's red Error block is Playwright's FIRST error and cannot be set from a
     * test. Soft assertions record and carry on, so that first error is often not the
     * one that stopped the run - the description is where the whole list can go.
     */
    public static async setDescription(text: string): Promise<void> {
        ReportLog.describedTestId = test.info().testId;
        await description(text);
    }

    public static hasOwnDescription(testId: string): boolean {
        return ReportLog.describedTestId === testId;
    }

    public static setParameter(name: string, value: string): void {
        parameter(name, value);
    }

    /** For real artefacts (payloads, generated files) — not for log lines. */
    public static addAttachment(
        name: string,
        content: string | Buffer,
        type: string
    ): void {
        attachment(name, content, type);
    }

    public static async setEpic(name: string): Promise<void> {
        await epic(name);
    }

    public static async setFeature(name: string): Promise<void> {
        await feature(name);
    }

    public static async setStory(name: string): Promise<void> {
        await story(name);
    }

    public static async setTags(...tagList: string[]): Promise<void> {
        await tags(...tagList);
    }

    /**
     * Links the test to its case in the test management system. Takes the full URL
     * rather than composing it from a hard-coded base: which tracker a project uses
     * is the project's business, not this wrapper's - see helper/report-helper for
     * the caller that knows this service's tracker.
     */
    public static setTestCaseLink(testCaseId: string, url: string): void {
        link(url, `Test case ${testCaseId}`, 'tms');
    }

    /**
     * Wraps `fn` in an Allure step. It deliberately does NOT catch: a failure
     * deep in a nested step would otherwise be logged (and screenshotted) once
     * per enclosing level as it propagates. Playwright reports the failure once.
     */
    public static async step<T>(
        name: string,
        fn: () => Promise<T> | T
    ): Promise<T> {
        return step(name, fn);
    }
}
