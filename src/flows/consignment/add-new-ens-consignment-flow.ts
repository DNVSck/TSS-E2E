import { expect } from '@playwright/test';
import { toPartyAddress } from '../../page-object/components/party-block';
import { ReportLog } from '../../core/report/report-log';
import { ConsignmentData } from '../../test-data/consignment-data';
import { ConsignmentSteps } from './consignment-steps';
import { AccessibilityCheckpoint } from '../accessibility-audit-flow';
import {
    CompanyPermissionService,
} from '../../api-service/portal-api/company-permission-service';
import { ENV } from '../../../config/environment';
import { TFunction, TranslationKey } from '../../fixtures/locale-fixture';

/**
 * One consignment on the four ENS-integrated journeys (ENS-only, EIDR, SFD, IMMI).
 *
 * The method body IS the screen list: every screen is one call on ConsignmentSteps,
 * and the conditionals say which journey reaches it. The standalone wizards share
 * several of these screens but reach them in a different order and mixed with
 * movement screens, which is why each journey keeps its own spine.
 */
export class AddNewEnsConsignmentFlow {
    constructor(
        private readonly consignmentSteps: ConsignmentSteps,
        private readonly companyPermissionService: CompanyPermissionService,
        private readonly t: TFunction,
    ) { }

    async addNewEnsConsignment(
        input: ConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await ReportLog.step('Add new ENS consignment', async () => {
            await this.consignmentSteps.clickNewEnsConsignment();
            await this.declareConsignment(input, checkpoint);
        });
    }

    async addConsignmentFirstConsignment(
        input: ConsignmentData,
        submitterEori: string,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await ReportLog.step('Add consignment-first ENS consignment', async () => {
            await checkpoint?.('Consignment - ENS submitter EORI', { probeErrors: true });
            await this.consignmentSteps.fillSubmitterEori(submitterEori);
            await this.declareConsignment(input, checkpoint);
        });
    }

    async associateExistingConsignment(consignmentReference: string): Promise<void> {
        await ReportLog.step('Associate an existing ENS consignment', async () => {
            await this.consignmentSteps.clickAssociateConsignment();
            await this.consignmentSteps.selectConsignmentToLink(consignmentReference);
        });
    }

    async verifyAssociationRefused(consignmentReference: string, expectedErrorKey: TranslationKey): Promise<void> {
        const expected = this.t(expectedErrorKey);

        await ReportLog.step(`Try to link ${consignmentReference} and expect it refused`, async () => {
            await this.consignmentSteps.clickAssociateConsignment();
            const errors = await this.consignmentSteps.submitConsignmentToLink(consignmentReference);

            expect(
                errors,
                `Linking ${consignmentReference} should be refused - errors shown on "Link an existing consignment" (must include "${expected}")`
            ).toContain(expected);
        });
    }

    private async declareConsignment(
        input: ConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        // The exporter (+ "seller same as exporter?") and the invoice-currency
        // screen are one coupled pair: both appear on the IMMI and controlled-goods
        // SFD journeys, and both are absent on the two reduced journeys — ENS-only
        // and EIDR (SFD with controlled goods = No), which ask for the seller
        // directly and never reach invoice currency.
        const hasExporterAndCurrency =
            !input.isEnsOnly && (input.useIMMI || input.isControlledGoods);

        await checkpoint?.('Consignment - importer EORI', { probeErrors: true });
        await this.consignmentSteps.fillImporterEori(input.importerEORI);

        await checkpoint?.('Consignment - ENS only choice', { probeErrors: true });
        await this.declareEnsOnlyChoice(input, checkpoint);

        if (input.representationType) {
            await checkpoint?.('Consignment - representation type', { probeErrors: true });
            await this.consignmentSteps.selectRepresentationType(input.representationType);
        }

        // Every journey reaches this now: the importer is known before the ENS-only
        // choice is made, so the buyer can be asked against it on both.
        await this.fillBuyerInformation(input, checkpoint);

        if (!input.isEnsOnly) {
            await this.declareUseImmi(input, checkpoint);

            // Accepting IMMI is the only answer that retires the question.
            if (!input.useIMMI) {
                await checkpoint?.('Consignment - controlled goods', { probeErrors: true });
                await this.consignmentSteps.declareControlledGoods(input.isControlledGoods);
            }
        }

        await checkpoint?.('Consignment - transport and destination', { probeErrors: true });
        await this.fillTransportAndDestinationDetails(input);
        await this.consignmentSteps.auditPartyScreens('consignor', checkpoint);
        await this.consignmentSteps.fillConsignorDetails(input.consignorEORI, toPartyAddress('consignor', input));
        await this.consignmentSteps.auditPartyScreens('consignee', checkpoint);
        await this.consignmentSteps.fillConsigneeDetails(input.consigneeEORI, toPartyAddress('consignee', input));
        await this.fillExporterAndSeller(input, hasExporterAndCurrency, checkpoint);
        // No probe: the trader reference is the one optional field in the wizard, so
        // an empty submit is accepted by design and would report a false finding.
        await checkpoint?.('Consignment - trader reference');
        await this.consignmentSteps.fillTraderReference(input.traderReference ?? '');
        await this.fillBorderAndContainerInformation(input, checkpoint);

        if (hasExporterAndCurrency) {
            await checkpoint?.('Consignment - invoice currency', { probeErrors: true });
            await this.consignmentSteps.selectInvoiceCurrency(input.invoiceCurrency);
        }

        await checkpoint?.('Consignment - check your answers');
        await this.consignmentSteps.finishConsignmentDeclaration();
    }


    private async declareUseImmi(
        input: ConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        const asked = await this.consignmentSteps
            .declareUseImmiIfAsked(input.useIMMI, checkpoint);

        ReportLog.setParameter('IMMI question', asked ? 'asked' : 'not asked');

        if (!input.useIMMI || asked) {
            return;
        }

        const grant = await this.companyPermissionService.readPermissionGrant(input.importerEORI);

        throw new Error(
            grant.hasUkimsAccess
                ? `The IMMI question was never put, but ${input.importerEORI} HAS UKIMS access `
                + `(access_ukims true), so the service should have asked it. No test data `
                + `explains this - the screen that was owed was not offered.`
                : `Test data sets "useIMMI" but ${input.importerEORI} has no UKIMS access on `
                + `"${ENV}" - the Portal API answers access_ukims false - so the IMMI question `
                + `is never put and no IMMI journey can run against it. Enable UKIMS on that `
                + `importer, or point IMPORTER_EORI in .env.${ENV} at one that has it.`
        );
    }

    private async declareEnsOnlyChoice(
        input: ConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await this.consignmentSteps.declareEnsOnlyChoice(input.isEnsOnly);

        if (!input.isEnsOnly) {
            return;
        }
        if (!input.ensOnlyReason) {
            throw new Error('Test data for an ENS-only consignment must set "ensOnlyReason".');
        }
        await checkpoint?.('Consignment - ENS only reason', { probeErrors: true });
        await this.consignmentSteps.selectEnsOnlyReason(input.ensOnlyReason);
    }

    /** Routes to the screens the answer opens; the answer itself is its own step. */
    private async fillBuyerInformation(
        input: ConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await checkpoint?.('Consignment - buyer same as importer', { probeErrors: true });
        await this.consignmentSteps.declareBuyerSameAsImporter(input.isBuyerSameAsImporter);

        if (input.isBuyerSameAsImporter) {
            await checkpoint?.('Consignment - buyer address', { probeErrors: true });
            await this.consignmentSteps.fillBuyerAddress(toPartyAddress('buyer', input));
            return;
        }

        await this.consignmentSteps.auditPartyScreens('buyer', checkpoint);
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
    private async fillExporterAndSeller(
        input: ConsignmentData,
        hasExporter: boolean,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        if (!hasExporter) {
            await this.consignmentSteps.auditPartyScreens('seller', checkpoint);
            await this.consignmentSteps.fillSellerDetails(input.sellerEORI, toPartyAddress('seller', input));
            return;
        }

        await this.consignmentSteps.auditPartyScreens('exporter', checkpoint);
        await this.consignmentSteps.fillExporterDetails(input.exporterEORI, toPartyAddress('exporter', input));
        await checkpoint?.('Consignment - seller same as exporter', { probeErrors: true });
        await this.consignmentSteps.declareSellerSameAsExporter(input.isSellerSameAsExporter);

        if (!input.isSellerSameAsExporter) {
            await this.consignmentSteps.auditPartyScreens('seller', checkpoint);
            await this.consignmentSteps.fillSellerDetails(input.sellerEORI, toPartyAddress('seller', input));
        }
    }

    private async fillBorderAndContainerInformation(
        input: ConsignmentData,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        await checkpoint?.('Consignment - goods cross EU border', { probeErrors: true });
        await this.consignmentSteps.declareGoodsCrossEUBorder(input.isGoodsCrossEUBorder);

        // The container screens only appear when the goods cross the EU external border.
        if (!input.isGoodsCrossEUBorder) {
            return;
        }

        await checkpoint?.('Consignment - all goods in same container', { probeErrors: true });
        await this.consignmentSteps.declareAllGoodsInSameContainer(input.isSameContainer);

        if (input.isSameContainer) {
            await checkpoint?.('Consignment - container identification', { probeErrors: true });
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
