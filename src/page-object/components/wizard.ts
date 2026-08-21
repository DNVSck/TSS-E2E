import { Page } from '@playwright/test';
import { BasePage } from '../base-page';
import { currentWizardStep, waitForWizardStepToChange } from '../../helper/element-helper';

/**
 * A multi-screen wizard, considered as one thing rather than as the screens it shows.
 *
 * It models no screen and owns no locator - every screen's fields stay with the page
 * object that owns them. What it owns is the one question a page object cannot answer
 * about itself: WHICH screen is showing. The service names each screen in its own route
 * (see currentWizardStep), so that question costs a string comparison rather than a
 * locator and a timeout.
 *
 * A component, beside AgentBanner and PartyBlock, because it is the same kind of thing:
 * a piece of page-level state that belongs to no single screen. It is deliberately NOT
 * called a Page - it is not one.
 *
 * Generic over its step names so each wizard brings its own vocabulary while sharing
 * this behaviour, which has nothing journey-specific in it. The type parameter is the
 * point, not decoration: without it `isOnStep('exporter-profil')` compiles, matches
 * nothing, and the screen is skipped in silence - the wizard then stalls several
 * screens later with an error about something unrelated. With it, tsc stops the typo
 * where it was made.
 *
 * Only a flow needs this - a page object already holds the Page and can call the two
 * helpers directly, as PartyBlock does. No flow in this suite holds a Page, and this is
 * what keeps that true.
 */
export class Wizard<Step extends string> extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    /** Which screen is showing, named as the service names it. */
    currentStep(): string {
        return currentWizardStep(this.page);
    }

    /** Whether the wizard is asking this particular question. */
    isOnStep(step: Step): boolean {
        return this.currentStep() === step;
    }

    /**
     * Wait until the wizard has left the step given.
     *
     * Continue posts back to the same step and only then redirects, so without this the
     * next "which screen am I on?" would still see the screen just answered - and the
     * step after it would be skipped for the wrong reason.
     */
    async waitForStepToChange(from: Step): Promise<void> {
        await waitForWizardStepToChange(this.page, from);
    }
}
