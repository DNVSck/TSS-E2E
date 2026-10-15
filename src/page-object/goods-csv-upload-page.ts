import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { GOVUK } from './components/govuk-selectors';
import {
    clickToLeaveScreen, submitAndReadErrors, readFieldIfPresent, waitForHydration,
} from '../helper/element-helper';
import { GOODS_CSV_UPLOAD_ACTION } from '../constant/goods-csv-upload-constant';

export interface StagedGoodsRow {
    description: string;
    commodityCode: string;
}

export class GoodsCsvUploadPage extends BasePage {
    private readonly openUploadButton: Locator;
    private readonly fileInput: Locator;
    private readonly uploadButton: Locator;
    private readonly confirmButton: Locator;
    private readonly stagedRows: Locator;

    constructor(page: Page) {
        super(page);
        this.openUploadButton = page.locator(`main button[value='${GOODS_CSV_UPLOAD_ACTION.OPEN_UPLOAD}']`);
        this.fileInput = page.locator("main input[type='file']");
        this.uploadButton = page.locator("main form[enctype='multipart/form-data'] button[type='submit']");
        this.confirmButton = page.locator(`main button[value='${GOODS_CSV_UPLOAD_ACTION.CONFIRM}']`);
        this.stagedRows = page.locator(`main ${GOVUK.TABLE.BODY} ${GOVUK.TABLE.ROW}`);
    }

    async openUploadForm(): Promise<void> {
        await clickToLeaveScreen(this.page, this.openUploadButton);
        await this.fileInput.waitFor({ state: 'attached' });
        await waitForHydration(this.fileInput);
    }

    async uploadFile(filePath: string): Promise<string[]> {
        await this.fileInput.setInputFiles(filePath);
        return submitAndReadErrors(this.page, this.uploadButton);
    }

    async readStagedRows(): Promise<StagedGoodsRow[]> {
        await this.stagedRows.first().waitFor();
        const rows: StagedGoodsRow[] = [];

        for (const row of await this.stagedRows.all()) {
            const cells = row.locator(GOVUK.TABLE.CELL);
            rows.push({
                description: await readFieldIfPresent(cells.nth(1)),
                commodityCode: await readFieldIfPresent(cells.nth(2)),
            });
        }
        return rows;
    }

    async confirmRecords(): Promise<void> {
        const staging = new URL(this.page.url()).pathname;

        await waitForHydration(this.confirmButton);
        await this.confirmButton.click();
        await this.page.waitForURL(url => url.pathname !== staging).catch(() => {
            throw new Error(`Confirming the staged goods records should have left ${staging} - the page is still there`);
        });
    }
}
