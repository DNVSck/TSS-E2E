import { MovementOverviewPage } from '../../page-object/movement-overview-page';
import { ConsignmentDeclarePage } from '../../page-object/consignment-declare-page';
import { PartyAddress } from '../../page-object/components/party-block';
import { ReportLog } from '../../core/report/report-log';

/**
 * One method per consignment wizard screen: it owns that screen's Allure step name,
 * so every journey reports the same screen under the same name.
 *
 * NOT a page object — it holds no locators. Locators and raw interaction stay in
 * ConsignmentDeclarePage; this layer decides what a screen means for a journey, and
 * the per-journey flows decide which screens they visit and in what order.
 *
 * Methods take plain values rather than a journey's data object: the ENS journeys and
 * the three standalone journeys carry unrelated data types, so a shared screen cannot
 * depend on either. See MovementSteps, which the standalone wizards also draw from.
 *
 * The class owns one WIZARD, not one page: alongside the screens it also owns the
 * action that opens the wizard, even though that button sits on the movement overview.
 * That is why two page objects are injected.
 *
 * It is a CATALOGUE of every screen a consignment declaration can show — not the
 * screen list of any one journey. Do not read a journey's shape out of it: which
 * screens a journey visits, and in what order, is stated by that journey's flow
 * beside this file, and those spines are short enough to read end to end.
 *
 * Resist splitting it by consumer ("shared" vs "ENS-only"). The journeys overlap
 * WITHOUT nesting — controlled goods is ENS+SFD, the buyer question is ENS+FFD, the
 * container screens are ENS+SFD+FFD — so no split holds: the next shared screen
 * re-cuts the line, and the subsets multiply into EnsAndSfdSteps and friends. Sharing
 * that overlaps belongs in composition at the flow layer, not in a class hierarchy.
 */
export class ConsignmentSteps {
    constructor(
        private readonly movementOverviewPage: MovementOverviewPage,
        private readonly consignmentDeclarePage: ConsignmentDeclarePage,
    ) { }

    /**
     * The wizard's entry point. The button lives on the movement overview — that page
     * lists a movement's consignments — but what it opens is this wizard, so it lives
     * here with the screens it leads to rather than with the movement steps. Compare
     * MovementSteps.openTransportDetails (a task-list button) and
     * GoodsItemSteps.openNewGoodsRecord (a consignment-overview button).
     */
    async clickNewEnsConsignment(): Promise<void> {
        await ReportLog.step('Click New ENS Consignment', async () => {
            await this.movementOverviewPage.clickNewENSConsignment();
        });
    }

    // ===================== Journey fork =====================

    /** Answering yes adds the reason screen; answering no starts the full journey. */
    async declareEnsOnlyChoice(isEnsOnly: boolean): Promise<void> {
        await ReportLog.step('Answer "Do you wish to complete ENS only?"', async () => {
            if (isEnsOnly) {
                await this.consignmentDeclarePage.selectEnsOnlyYes();
            } else {
                await this.consignmentDeclarePage.selectEnsOnlyNo();
            }
        });
    }

    async selectEnsOnlyReason(reason: string): Promise<void> {
        await ReportLog.step('Select the ENS-only reason', async () => {
            await this.consignmentDeclarePage.selectEnsOnlyReason(reason);
        });
    }

    /**
     * Whether the IMMI question is put at all depends on the importer entered a
     * moment ago, not on the signed-in account: an importer without IMMI enabled goes
     * straight to controlled goods. Reported back rather than judged here — whether
     * that importer SHOULD have been asked is a permission the flow reads from the
     * Portal API, and a step that has not read it can only guess.
     *
     * Returns whether the question was put.
     */
    async declareUseImmiIfAsked(useIMMI: boolean): Promise<boolean> {
        if (!await this.consignmentDeclarePage.isUseImmiQuestionShown()) {
            return false;
        }

        await ReportLog.step('Answer "Do you want to use IMMI?"', async () => {
            if (useIMMI) {
                await this.consignmentDeclarePage.selectUseIMMIYes();
                return;
            }
            await this.consignmentDeclarePage.selectUseIMMINo();
        });

        return true;
    }

    /** Asked when IMMI is declined, and when the importer was never offered it. */
    async declareControlledGoods(isControlledGoods: boolean): Promise<void> {
        await ReportLog.step('Answer "Do the goods contain controlled goods?"', async () => {
            if (isControlledGoods) {
                await this.consignmentDeclarePage.selectControlledGoodsYes();
            } else {
                await this.consignmentDeclarePage.selectControlledGoodsNo();
            }
        });
    }

    // ===================== Importer and buyer =====================

    /**
     * The importer has no address screen: its EORI must already exist in TSS, and an
     * unknown one is rejected on the spot.
     */
    async fillImporterEori(importerEORI: string): Promise<void> {
        await ReportLog.step('Fill Importer information', async () => {
            await this.consignmentDeclarePage.inputImporterEORI(importerEORI);
        });
    }


    async selectRepresentationType(representationType: string): Promise<void> {
        await ReportLog.step('Select representation type', async () => {
            await this.consignmentDeclarePage.selectRepresentationType(representationType);
        });
    }

    /** "Is the buyer's EORI the same as the importer's?" carries only the radio. */
    async declareBuyerSameAsImporter(isSame: boolean): Promise<void> {
        await ReportLog.step('Answer "Is the buyer the same as the importer?"', async () => {
            if (isSame) {
                await this.consignmentDeclarePage.selectBuyerSameAsImporterYes();
            } else {
                await this.consignmentDeclarePage.selectBuyerSameAsImporterNo();
            }
            await this.consignmentDeclarePage.clickContinueButton();
        });
    }

    /** Answering yes skips the buyer's EORI screen, but the address is still asked. */
    async fillBuyerAddress(address: PartyAddress): Promise<void> {
        await ReportLog.step('Fill Buyer address', async () => {
            await this.consignmentDeclarePage.inputBuyerAddress(address);
        });
    }

    /**
     * The buyer's EORI screen. Reached from "not the same as the importer" on the full
     * journey, and directly on ENS-only, which has no importer to compare against.
     * PartyBlock adds the address screen when the EORI is blank or unregistered, so
     * that boundary is not visible here and the two stay in one step.
     */
    async fillBuyerDetails(buyerEORI: string, address: PartyAddress): Promise<void> {
        await ReportLog.step('Fill Buyer information', async () => {
            await this.consignmentDeclarePage.inputBuyerDetails(buyerEORI, address);
        });
    }

    // ===================== Transport =====================

    async fillEnsOnlyTransportAndDestination(transportDocumentNumber: string, destinationCountryCode: string): Promise<void> {
        await ReportLog.step('Fill Transport and destination details', async () => {
            await this.consignmentDeclarePage.fillEnsOnlyTransportAndDestinationDetails(
                transportDocumentNumber, destinationCountryCode
            );
        });
    }

    async fillImmiTransportAndDestination(transportDocumentNumber: string): Promise<void> {
        await ReportLog.step('Fill Transport and destination details', async () => {
            await this.consignmentDeclarePage.fillImmiTransportAndDestinationDetails(transportDocumentNumber);
        });
    }

    async fillSfdTransportAndDestination(transportDocumentNumber: string, goodsDomesticStatus: string): Promise<void> {
        await ReportLog.step('Fill Transport and destination details', async () => {
            await this.consignmentDeclarePage.fillSfdTransportAndDestinationDetails(
                transportDocumentNumber, goodsDomesticStatus
            );
        });
    }

    // ===================== Trade parties =====================

    async fillConsignorDetails(consignorEORI: string, address: PartyAddress): Promise<void> {
        await ReportLog.step('Fill Consignor information', async () => {
            await this.consignmentDeclarePage.inputConsignorDetails(consignorEORI, address);
        });
    }

    async fillConsigneeDetails(consigneeEORI: string, address: PartyAddress): Promise<void> {
        await ReportLog.step('Fill Consignee information', async () => {
            await this.consignmentDeclarePage.inputConsigneeDetails(consigneeEORI, address);
        });
    }

    /**
     * The exporter's EORI screen. As with the other parties, PartyBlock decides at
     * runtime whether the address screen follows, so the two stay in one step.
     */
    async fillExporterDetails(exporterEORI: string, address: PartyAddress): Promise<void> {
        await ReportLog.step('Fill Exporter information', async () => {
            await this.consignmentDeclarePage.inputExporterDetails(exporterEORI, address);
        });
    }

    /** Answering yes ends the seller journey; answering no opens the seller's screens. */
    async declareSellerSameAsExporter(isSame: boolean): Promise<void> {
        await ReportLog.step('Answer "Is the seller the same as the exporter?"', async () => {
            if (isSame) {
                await this.consignmentDeclarePage.selectSellerSameAsExporterYes();
            } else {
                await this.consignmentDeclarePage.selectSellerSameAsExporterNo();
            }
            await this.consignmentDeclarePage.clickContinueButton();
        });
    }

    async fillSellerDetails(sellerEORI: string, address: PartyAddress): Promise<void> {
        await ReportLog.step('Fill Seller information', async () => {
            await this.consignmentDeclarePage.inputSellerDetails(sellerEORI, address);
        });
    }

    // ===================== References, containers, currency =====================

    async fillTraderReference(traderReference: string): Promise<void> {
        await ReportLog.step('Fill Trader reference (Optional field)', async () => {
            await this.consignmentDeclarePage.inputTraderReference(traderReference);
        });
    }

    async declareGoodsCrossEUBorder(crossesBorder: boolean): Promise<void> {
        await ReportLog.step('Answer "Do the goods cross the EU external border?"', async () => {
            if (crossesBorder) {
                await this.consignmentDeclarePage.selectGoodsCrossEUBorderYes();
            } else {
                await this.consignmentDeclarePage.selectGoodsCrossEUBorderNo();
            }
        });
    }

    /** Answering yes adds the container-identification screen. */
    async declareAllGoodsInSameContainer(isSameContainer: boolean): Promise<void> {
        await ReportLog.step('Answer "Are all the goods in the same container?"', async () => {
            if (isSameContainer) {
                await this.consignmentDeclarePage.selectAllGoodsInSameContainersYes();
            } else {
                await this.consignmentDeclarePage.selectAllGoodsInSameContainersNo();
            }
        });
    }

    async fillContainerIdentification(
        containerIdentifierNumber: string,
        containerSize: string,
        containerPackedStatus: string,
        containerSupplierType: string
    ): Promise<void> {
        await ReportLog.step('Fill Container identification', async () => {
            await this.consignmentDeclarePage.fillContainerIdentification(
                containerIdentifierNumber, containerSize, containerPackedStatus, containerSupplierType
            );
        });
    }

    async selectInvoiceCurrency(invoiceCurrency: string): Promise<void> {
        await ReportLog.step('Select Invoice currency', async () => {
            await this.consignmentDeclarePage.selectInvoiceCurrency(invoiceCurrency);
        });
    }

    async finishConsignmentDeclaration(): Promise<void> {
        await ReportLog.step('Finish consignment declaration', async () => {
            await this.consignmentDeclarePage.clickFinishButton();
        });
    }
}
