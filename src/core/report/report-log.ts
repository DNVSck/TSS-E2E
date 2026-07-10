import {
    attachment,
    epic,
    feature,
    link,
    logStep,
    Status,
    step,
    story,
    tags,
} from 'allure-js-commons';
import { TEST_LINK_CONFIG } from '../../constant/test-link.constant';

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

    public static async info(message: string): Promise<void> {
        console.log(message);
        await logStep(message);
    }

    public static async warn(message: string): Promise<void> {
        console.warn(message);
        await logStep(message, Status.BROKEN);
    }

    public static async pass(message: string): Promise<void> {
        console.log(message);
        await logStep(message, Status.PASSED);
    }

    public static async fail(message: string): Promise<void> {
        console.error(message);
        await logStep(message, Status.FAILED);
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

    /** Links the test to its case in the test management system. */
    public static setTestCaseLink(testCaseId: string): void {
        link(
            `${TEST_LINK_CONFIG.TEST_CASES_URL}${testCaseId}`,
            `Test case ${testCaseId}`,
            'tms'
        );
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
