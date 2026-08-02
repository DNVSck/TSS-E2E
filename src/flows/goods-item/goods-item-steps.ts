import { ConsignmentOverviewPage } from '../../page-object/consignment-overview-page';
import { GoodsDeclarePage } from '../../page-object/goods-declare-page';
import { GoodsData } from '../../test-data/goods-data';
import { ReportLog } from '../../core/report/report-log';

/**
 * One method per goods-item wizard screen: binds the test data to the page object
 * and owns that screen's Allure step name, so every journey reports the same screen
 * under the same name.
 *
 * NOT a page object — it holds no locators and drives nothing itself. Locators and
 * raw interaction stay in GoodsDeclarePage; this layer decides what a screen means
 * for a journey. Which screens a journey visits, and in what order, is the business
 * of the per-journey flows beside this file.
 *
 * Where two journeys genuinely show a DIFFERENT screen (packaging, below), there are
 * two methods rather than one with a flag: a boolean inside a step is the sign that
 * two screens were merged by mistake.
 *
 * The class owns one WIZARD, not one page: alongside the screens it also owns the
 * action that opens the wizard, even though that button sits on the consignment
 * overview. That is why two page objects are injected.
 */
export class GoodsItemSteps {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly goodsDeclarePage: GoodsDeclarePage,
    ) { }

    async openNewGoodsRecord(): Promise<void> {
        await ReportLog.step('Click New Goods Record', async () => {
            await this.consignmentOverviewPage.openNewGoodsRecord();
        });
    }

    // ===================== Trader Goods Profile =====================

    /**
     * Answer "Do you want to use a Trader Goods Profile?" and, when the answer is
     * yes, pick the record on the screen that follows. Returns whether the item ends
     * up declared from a TGP record — the caller needs it, because the service then
     * fills the commodity code, goods description, supplementary units and country
     * of origin from the record and runs a route that skips those screens.
     *
     * The question only appears when the signed-in trader has a TGP profile — a fact
     * about the environment — so its presence is detected rather than declared. A
     * test that asked for TGP but never saw the screen fails: its TGP path was not
     * exercised, so a green result would be misleading.
     *
     * Detection happens OUTSIDE the Allure step on purpose. Wrapping it would emit a
     * step named "Answer ..." even on an account that was never asked the question,
     * recording an answer that was never given.
     */
    async declareTgp(input: GoodsData): Promise<boolean> {
        if (!await this.goodsDeclarePage.isUseTgpQuestionShown()) {
            if (input.useTGP) {
                throw new Error(
                    'Test data sets "useTGP" but the app never asked the TGP question, so the ' +
                    'TGP path was not exercised. Two things produce this, in the order worth ' +
                    'checking: the signed-in trader has no TGP profile set up, OR the trader ' +
                    'does have one and the app failed to offer the screen - which is a product ' +
                    'defect, not a test-data problem.'
                );
            }
            return false;
        }

        await ReportLog.step('Answer "Do you want to use a Trader Goods Profile?"', async () => {
            await this.goodsDeclarePage.answerUseTgp(input.useTGP);
        });

        if (!input.useTGP) {
            return false;
        }

        await ReportLog.step('Enter the Trader Goods Profile number', async () => {
            await this.goodsDeclarePage.selectTgpNumber(input.tgpRecord.lookup);
        });

        return true;
    }

    // ===================== Procedure codes =====================

    async selectGoodsProcedureCode(input: GoodsData): Promise<void> {
        await ReportLog.step('Select the goods procedure code', async () => {
            await this.goodsDeclarePage.selectGoodsProcedureCode(input.goodsProcedureCode);
        });
    }

    async selectAdditionalProcedureCode(input: GoodsData): Promise<void> {
        await ReportLog.step('Select the additional procedure code', async () => {
            await this.goodsDeclarePage.selectAdditionalProcedureCode(input.additionalProcedureCode);
        });
    }

    // ===================== Controls =====================

    /** The goods-level "are these goods controlled?" question, on its own screen. */
    async declareControlledGoods(input: GoodsData): Promise<void> {
        await ReportLog.step('Define if the goods are controlled', async () => {
            if (input.areGooodsControlled) {
                await this.goodsDeclarePage.selectGoodsControlledYes();
            } else {
                await this.goodsDeclarePage.selectGoodsControlledNo();
            }
        });
    }

    /** Answering yes adds the UN codes screen — see declareDangerousGoodsCodes. */
    async declareDangerousGoods(input: GoodsData): Promise<void> {
        await ReportLog.step('Define if the goods are dangerous', async () => {
            if (input.isDangerousGoods) {
                await this.goodsDeclarePage.selectDangerousGoodsYes();
            } else {
                await this.goodsDeclarePage.selectDangerousGoodsNo();
            }
        });
    }

    async declareDangerousGoodsCodes(input: GoodsData): Promise<void> {
        await ReportLog.step('Input the dangerous goods UN codes', async () => {
            await this.goodsDeclarePage.inputDangerousGoodsCodes(input.dangerousGoodsCodes);
        });
    }

    // ===================== The goods themselves =====================

    async enterCommodityInformation(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Commodity Information', async () => {
            await this.goodsDeclarePage.enterGoodsDescriptionAndCommodityCode(
                input.goodsDescription,
                input.commodityCode
            );
        });
    }

    /** The ENS packaging screen, which also asks for the number of pieces. */
    async enterPackagingDetails(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Packaging Information', async () => {
            await this.goodsDeclarePage.enterPackagingDetails(
                input.shippingMarks,
                input.typeOfPackages,
                input.numberOfPackages,
                input.numberOfPieces
            );
        });
    }

    /** The standalone packaging screen — the same screen minus "number of pieces". */
    async enterStandalonePackagingDetails(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Packaging Information', async () => {
            await this.goodsDeclarePage.inputShippingMarks(input.shippingMarks);
            await this.goodsDeclarePage.selectTypeOfPackages(input.typeOfPackages);
            await this.goodsDeclarePage.inputNumberOfPackages(input.numberOfPackages);
            await this.goodsDeclarePage.clickContinueButton();
        });
    }

    async enterWeightInformation(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Weight Information', async () => {
            await this.goodsDeclarePage.enterWeightInformation(input.grossMass, input.netMass);
        });
    }

    /** Per-item container details, only when the goods are in different containers. */
    async enterContainerInformation(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Container Information', async () => {
            await this.goodsDeclarePage.enterContainerInformation(
                input.containerIdentifierNumber,
                input.containerSize,
                input.containerStatus,
                input.containerSupplierType
            );
        });
    }

    /** The consignment already captured the currency; here it is only the price. */
    async enterItemPrice(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Invoice Details', async () => {
            await this.goodsDeclarePage.enterItemPrice(input.itemPriceAmount);
        });
    }

    async enterCountryOfOrigin(input: GoodsData): Promise<void> {
        await ReportLog.step('Select Country of Origin', async () => {
            await this.goodsDeclarePage.enterCountryOfOrigin(input.countryOfOrigin);
        });
    }

    async finishGoodsItemDeclaration(): Promise<void> {
        await ReportLog.step('Finish Goods Item Declaration', async () => {
            await this.goodsDeclarePage.clickFinishButton();
        });
    }
}
