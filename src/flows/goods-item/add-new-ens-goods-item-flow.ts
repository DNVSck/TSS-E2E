import { ReportLog } from '../../core/report/report-log';
import { GoodsData } from '../../test-data/goods-data';
import { GoodsItemSteps } from './goods-item-steps';
import { hidesSupplementaryUnit } from '../../helper/procedure-code-helper';

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
    /** The commodity screen collects supplementary units on SFD and IMMI only. */
    readonly hasSupplementaryUnits: boolean;
}

/**
 * One goods item on the four ENS-integrated journeys (ENS-only, EIDR, SFD, IMMI).
 *
 * The method body IS the screen list: every screen is one call on GoodsItemSteps,
 * and the conditionals say which journey reaches it. Screens are shared with the
 * standalone wizards beside this file; the order and the conditions are not, which
 * is why each journey keeps its own spine.
 */
function asksDangerousGoods(input: GoodsData, journey: GoodsJourneyContext): boolean {
    return journey.hasDangerousGoods
        && (!journey.isControlledGoods || input.areGoodsControlled);
}

export class AddNewEnsGoodsItemFlow {
    constructor(private readonly steps: GoodsItemSteps) { }

    /**
     * Returns whether the item was declared from a TGP record — the caller needs it
     * to know whether the overview should carry TGP-populated values.
     */
    async addNewGoodsItem(input: GoodsData, journey: GoodsJourneyContext): Promise<boolean> {
        return ReportLog.step('Add new goods item', async () => {
            await this.steps.openNewGoodsRecord();

            // The TGP screen is the first goods screen, but only on the IMMI journey.
            const usesTgp = journey.useIMMI ? await this.steps.declareTgp(input) : false;

            // ENS-only has no procedure codes; every other journey starts here.
            if (!journey.isEnsOnly) {
                await this.steps.selectGoodsProcedureCode(input);
                await this.steps.selectAdditionalProcedureCode(input);
                await this.steps.selectSupervisingCustomsOfficeIfAsked(input);
                await this.steps.enterWarehouseIdentifierIfAsked(input);
            }

            // The goods-level "are the goods controlled?" question only appears when
            // the consignment itself declared controlled goods.
            if (journey.isControlledGoods) {
                await this.steps.declareControlledGoods(input);
            }

            if (asksDangerousGoods(input, journey)) {
                await this.steps.declareDangerousGoodsWithCodes(input);
            }

            // On SFD the country-of-origin screen precedes the commodity screen. IMMI
            // instead asks it near the end, after the invoice screen — see below.
            if (journey.hasInvoiceDetails && !journey.useIMMI) {
                await this.steps.enterCountryOfOrigin(input);
            }

            // A TGP item skips the commodity screen outright — the record already
            // supplies the commodity code, description and supplementary units.
            if (!usesTgp) {
                await this.enterCommodity(input, journey);
            }

            // Between the commodity screen and packaging, which is where the service
            // inserted it (the screen's own Back link points at commodity-information).
            await this.steps.answerNirmsIfAsked(input);

            await this.steps.enterPackagingDetails(input);
            await this.steps.enterWeightInformation(input);

            // Per-item container details, only when goods are in different containers.
            if (journey.hasGoodsContainer) {
                await this.steps.enterContainerInformation(input);
            }

            if (journey.hasInvoiceDetails) {
                await this.steps.enterItemPrice(input);
            }

            // On IMMI the country-of-origin screen comes here, after the invoice
            // screen. A TGP item never reaches it: the record carries the country of
            // origin, so the app runs its own route ("...with-tgp-journey") that ends
            // at the invoice screen and goes straight to check-your-answers.
            if (journey.useIMMI && !usesTgp) {
                await this.steps.enterCountryOfOrigin(input);
            }

            await this.steps.finishGoodsItemDeclaration();
            return usesTgp;
        });
    }

    /**
     * The commodity screen, in whichever of its two shapes this item reaches.
     *
     * Two independent rules decide that. The JOURNEY decides whether the screen has a
     * supplementary-unit field at all - SFD and IMMI have one, the others do not - and
     * the item's own additional procedure code can then take it away again, which is
     * what hidesSupplementaryUnit reads off the code.
     */
    private async enterCommodity(input: GoodsData, journey: GoodsJourneyContext): Promise<void> {
        const showsSupplementaryUnits = journey.hasSupplementaryUnits
            && !hidesSupplementaryUnit(input.additionalProcedureCode);

        if (showsSupplementaryUnits) {
            await this.steps.enterCommodityInformation(input);
        } else {
            await this.steps.enterCommodityInformationWithoutSupplementaryUnits(input);
        }
    }
}
