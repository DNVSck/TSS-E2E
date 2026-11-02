import { ReportLog } from '../../core/report/report-log';
import { GoodsData } from '../../test-data/goods-data';
import { FfdH1GoodsData, FfdH2GoodsData, FfdH3GoodsData, FfdH4GoodsData } from '../../test-data/ffd-standalone-goods-item-data';
import { GoodsItemSteps } from './goods-item-steps';
import { OttService } from '../../api-service/ott/ott-service';

export interface FfdGoodsItemQuestions {
    asksNatureOfGoods: boolean;
    asksSupervisingCustomsOffice: boolean;
}

/**
 * One goods item on the FFD standalone journey.
 *
 * FFD values the goods on the item itself - additional risk status, preference,
 * nature of the goods, valuation method and the invoice - so it keeps its own spine.
 * The nature of the goods is asked here only when the consignment said its items are
 * not all traded for the same reason.
 */
export class AddNewFfdStandaloneGoodsItemFlow {
    constructor(
        private readonly steps: GoodsItemSteps,
        private readonly ottService: OttService,
    ) { }

    async addNewFfdStandaloneGoodsItem(input: FfdH1GoodsData, questions: FfdGoodsItemQuestions): Promise<void> {
        await ReportLog.step('Add new FFD standalone goods item', async () => {
            await this.steps.openNewGoodsRecord();
            await this.steps.selectAdditionalRiskStatus(input);
            await this.steps.selectGoodsProcedureCode(input);
            await this.steps.selectAdditionalProcedureCode(input);
            if (questions.asksSupervisingCustomsOffice) {
                await this.steps.selectSupervisingCustomsOfficeIfAsked(input);
            }
            await this.steps.enterWarehouseIdentifierIfAsked(input);
            await this.declareCommodityPackagingAndWeight(input);
            if (questions.asksNatureOfGoods) {
                await this.steps.selectNatureOfGoods(input);
            }
            await this.steps.selectValuationMethod(input);
            await this.steps.enterInvoiceDetails(input);
            await this.steps.finishGoodsItemDeclaration();
        });
    }

    async addNewFfdH2StandaloneGoodsItem(input: FfdH2GoodsData): Promise<void> {
        await ReportLog.step('Add new FFD H2 standalone goods item', async () => {
            await this.steps.openNewGoodsRecord();
            await this.steps.selectGoodsProcedureCode(input);
            await this.steps.selectAdditionalProcedureCode(input);
            await this.declareCommodityPackagingAndWeight(input);
            await this.steps.enterInvoiceNumber(input);
            await this.steps.finishGoodsItemDeclaration();
        });
    }

    async addNewFfdH4StandaloneGoodsItem(input: FfdH4GoodsData, asksNatureOfGoods: boolean): Promise<void> {
        await ReportLog.step('Add new FFD H4 standalone goods item', async () => {
            await this.steps.openNewGoodsRecord();
            await this.steps.selectGoodsProcedureCode(input);
            await this.steps.selectAdditionalProcedureCode(input);
            await this.declareCommodityPackagingAndWeight(input);
            if (asksNatureOfGoods) {
                await this.steps.selectNatureOfGoods(input);
            }
            await this.steps.enterInvoiceDetails(input);
            await this.steps.selectValuationMethod(input);
            await this.steps.finishGoodsItemDeclaration();
        });
    }

    async addNewFfdH3StandaloneGoodsItem(input: FfdH3GoodsData, questions: FfdGoodsItemQuestions): Promise<void> {
        await ReportLog.step('Add new FFD H3 standalone goods item', async () => {
            await this.steps.openNewGoodsRecord();
            await this.steps.selectGoodsProcedureCode(input);
            await this.steps.selectAdditionalProcedureCode(input);
            if (questions.asksSupervisingCustomsOffice) {
                await this.steps.selectSupervisingCustomsOfficeIfAsked(input);
            }
            await this.declareCommodityPackagingAndWeight(input);
            if (questions.asksNatureOfGoods) {
                await this.steps.selectNatureOfGoods(input);
            }
            await this.steps.enterInvoiceDetails(input);
            await this.steps.selectValuationMethod(input);
            await this.steps.finishGoodsItemDeclaration();
        });
    }

    private async declareCommodityPackagingAndWeight(input: GoodsData & { preference: string; countryOfPreferentialOrigin?: string }): Promise<void> {
        await this.steps.enterPreference(input);
        await this.steps.enterCountryOfOrigin(input);
        await this.steps.enterCommodityInformationWithoutSupplementaryUnits(input);
        await this.fillSupplementaryUnitsIfRequired(input);
        await this.steps.enterCusCode(input);
        await this.steps.enterStandalonePackagingDetails(input);
        await this.steps.enterWeightInformation(input);
    }

    private async fillSupplementaryUnitsIfRequired(input: GoodsData): Promise<void> {
        await ReportLog.step('OTT API — check supplementary units', async () => {
            const result = await this.ottService.readSupplementaryUnits(
                input.commodityCode,
                input.countryOfOrigin
            );
            ReportLog.addAttachment(
                `Supplementary units (${input.commodityCode} / ${input.countryOfOrigin})`,
                JSON.stringify(result, null, 2),
                'application/json'
            );
            if (!result.required) {
                return;
            }
            if (!input.supplementaryUnits) {
                throw new Error(
                    `The tariff requires supplementary units for commodity ${input.commodityCode} `
                    + `(origin ${input.countryOfOrigin}), but the test data provides no value. `
                    + `Set "supplementaryUnits" on the goods item.`
                );
            }
            await this.steps.enterSupplementaryUnitsScreen(input.supplementaryUnits);
        });
    }
}
