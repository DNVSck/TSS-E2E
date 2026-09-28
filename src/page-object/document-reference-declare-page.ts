import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { selectDropdownValue } from '../helper/element-helper';
import { DocumentReferenceData } from '../test-data/document-reference-data';

/**
 * The "New document reference" wizard, reached from the goods item's
 * "Document references" tab:
 *
 *   1. "Choose the specific document code" — the documentCode select.
 *   2. "Select document status" — the documentStatus select (only for some codes).
 *   3. "Enter document reference" — the reference and an optional part reference.
 *   4. "Enter document reason" — an optional reason.
 *   5. "Upload your document file" — an optional file upload.
 *   6. "Check your answers" — commits the record with "Complete and submit".
 *
 * Only the code is mandatory. The status screen appears only for some document
 * codes; the reference, part reference, reason and file screens still appear but
 * are left blank when the test data omits them.
 */
export class DocumentReferenceDeclarePage extends BasePage {

    private readonly documentCodeDropdown: Locator;
    private readonly documentStatusDropdown: Locator;
    private readonly documentReferenceInput: Locator;
    private readonly documentPartReferenceInput: Locator;
    private readonly documentReasonInput: Locator;
    private readonly documentFileInput: Locator;

    constructor(page: Page) {
        super(page);
        this.documentCodeDropdown = page.locator("select#documentCode");
        this.documentStatusDropdown = page.locator("select#documentStatus");
        this.documentReferenceInput = page.locator("input#documentReference");
        this.documentPartReferenceInput = page.locator("input#documentPartReference");
        this.documentReasonInput = page.locator("input#documentReason");
        this.documentFileInput = page.locator("input#documentFile");
    }

    /** "Choose the specific document code". */
    async selectDocumentCode(documentCode: string): Promise<void> {
        await selectDropdownValue(this.documentCodeDropdown, documentCode);
        await this.clickContinueButton();
    }

    /**
     * "Select document status". This screen appears only for some document codes,
     * so wait for either it or the "Enter document reference" screen that follows
     * when it is skipped, and answer it only when it is actually shown.
     */
    async selectDocumentStatusIfPresent(documentStatus?: string): Promise<void> {
        await this.documentStatusDropdown.or(this.documentReferenceInput).first().waitFor({ state: 'visible' });

        if (!(await this.documentStatusDropdown.isVisible())) {
            return;
        }

        if (documentStatus) {
            await selectDropdownValue(this.documentStatusDropdown, documentStatus);
        }
        await this.clickContinueButton();
    }

    /** "Enter document reference" — the reference plus the optional part reference. */
    async enterDocumentReference(documentReference?: string, documentPartReference?: string): Promise<void> {
        await this.documentReferenceInput.fill(documentReference ?? '');
        await this.documentPartReferenceInput.fill(documentPartReference ?? '');
        await this.clickContinueButton();
    }

    /** "Enter document reason" (Optional field). */
    async enterDocumentReason(documentReason?: string): Promise<void> {
        await this.documentReasonInput.fill(documentReason ?? '');
        await this.clickContinueButton();
    }

    /** "Upload your document file" — attaches a file only when one is supplied. */
    async uploadDocumentFile(documentFilePath?: string): Promise<void> {
        if (documentFilePath) {
            await this.documentFileInput.setInputFiles(documentFilePath);
        }
        await this.clickContinueButton();
    }

    /** "Check your answers" — the "Complete and submit" button commits the record. */
    async confirmAndSubmit(): Promise<string[]> {
        return this.finishAndReadErrors();
    }

    /** The whole wizard for a single document-reference record. */
    async declareDocumentReference(input: DocumentReferenceData): Promise<string[]> {
        await this.selectDocumentCode(input.documentCode);
        await this.selectDocumentStatusIfPresent(input.documentStatus);
        await this.enterDocumentReference(input.documentReference, input.documentPartReference);
        await this.enterDocumentReason(input.documentReason);
        await this.uploadDocumentFile(input.documentFilePath);
        return this.confirmAndSubmit();
    }
}
