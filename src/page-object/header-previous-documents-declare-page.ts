import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { selectDropdownValue, checkRadioByValue } from '../helper/element-helper';
import { PreviousDocumentData } from '../test-data/previous-document-data';

/**
 * The "New previous document" wizard, reached from the consignment's
 * "Header previous documents" tab (and the goods item's "Previous documents"
 * tab, which reuses the same screens and field ids):
 *
 *   1. "Document category and type" — the category radio and the type select.
 *   2. "Previous document details" — the reference and an optional goods-item id.
 *   3. "Check your answers" — commits the record with "Complete and submit".
 */
export class PreviousDocumentDeclarePage extends BasePage {

    private readonly documentTypeDropdown: Locator;
    private readonly documentReferenceInput: Locator;
    private readonly goodsItemIdentifierInput: Locator;

    constructor(page: Page) {
        super(page);

        // "Document category and type" — category is a radio group (name="documentCategory").
        this.documentTypeDropdown = page.locator("select#documentType");

        // "Previous document details"
        this.documentReferenceInput = page.locator("input#documentReference");
        this.goodsItemIdentifierInput = page.locator("input#goodsItemIdentifier");
    }

    /** "Document category and type" — pick the category code, then the type. */
    async selectDocumentCategoryAndType(categoryCode: string, documentType: string): Promise<void> {
        await checkRadioByValue(this.page, 'documentCategory', categoryCode);
        await selectDropdownValue(this.documentTypeDropdown, documentType);
        await this.clickContinueButton();
    }

    /** "Previous document details" — the reference plus the optional goods-item id. */
    async enterPreviousDocumentDetails(documentReference: string, goodsItemIdentifier?: string): Promise<void> {
        await this.documentReferenceInput.fill(documentReference);
        await this.goodsItemIdentifierInput.fill(goodsItemIdentifier ?? '');
        await this.clickContinueButton();
    }

    /** "Check your answers" — the "Complete and submit" button commits the record. */
    async confirmAndSubmit(): Promise<void> {
        await this.clickFinishButton();
    }

    /** The whole wizard for a single previous-document record. */
    async declarePreviousDocument(input: PreviousDocumentData): Promise<void> {
        await this.selectDocumentCategoryAndType(input.documentCategory, input.documentType);
        await this.enterPreviousDocumentDetails(input.documentReference, input.goodsItemIdentifier);
        await this.confirmAndSubmit();
    }
}
