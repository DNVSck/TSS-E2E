import { toPartyAddress } from '../../page-object/components/party-block';
import { ReportLog } from '../../core/report/report-log';
import { ConsignmentData } from '../../test-data/consignment-data';
import { ConsignmentSteps } from './consignment-steps';

/**
 * One consignment on the four ENS-integrated journeys (ENS-only, EIDR, SFD, IMMI).
 *
 * The method body IS the screen list: every screen is one call on ConsignmentSteps,
 * and the conditionals say which journey reaches it. The standalone wizards share
 * several of these screens but reach them in a different order and mixed with
 * movement screens, which is why each journey keeps its own spine.
 */
export class AddNewEnsConsignmentFlow {
    constructor(private readonly consignmentSteps: ConsignmentSteps) { }

    async addNewEnsConsignment(input: ConsignmentData): Promise<void> {
        await ReportLog.step('Add new ENS consignment', async () => {
            // The exporter (+ "seller same as exporter?") and the invoice-currency
            // screen are one coupled pair: both appear on the IMMI and controlled-goods
            // SFD journeys, and both are absent on the two reduced journeys — ENS-only
            // and EIDR (SFD with controlled goods = No), which ask for the seller
            // directly and never reach invoice currency.
            const hasExporterAndCurrency =
                !input.isEnsOnly && (input.useIMMI || input.isControlledGoods);

            await this.consignmentSteps.clickNewEnsConsignment();
            await this.declareEnsOnlyChoice(input);

            if (input.isEnsOnly) {
                await this.consignmentSteps.fillBuyerDetails(input.buyerEORI, toPartyAddress('buyer', input));
            } else {
                await this.consignmentSteps.fillImporterEori(input.importerEORI);
                await this.fillBuyerInformation(input);
                await this.consignmentSteps.declareUseImmi(input.useIMMI, input.importerEORI);

                // Accepting IMMI is the only answer that retires the question.
                if (!input.useIMMI) {
                    await this.consignmentSteps.declareControlledGoods(input.isControlledGoods);
                }
            }

            await this.fillTransportAndDestinationDetails(input);
            await this.consignmentSteps.fillConsignorDetails(input.consignorEORI, toPartyAddress('consignor', input));
            await this.consignmentSteps.fillConsigneeDetails(input.consigneeEORI, toPartyAddress('consignee', input));
            await this.fillExporterAndSeller(input, hasExporterAndCurrency);
            await this.consignmentSteps.fillTraderReference(input.traderReference ?? '');
            await this.fillBorderAndContainerInformation(input);

            if (hasExporterAndCurrency) {
                await this.consignmentSteps.selectInvoiceCurrency(input.invoiceCurrency);
            }

            await this.consignmentSteps.finishConsignmentDeclaration();
        });
    }

    private async declareEnsOnlyChoice(input: ConsignmentData): Promise<void> {
        await this.consignmentSteps.declareEnsOnlyChoice(input.isEnsOnly);

        if (!input.isEnsOnly) {
            return;
        }
        if (!input.ensOnlyReason) {
            throw new Error('Test data for an ENS-only consignment must set "ensOnlyReason".');
        }
        await this.consignmentSteps.selectEnsOnlyReason(input.ensOnlyReason);
    }

    /** Routes to the screens the answer opens; the answer itself is its own step. */
    private async fillBuyerInformation(input: ConsignmentData): Promise<void> {
        await this.consignmentSteps.declareBuyerSameAsImporter(input.isBuyerSameAsImporter);

        if (input.isBuyerSameAsImporter) {
            await this.consignmentSteps.fillBuyerAddress(toPartyAddress('buyer', input));
            return;
        }

        await this.consignmentSteps.fillBuyerDetails(input.buyerEORI, toPartyAddress('buyer', input));
    }

    /** Three journeys, three screens: only the document number is common. */
    private async fillTransportAndDestinationDetails(input: ConsignmentData): Promise<void> {
        if (input.isEnsOnly) {
            await this.consignmentSteps.fillEnsOnlyTransportAndDestination(
                input.transportDocumentNumber, input.destinationCountryCode
            );
            return;
        }

        // IMMI is only ever offered on the full journey, so this is false for ENS-only.
        if (input.useIMMI) {
            await this.consignmentSteps.fillImmiTransportAndDestination(input.transportDocumentNumber);
            return;
        }

        await this.consignmentSteps.fillSfdTransportAndDestination(
            input.transportDocumentNumber, input.goodsDomesticStatus
        );
    }

    /**
     * The exporter and the "seller same as exporter?" question appear only when the
     * journey has them (IMMI or controlled-goods SFD). The two reduced journeys —
     * ENS-only and EIDR — skip the exporter and ask for the seller directly.
     */
    private async fillExporterAndSeller(input: ConsignmentData, hasExporter: boolean): Promise<void> {
        if (!hasExporter) {
            await this.consignmentSteps.fillSellerDetails(input.sellerEORI, toPartyAddress('seller', input));
            return;
        }

        await this.consignmentSteps.fillExporterDetails(input.exporterEORI, toPartyAddress('exporter', input));
        await this.consignmentSteps.declareSellerSameAsExporter(input.isSellerSameAsExporter);

        if (!input.isSellerSameAsExporter) {
            await this.consignmentSteps.fillSellerDetails(input.sellerEORI, toPartyAddress('seller', input));
        }
    }

    private async fillBorderAndContainerInformation(input: ConsignmentData): Promise<void> {
        await this.consignmentSteps.declareGoodsCrossEUBorder(input.isGoodsCrossEUBorder);

        // The container screens only appear when the goods cross the EU external border.
        if (!input.isGoodsCrossEUBorder) {
            return;
        }

        await this.consignmentSteps.declareAllGoodsInSameContainer(input.isSameContainer);

        if (input.isSameContainer) {
            await this.consignmentSteps.fillContainerIdentification(
                input.containerIdentifierNumber,
                input.containerSize,
                input.containerPackedStatus,
                input.containerSupplierType
            );
        }
    }
}

// The address screens take the same shape for every party, so the mapping from
// test data lives here rather than being spelled out at each call site.
