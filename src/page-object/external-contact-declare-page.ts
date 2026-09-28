import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';

/**
 * The "New external contact" wizard, reached from the GMR overview's
 * "External Contacts" tab:
 *
 *   1. "Contact details" — the contactEmail textbox.
 *   2. "Check your answers" — commits the record with "Complete and submit".
 *
 * Same two-screen shape as the additional-procedure-code and taric-code wizards,
 * which is why it reuses the shared Continue/Finish buttons from BasePage.
 */
export class ExternalContactDeclarePage extends BasePage {

    private readonly contactEmailInput: Locator;

    constructor(page: Page) {
        super(page);
        this.contactEmailInput = page.locator("input#contactEmail");
    }

    /** "Contact details" — the external contact's email address. */
    async inputContactEmail(contactEmail: string): Promise<void> {
        await this.contactEmailInput.fill(contactEmail);
        await this.clickContinueButton();
    }

    /** "Check your answers" — the "Complete and submit" button commits the record. */
    async confirmAndSubmit(): Promise<string[]> {
        return this.finishAndReadErrors();
    }

    /** The whole wizard for a single external-contact record. */
    async addNewExternalContact(contactEmail: string): Promise<string[]> {
        await this.inputContactEmail(contactEmail);
        return this.confirmAndSubmit();
    }
}
