import { ReportLog } from '../core/report/report-log';
import {ConsignmentOverviewPage} from "../page-object/consignment-overview-page";
import {GoodsDeclarePage} from "../page-object/goods-declare-page";
import  {GoodsData} from  "../test-data/goods-data";

/**
 * Which of the conditional goods-item screens a journey reaches. Derived from the
 * consignment answers, because the goods flow branches on consignment-level facts
 * (see the goods BPMN): the domestic status and risk status are auto-filled from
 * the consignment and never shown here; ENS-only skips the procedure codes; the
 * controlled-goods question only shows when the consignment declared controlled
 * goods; the TGP screen only shows on IMMI; the per-item container screen only
 * shows when the consignment declared goods in different containers; and the goods
 * invoice screen only shows (asking the item price alone) when the consignment
 * already captured an invoice currency.
 */
export interface GoodsJourneyContext {
    readonly useIMMI: boolean;
    readonly isEnsOnly: boolean;
    readonly isControlledGoods: boolean;
    readonly hasDangerousGoods: boolean;
    readonly hasGoodsContainer: boolean;
    readonly hasInvoiceDetails: boolean;
}

export class AddNewGoodsItemFlow {
    constructor(
        private readonly consignmentOverviewPage: ConsignmentOverviewPage,
        private readonly goodsDeclarePage: GoodsDeclarePage,
    ) { }

    async addNewGoodsItem(input: GoodsData, journey: GoodsJourneyContext): Promise<void> {
        await ReportLog.step('Add new goods item', async () => {
            await this.clickNewGoodsRecordAtOverview();
            await this.declarePreCommodityScreens(input, journey);
            await this.declareCoreGoodsScreens(input);
            await this.declarePostCommodityScreens(input, journey);
            await this.finishGoodsItemDeclaration();
        });
    }

    /** Conditional screens shown, in order, before the commodity screen. */
    private async declarePreCommodityScreens(input: GoodsData, journey: GoodsJourneyContext): Promise<void> {
        // The TGP screen is the first goods screen, but only on the IMMI journey.
        if (journey.useIMMI) {
            await this.handleTgpFlow(input);
        }

        // ENS-only has no procedure codes; every other journey starts here.
        if (!journey.isEnsOnly) {
            await this.fillProcedureCodesFlow(input);
        }

        // The goods-level "are the goods controlled?" question only appears when
        // the consignment itself declared controlled goods.
        if (journey.isControlledGoods) {
            await this.fillControlledGoodsFlow(input);
        }

        // The dangerous-goods question follows on every journey except EIDR.
        if (journey.hasDangerousGoods) {
            await this.fillDangerousGoodsFlow(input);
        }

        // On SFD the country-of-origin screen precedes the commodity screen. IMMI
        // instead asks it near the end, after the invoice screen — see
        // declarePostCommodityScreens.
        if (journey.hasInvoiceDetails && !journey.useIMMI) {
            await this.fillCountryOfOriginFlow(input);
        }
    }

    /** The screens shown on every goods item: commodity, packaging, weight. */
    private async declareCoreGoodsScreens(input: GoodsData): Promise<void> {
        await this.fillCommodityInformationFlow(input);
        await this.fillPackagingFlow(input);
        await this.fillWeightFlow(input);
    }

    /** Conditional screens shown, in order, after the weight screen. */
    private async declarePostCommodityScreens(input: GoodsData, journey: GoodsJourneyContext): Promise<void> {
        // Per-item container details, only when goods are in different containers.
        if (journey.hasGoodsContainer) {
            await this.fillGoodsContainerFlow(input);
        }

        // The consignment already captured the currency; here it is only the price.
        if (journey.hasInvoiceDetails) {
            await this.fillInvoiceDetailsFlow(input);
        }

        // On IMMI the country-of-origin screen comes here, after the invoice screen
        // (unlike SFD, where it precedes commodity — see declarePreCommodityScreens).
        if (journey.useIMMI) {
            await this.fillCountryOfOriginFlow(input);
        }
    }

    private async clickNewGoodsRecordAtOverview(): Promise<void> {
        await ReportLog.step('Click New Goods Record', async () => {
            await this.consignmentOverviewPage.openNewGoodsRecord();
        });
    }

    /**
     * The "use TGP?" screen only appears for IMMI goods when the signed-in trader
     * has a TGP profile, so it is detected at runtime; when absent there is nothing
     * to answer. A test that asked to use TGP but never saw the screen fails —
     * its TGP path was not actually exercised, so a green result would be misleading.
     */
    private async handleTgpFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Answer "Do you want to use TGP?" (IMMI goods only)', async () => {
            const shown = await this.goodsDeclarePage.answerUseTgpIfPresent(input.useTGP);
            if (!shown && input.useTGP) {
                throw new Error(
                    'Requested useTGP=true but the TGP screen never appeared — the signed-in ' +
                    'profile has no TGP set up, so the TGP path was not exercised.'
                );
            }
        });
    }

    private async fillProcedureCodesFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Procedure Codes', async () => {
            await this.goodsDeclarePage.selectGoodsProcedureCode(input.goodsProcedureCode);
            await this.goodsDeclarePage.selectAdditionalProcedureCode(input.additionalProcedureCode);
        });
    }

    /** The "are the goods controlled?" question, on its own screen. */
    private async fillControlledGoodsFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Define if the goods are controlled', async () => {
            if (input.areGooodsControlled) {
                await this.goodsDeclarePage.selectGoodsControlledYes();
            } else {
                await this.goodsDeclarePage.selectGoodsControlledNo();
            }
        });
    }

    /** The "is it a dangerous good?" question; answering yes also asks for UN codes. */
    private async fillDangerousGoodsFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Define if the goods are dangerous', async () => {
            if (input.isDangerousGoods) {
                await this.goodsDeclarePage.selectDangerousGoodsYes();
                await this.goodsDeclarePage.inputDangerousGoodsCodes(input.dangerousGoodsCodes);
            } else {
                await this.goodsDeclarePage.selectDangerousGoodsNo();
            }
        });
    }

    private async fillCommodityInformationFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Commodity Information', async () => {
            await this.goodsDeclarePage.enterGoodsDescriptionAndCommodityCode(
                input.goodsDescription,
                input.commodityCode
            );
        });
    }

    private async fillPackagingFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Packaging Information', async () => {
            await this.goodsDeclarePage.enterPackagingDetails(
                input.shippingMarks,
                input.typeOfPackages,
                input.numberOfPackages,
                input.numberOfPieces
            );
        });
    }

    private async fillWeightFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Weight Information', async () => {
            await this.goodsDeclarePage.enterWeightInformation(input.grossMass, input.netMass);
        });
    }

    private async fillGoodsContainerFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Container Information', async () => {
            await this.goodsDeclarePage.enterContainerInformation(
                input.containerIdentifierNumber,
                input.containerSize,
                input.containerStatus,
                input.containerSupplierType
            );
        });
    }

    private async fillInvoiceDetailsFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Fill Invoice Details', async () => {
            await this.goodsDeclarePage.enterItemPrice(input.itemPriceAmount);
        });
    }

    private async fillCountryOfOriginFlow(input: GoodsData): Promise<void> {
        await ReportLog.step('Select Country of Origin', async () => {
            await this.goodsDeclarePage.enterCountryOfOrigin(input.countryOfOrigin);
        });
    }

    private async finishGoodsItemDeclaration(): Promise<void> {
        await ReportLog.step('Finish Goods Item Declaration', async () => {
            await this.goodsDeclarePage.clickFinishButton();
        });
    }
}
