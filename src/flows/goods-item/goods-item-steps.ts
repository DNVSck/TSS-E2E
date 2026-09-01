import { ConsignmentOverviewPage } from '../../page-object/consignment-overview-page';
import { GoodsDeclarePage } from '../../page-object/goods-declare-page';
import { GoodsData } from '../../test-data/goods-data';
import { ReportLog } from '../../core/report/report-log';
import { requiresWarehouseIdentifier } from '../../helper/procedure-code-helper';

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
        const record = input.tgpRecord;

        // The answer and the record are separate fields, so they can disagree. Check
        // that BEFORE touching the page: a mis-specified test should fail on its own
        // mistake, named plainly, rather than on whatever the app does next - which
        // reads like a product problem and sends the reader to the wrong place.
        if (input.useTGP && !record) {
            throw new Error(
                'Test data sets "useTGP" but names no "tgpRecord". Pick one from TGP_RECORD. ' +
                'There is deliberately no default: which records exist depends on the ' +
                'environment and on the trader being declared for, so a default would run ' +
                'this test against a record nobody chose.'
            );
        }
        if (!input.useTGP && record) {
            throw new Error(
                `Test data names the TGP record "${record.traderRef}" but leaves "useTGP" false, ` +
                'so the record would be ignored and the goods item declared without TGP. Set ' +
                'useTGP to true, or drop the record.'
            );
        }

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

        // Guarded above: useTGP and a record now agree, so this also ends the no branch.
        if (!record) {
            return false;
        }

        await ReportLog.step('Enter the Trader Goods Profile number', async () => {
            await this.goodsDeclarePage.selectTgpNumber(record.lookup);
        });

        return true;
    }

    // ===================== Procedure codes =====================

    async selectGoodsProcedureCode(input: GoodsData): Promise<void> {
        await ReportLog.step('Select the goods procedure code', async () => {
            await this.goodsDeclarePage.selectGoodsProcedureCode(input.procedureCode);
        });
    }

    async selectAdditionalProcedureCode(input: GoodsData): Promise<void> {
        await ReportLog.step('Select the additional procedure code', async () => {
            await this.goodsDeclarePage.selectAdditionalProcedureCode(input.additionalProcedureCode);
        });
    }

    /**
     * The supervising customs office screen, which comes immediately BEFORE the
     * warehouse identifier one.
     *
     * Two gates, because neither alone is right. The procedure code decides whether it
     * is worth looking at all - a code that reaches no warehouse screen reaches no
     * supervising office screen either, so the common journeys pay nothing. Which of the
     * warehoused codes actually ask is the service's own rule and is not written down
     * here, so the page then LOOKS rather than assumes.
     *
     * If that set is ever stated, this becomes a rule in procedure-code-helper beside
     * requiresWarehouseIdentifier, and the probe goes away.
     */
    async selectSupervisingCustomsOfficeIfAsked(input: GoodsData): Promise<void> {
        if (!requiresWarehouseIdentifier(input.procedureCode)) {
            return;
        }

        await ReportLog.step('Select the supervising customs office', async () => {
            const asked = await this.goodsDeclarePage.selectSupervisingCustomsOfficeIfPresent(
                input.supervisingCustomsOffice
            );

            ReportLog.setParameter(
                'Supervising customs office screen',
                asked ? `answered ${input.supervisingCustomsOffice}` : 'not shown'
            );
        });
    }

    /**
     * "Warehouse identifier", which the wizard inserts after the procedure codes only
     * for warehousing procedure codes.
     *
     * Whether to visit it is decided HERE rather than by the journey flows, from the
     * procedure code the item is being declared under. Every journey gets the rule for
     * free that way, and a journey cannot forget it: the screen appears because of the
     * procedure code, so that is the only thing worth asking.
     */
    async enterWarehouseIdentifierIfAsked(input: GoodsData): Promise<void> {
        if (!requiresWarehouseIdentifier(input.procedureCode)) {
            return;
        }

        await ReportLog.step('Enter the warehouse identifier', async () => {
            await this.goodsDeclarePage.enterWarehouseIdentifier(
                input.warehouseType,
                input.warehouseIdentifier
            );
        });
    }

    // ===================== Controls =====================

    /** The goods-level "are these goods controlled?" question, on its own screen. */
    async declareControlledGoods(input: GoodsData): Promise<void> {
        await ReportLog.step('Define if the goods are controlled', async () => {
            if (input.areGoodsControlled) {
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

    /**
     * The dangerous-goods screen and the UN-code screen the answer Yes opens behind it.
     *
     * One method because the second screen exists only as a consequence of the first:
     * every journey that reaches this pair reaches both halves under the same rule, and
     * spelling the rule out per flow is how the two copies of it drifted apart.
     */
    async declareDangerousGoodsWithCodes(input: GoodsData): Promise<void> {
        await this.declareDangerousGoods(input);

        if (input.isDangerousGoods) {
            await this.declareDangerousGoodsCodes(input);
        }
    }

    /**
     * The goods-level control questions in the order the service asks them: are the
     * goods controlled, and - only when that was answered Yes - are they dangerous.
     * Answering No sends the wizard straight on to the country of origin.
     *
     * For the journeys where the two questions are NOT that chain, see
     * AddNewEnsGoodsItemFlow: on ENS-only the dangerous question is asked with no
     * controlled question before it, and on IMMI the controlled question is asked with
     * no dangerous question after it. Those call the halves directly.
     */
    async declareControlledAndDangerousGoods(input: GoodsData): Promise<void> {
        await this.declareControlledGoods(input);

        if (!input.areGoodsControlled) {
            return;
        }

        await this.declareDangerousGoodsWithCodes(input);
    }

    // ===================== The goods themselves =====================

    async enterCommodityInformation(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Commodity Information', async () => {
            await this.goodsDeclarePage.enterGoodsDescriptionAndCommodityCode(
                input.goodsDescription,
                input.commodityCode,
                input.supplementaryUnits
            );
        });
    }

    /**
     * The commodity screen on a journey that does not ask for supplementary units.
     * Two methods rather than one with a flag, for the same reason enterPackagingDetails
     * and enterStandalonePackagingDetails are separate: the screens differ, so a failure
     * names the one the journey actually showed.
     */
    async enterCommodityInformationWithoutSupplementaryUnits(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Commodity Information', async () => {
            await this.goodsDeclarePage.enterGoodsDescriptionAndCommodityCodeOnly(
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

    /**
     * The NIRMS screen, when the service shows it. A no-op otherwise - see
     * GoodsDeclarePage.answerUseNirmsIfPresent for why this one cannot be decided from
     * the journey's own flags.
     */
    async answerNirmsIfAsked(input: GoodsData): Promise<void> {
        await ReportLog.step('Answer NIRMS', async () => {
            const asked = await this.goodsDeclarePage.answerUseNirmsIfPresent(input.useNirms);

            const answer = input.useNirms ? 'Yes' : 'No';
            ReportLog.setParameter('NIRMS screen', asked ? `answered ${answer}` : 'not shown');
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
