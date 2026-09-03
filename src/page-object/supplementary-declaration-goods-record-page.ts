import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import {
    clickLinkAndWaitForRoute, clickLinkAndEnterWizard, removeTaskListRecord,
} from '../helper/element-helper';

/**
 * One goods record of a supplementary declaration - "Complete your goods item N".
 *
 * A screen of its own rather than part of the declaration's overview: it is a separate
 * route, it carries its own wizard, and its own wizard ends by returning HERE rather
 * than to the declaration. Which is why the breadcrumb below is not a convenience -
 * it is the only way out.
 */
export class SupplementaryDeclarationGoodsRecordPage extends BasePage {
    private readonly startNowButton: Locator;
    private readonly declarationBreadcrumbLink: Locator;
    private readonly newDocumentReferenceButton: Locator;
    private readonly newAdditionalProcedureCodeButton: Locator;
    private readonly additionalProcedureCodeDeleteButtons: Locator;

    constructor(page: Page) {
        super(page);

        this.startNowButton = page.locator('main a.govuk-button--start');
        // NOT newRecordButton(): that helper picks a button out of a form identified by
        // its action, and every section of this screen posts to the SAME action - so it
        // would match eleven buttons. Only the button's own value tells them apart.
        //
        this.newDocumentReferenceButton = page.locator(
            "main button[name='action'][value='new-document-reference']"
        );
        this.newAdditionalProcedureCodeButton = page.locator(
            "main button[name='action'][value='new-additional-procedure-code']"
        );
        // One per code already on the record. Counted rather than reading the section,
        // whose empty state is a translated sentence ("No additional procedure codes
        // found.") and whose filled state is a list of links - the Delete buttons are
        // the one structural thing that appears exactly once per code.
        this.additionalProcedureCodeDeleteButtons = page.locator(
            "main button[value^='delete-additional-procedure-code']"
        );
        // Matched on the reference prefix, the way ConsignmentOverviewPage matches its
        // own on "DEC"/"GLR". The href cannot be used: this record's own breadcrumb
        // entry ends in "/overview" too. "SUP" is a reference, not prose - it reads the
        // same in Welsh.
        this.declarationBreadcrumbLink = page.locator(
            "//nav[contains(@class,'breadcrumb')]//a[starts-with(normalize-space(.),'SUP')]"
        );
    }

    /**
     * "Start now" - the goods item's wizard.
     *
     * Like the declaration's own, its href ends in the "_edit_" placeholder and the
     * service decides on arrival which question to ask first. See clickLinkAndEnterWizard.
     */
    async startGoodsWizard(): Promise<void> {
        await clickLinkAndEnterWizard(this.page, this.startNowButton, 'edit');
    }

    /**
     * How many additional procedure codes this goods item already carries.
     *
     * Worth asking before adding one. Whether the supplementary declaration inherits
     * this from its frontier declaration varies, and getting it wrong fails either way:
     * with none, CDS refuses the declaration for a procedure code with no additional
     * code beside it (CDS12070); with one already there, adding "000" refuses it again,
     * because 000 means "no other code applies" and cannot sit beside another
     * (CDS12149). Both seen on SIT, 2026-08-20, on two declarations an hour apart.
     */
    async countAdditionalProcedureCodes(): Promise<number> {
        return this.additionalProcedureCodeDeleteButtons.count();
    }

    /** "New additional procedure code" - adds a code to this goods item. */
    async declareNewAdditionalProcedureCode(): Promise<void> {
        await this.newAdditionalProcedureCodeButton.click();
    }

    /** "New document reference" - adds a document to this goods item. */
    async declareNewDocumentReference(): Promise<void> {
        await this.newDocumentReferenceButton.click();
    }

    /**
     * Remove a document reference by its document code ("C506", "C505"), and report
     * whether there was one to remove.
     *
     * No tabs to open first - every section is on the page at once - so the record is
     * addressed by the code it opens with and nothing else. See removeTaskListRecord
     * for why position cannot be used.
     */
    async removeDocumentReference(documentCode: string): Promise<boolean> {
        return removeTaskListRecord(this.page, documentCode);
    }

    /** Back to the declaration this record belongs to. */
    async goToSupplementaryDeclaration(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.declarationBreadcrumbLink);
    }
}
