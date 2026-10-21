import { expect } from '@playwright/test';
import * as path from 'node:path';
import { ReportLog } from '../../core/report/report-log';
import { ConsignmentOverviewPage } from '../../page-object/consignment-overview-page';
import { GoodsCsvUploadPage } from '../../page-object/goods-csv-upload-page';
import { GoodsCsvRow, readGoodsCsv } from '../../test-data/goods-csv-data';

export class UploadGoodsCsvFlow {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly goodsCsvUploadPage: GoodsCsvUploadPage,
    ) { }

    async uploadGoodsCsv(csvFile: string): Promise<GoodsCsvRow[]> {
        const fileName = path.basename(csvFile);
        const rows = readGoodsCsv(csvFile);
        if (!rows.length) {
            throw new Error(`Goods CSV ${fileName} should hold at least one goods row - none read`);
        }

        const declared = (await this.consignmentOverviewPage.listGoodsItemRoutes()).length;

        await ReportLog.step(`Upload ${fileName} as goods records`, async () => {
            const errors = await this.openAndUpload(csvFile);
            expect(errors, `Upload of ${fileName} should have been accepted - errors shown (none expected)`).toEqual([]);

            const staged = await this.goodsCsvUploadPage.readStagedRows();
            expect.soft(staged.slice(declared),
                `Upload of ${fileName} should have staged every CSV row after the ${declared} goods record(s) already declared `
                + '- rows staged (description, commodity code, in file order)')
                .toEqual(rows.map(({ description, commodityCode }) => ({ description, commodityCode })));
        });

        await ReportLog.step('Confirm the uploaded goods records', async () => {
            await this.goodsCsvUploadPage.confirmRecords();
            await expect.poll(
                async () => (await this.consignmentOverviewPage.listGoodsItemRoutes()).length,
                {
                    message: `Consignment should list one goods record per row of ${fileName} (${rows.length} row(s)) `
                        + `beside the ${declared} already declared`,
                }
            ).toBe(declared + rows.length);
        });

        return rows;
    }

    async verifyGoodsCsvRefused(csvFile: string, expectedError: string): Promise<void> {
        const fileName = path.basename(csvFile);

        await ReportLog.step(`Upload ${fileName} and expect it to be refused`, async () => {
            const errors = await this.openAndUpload(csvFile);
            expect(errors.some(error => error.startsWith(expectedError)),
                `Upload of ${fileName} should have been refused with ${expectedError} - errors shown: ${JSON.stringify(errors)}`
            ).toBe(true);
        });
    }

    private async openAndUpload(csvFile: string): Promise<string[]> {
        await this.consignmentOverviewPage.openGoodsCsvUpload();
        await this.goodsCsvUploadPage.openUploadForm();
        return this.goodsCsvUploadPage.uploadFile(csvFile);
    }
}
