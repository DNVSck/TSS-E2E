import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { TFunction, TranslationKey } from '../fixtures/locale-fixture';
import { isTraderInputRequiredStatus } from '../helper/declaration-status-helper';
import {
    summaryListValue, readFieldWhenVisible, readFieldIfPresent,
    clickLinkAndWaitForRoute, clickLinkAndEnterWizard, removeTaskListRecord,
} from '../helper/element-helper';

/** This overview paints its summary card a beat after load. */
const OVERVIEW_READ_TIMEOUT = 15_000;

const TOGGLE_SETTLE_TIMEOUT = 2_000;

/**
 * How long a submitted supplementary declaration gets to reach its final status.
 *
 * Longer than the frontier declarations' poll: an SD goes through CDS twice over -
 * accepted, then assessed for duty - and was measured at roughly two minutes from
 * Submit to "PaymentPending" on SIT (2026-08-20). Nothing here sleeps, so a faster
 * environment pays only for the round trips it needs.
 */
const SUPPLEMENTARY_STATUS_POLL_TIMEOUT = 240_000;

/**
 * A supplementary declaration's overview - the screen reached from the SD list, and
 * the hub the whole journey is driven from: it starts the header wizard, opens the
 * goods record, offers the method of payment for change, and carries Submit.
 *
 * Deliberately NOT a subclass of ConsignmentSummaryPage. It looks like a consignment
 * overview and is not one: the status is a tag inside the summary card's title rather
 * than a summary-list row, the reference is called a "Declaration reference", and the
 * details every other check needs are hidden behind a toggle until expanded.
 */
export class SupplementaryDeclarationOverviewPage extends BasePage {
    private readonly declarationReference: Locator;
    private readonly status: Locator;
    private readonly fullDetailsToggle: Locator;
    private readonly fullDetails: Locator;
    private readonly startNowButton: Locator;
    private readonly goodsRecordLinks: Locator;
    private readonly goodsRecordsTab: Locator;
    private readonly holderOfAuthorisationTab: Locator;
    private readonly methodOfPaymentChangeLink: Locator;
    private readonly submitButton: Locator;
    private readonly simplifiedDeclarationReference: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);

        this.declarationReference = page.locator('.govuk-summary-card__title strong');
        // The service's own class for the tag. The rest of that element's class list
        // carries an untranslated i18n key ("govuk-tag--declaration-list.statuses.draft")
        // which changes with the status, so only this half is matched on.
        this.status = page.locator('span.declaration-status');
        // One button for both directions - it flips aria-expanded and its own label
        // ("Show"/"Hide full consignment details"), so there is one element here, not two.
        // Matched on what it CONTROLS rather than on that label, which is translated.
        this.fullDetailsToggle = page.locator("button[aria-controls='declaration-full-details']");
        this.fullDetails = page.locator('#declaration-full-details');
        this.startNowButton = page.locator('main a.govuk-button--start');
        // A goods record is the only link on this screen whose href ENDS in /overview -
        // the tabs all carry a "#overview-tab" fragment after it.
        this.goodsRecordLinks = page.locator("main a[href$='/overview']");
        // Each tab is its own route, so these are links rather than panels to reveal.
        this.goodsRecordsTab = page.locator("main a[href$='/overview/#overview-tab']");
        this.holderOfAuthorisationTab = page.locator(
            "main a[href$='/overview/holder-of-authorisation#overview-tab']"
        );
        this.methodOfPaymentChangeLink = page.locator("main a[href*='field=methodOfPayment']");
        this.submitButton = page.locator("button[name='action'][value='submit-consignment']");
        this.simplifiedDeclarationReference = summaryListValue(
            page, this.t!('supplementaryDeclaration.simplifiedDeclarationReference')
        );
    }

    async getDeclarationReference(): Promise<string> {
        return readFieldWhenVisible(this.declarationReference, OVERVIEW_READ_TIMEOUT);
    }

    async getStatus(): Promise<string> {
        return readFieldWhenVisible(this.status, OVERVIEW_READ_TIMEOUT);
    }

    /**
     * Reveal "full consignment details".
     *
     * Everything the declaration inherited from its frontier declaration lives behind
     * this toggle - including the reference back to it and, after a rejected submission,
     * the CDS error that says why. Idempotent: the toggle is left alone when it is
     * already open, so a caller never has to know whether someone expanded it first.
     */
    async expandFullConsignmentDetails(): Promise<void> {
        await this.fullDetailsToggle.waitFor({ state: 'visible', timeout: OVERVIEW_READ_TIMEOUT });

        await expect(async () => {
            if (await this.fullDetailsToggle.getAttribute('aria-expanded') !== 'true') {
                await this.fullDetailsToggle.click();
            }
            await this.fullDetails.waitFor({ state: 'visible', timeout: TOGGLE_SETTLE_TIMEOUT });
        }).toPass({ timeout: OVERVIEW_READ_TIMEOUT, intervals: [500, 1_000, 2_000] });
    }

    /** The frontier declaration this SD was raised against. Behind the toggle. */
    async getSimplifiedDeclarationReference(): Promise<string> {
        await this.expandFullConsignmentDetails();
        return readFieldWhenVisible(this.simplifiedDeclarationReference, OVERVIEW_READ_TIMEOUT);
    }

    /**
     * "Start now" - the consignment-header wizard.
     *
     * Its href ends in the "_edit_" placeholder, which the service resolves to whichever
     * question this declaration has not answered - so the destination is not in the link.
     * See clickLinkAndEnterWizard.
     */
    async startHeaderWizard(): Promise<void> {
        await clickLinkAndEnterWizard(this.page, this.startNowButton, 'update');
    }

    /** Open a goods record by position; an SD raised from one goods item has just one. */
    async openGoodsRecord(index = 0): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.goodsRecordLinks.nth(index));
    }

    /**
     * "Change" the method of payment.
     *
     * A change-one-answer route, not a way into the wizard: it returns to
     * check-your-answers rather than carrying on through the remaining screens. That is
     * exactly why the header wizard is walked FIRST and this is done afterwards - going
     * in through here left the INCOTERM unanswered on a declaration that looked
     * complete, and CDS refused it (measured on SIT 2026-08-21).
     *
     * Its href reads ".../update/_edit_?field=methodOfPayment" and it lands on
     * ".../update/method-of-payment", so the link does not name its own destination -
     * hence clickLinkAndEnterWizard rather than the route-matching click.
     */
    async changeMethodOfPayment(): Promise<void> {
        await this.expandFullConsignmentDetails();
        await clickLinkAndEnterWizard(this.page, this.methodOfPaymentChangeLink, 'update');
    }

    /** "Holder of authorisation" - its own route, not a panel this page hides. */
    async openHolderOfAuthorisationTab(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.holderOfAuthorisationTab);
    }

    /** "Goods records" - the tab this overview opens on. */
    async openGoodsRecordsTab(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.goodsRecordsTab);
    }

    /**
     * Remove a holder of authorisation by its type code ("CGU", "DPO"), and report
     * whether there was one to remove. Assumes the tab is already open.
     */
    async removeHolderOfAuthorisation(typeCode: string): Promise<boolean> {
        return removeTaskListRecord(this.page, typeCode);
    }

    async submit(): Promise<void> {
        await this.submitButton.click();
    }

    /**
     * Poll the overview until the status reads ANY of the ones given, and return it.
     *
     * A reload loop, for the same reason the consignment detail page uses one: the
     * status changes because CDS answered, and the page only learns that on its next
     * request.
     *
     * A SET rather than one status because more than one right answer exists - see
     * submittedSupplementaryStatusKeys, where the reason lives.
     *
     * The poll ends on a REJECTED declaration as well as an accepted one. "Trader Input
     * Required" means the service handed the submission back, so no amount of reloading
     * changes the answer - the same rule the consignment polls follow, and the reason
     * this shares their helper rather than restating it. Without it a refused
     * declaration spent the full four minutes before saying so, which is every failure
     * seen while this journey was being built.
     *
     * Returns the last status read, whatever it is - including one the caller did not
     * ask for. Whether "PaymentPending" or "Trader input required" is an acceptable
     * place to land is a rule about the JOURNEY, so the flow decides it (see
     * CompleteAndSubmitSupplementaryDeclarationFlow) - and deciding it here threw the
     * status away before the report could name it.
     */
    async waitForAnyStatus(
        expectedStatusKeys: TranslationKey[],
        timeout = SUPPLEMENTARY_STATUS_POLL_TIMEOUT
    ): Promise<string> {
        const expected = expectedStatusKeys.map(key => this.t!(key));
        let status = '';

        await expect(async () => {
            status = await readFieldIfPresent(this.status);
            if (expected.includes(status) || isTraderInputRequiredStatus(status, this.t!)) {
                return;
            }

            // Reload, then fail on what THIS attempt read - not on a fresh read of the
            // page it just reloaded. Asserting on a re-read ends the poll on a value
            // `status` never held, so the caller is handed the reading from one attempt
            // earlier: a declaration that settled on "PaymentPending" was reported as
            // "Processing", and nothing noticed until the check below was added.
            await this.page.reload();
            expect(expected, 'Supplementary declaration status').toContain(status);
        })
            .toPass({ timeout, intervals: [3_000, 5_000, 10_000] })
            .catch(() => { /* the caller judges what it settled on - see above */ });

        return status;
    }

    /**
     * Whatever the service is complaining about, or '' when it is content.
     *
     * A rejected supplementary declaration says why in a "There is a problem" panel
     * INSIDE the collapsed details - which is how CDS12125 (an unusable deferment
     * account) was found on 2026-08-20. Read as text and never throwing, because this
     * exists to explain a failure: a diagnostic that can itself fail replaces the real
     * error with its own.
     */
    async readSubmissionProblem(): Promise<string> {
        try {
            await this.expandFullConsignmentDetails();
            const details = await this.fullDetails.innerText();
            const problem = /There is a problem\s*([\s\S]*?)(?:\n\s*\n|$)/.exec(details);
            return problem ? problem[1].trim() : '';
        } catch {
            return '';
        }
    }
}
