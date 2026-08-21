import { ReportLog } from '../../core/report/report-log';
import { MovementDeclarePage } from '../../page-object/movement-declare-page';
import { ConsignmentDeclarePage } from '../../page-object/consignment-declare-page';
import { CommercialTermsDeclarePage } from '../../page-object/commercial-terms-declare-page';
import { GoodsDeclarePage } from '../../page-object/goods-declare-page';
import { Wizard } from '../../page-object/components/wizard';
import { toPartyAddress } from '../../page-object/components/party-block';
import {
    SUPPLEMENTARY_DECLARATION_STEP as STEP, SupplementaryDeclarationStep,
} from '../../constant/supplementary-declaration-step-constant';
import { SupplementaryDeclarationData } from '../../test-data/supplementary-declaration-data';

/**
 * The screens of a supplementary declaration's two wizards, one method per screen.
 *
 * Every method is "...IfAsked", and that is the whole character of this journey. An SD
 * is pre-populated from the frontier declaration that raised it, and each wizard puts
 * ONLY the questions still unanswered - so the screens differ from one declaration to
 * the next, and a flow that walked a fixed list would answer the wrong screen the first
 * time it met a declaration carrying more than the last one did.
 *
 * The test is the URL, not a locator: asking whether a field is visible costs a full
 * timeout on every screen that is not there, and the service already names each screen
 * in its own route. See SUPPLEMENTARY_DECLARATION_STEP.
 *
 * A step library rather than a flow: it owns no order. The order is the spine's, in
 * CompleteAndSubmitSupplementaryDeclarationFlow, because the order IS the journey and
 * belongs where a reader can see the whole of it.
 */
export class SupplementaryDeclarationSteps {
    constructor(
        private readonly wizard: Wizard<SupplementaryDeclarationStep>,
        private readonly movementPage: MovementDeclarePage,
        private readonly consignmentPage: ConsignmentDeclarePage,
        private readonly commercialTermsPage: CommercialTermsDeclarePage,
        private readonly goodsPage: GoodsDeclarePage,
    ) { }

    /**
     * Answer one screen, if it is the one showing.
     *
     * Reports nothing when the screen is absent. A skipped screen is not an event - the
     * declaration simply already had that answer - and a report listing the questions
     * nobody was asked buries the ones that were.
     *
     * The wait afterwards is what makes the NEXT check safe: Continue posts back to the
     * same step before redirecting, so without it every following step would test its
     * question against the screen this one just left.
     */
    private async answerIfAsked(
        step: SupplementaryDeclarationStep,
        report: string,
        answer: () => Promise<void>
    ): Promise<boolean> {
        if (!this.wizard.isOnStep(step)) {
            return false;
        }

        await ReportLog.step(report, async () => {
            await answer();
            await this.wizard.waitForStepToChange(step);
        });
        return true;
    }

    // ===================== Consignment header =====================

    /**
     * "Method of payment" - how the duty this declaration works out will be paid.
     *
     * Answered from two places, which is why it is gated like every other screen. The
     * wizard asks it only when the company profile left it unanswered; the deliberate
     * choice between this suite's two routes is made afterwards, by going to this same
     * screen through the overview's "Change" link. Either way the screen is the same one
     * and this answers it.
     */
    async selectMethodOfPaymentIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.METHOD_OF_PAYMENT,
            `Choose how the duty will be paid: "${input.methodOfPayment}"`,
            () => this.commercialTermsPage.selectMethodOfPayment(input.methodOfPayment)
        );
    }

    /**
     * "Vehicle details" or "Trailer details" - one screen or the other, never both.
     *
     * Which one follows the movement the frontier declaration was made for, and the
     * route says which without the test having to carry a copy of that answer.
     *
     * The registration is always TYPED OVER rather than accepted as found: the service
     * pre-populates it with `IMO<vessel>#<registration>` and its own validation rejects
     * the "#", so the screen renders with that error already showing. Seen on both
     * branches - `IMO9198941#TR12LER` and `IMO9198941#BT70ZAR`, SIT 2026-08-20.
     */
    async enterMeansOfTransportDetailsIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        const asVehicle = await this.answerIfAsked(
            STEP.VEHICLE_DETAILS,
            `Replace the pre-populated vehicle registration with "${input.meansOfTransportRegistration}"`,
            () => this.movementPage.enterVehicleDetails(
                input.meansOfTransportRegistration, input.nationalityMeansOfTransport
            )
        );

        return asVehicle || this.answerIfAsked(
            STEP.TRAILER_DETAILS,
            `Replace the pre-populated trailer registration with "${input.meansOfTransportRegistration}"`,
            () => this.movementPage.enterTrailerDetails(
                input.meansOfTransportRegistration, input.nationalityMeansOfTransport
            )
        );
    }

    /**
     * "Enter exporter profile" - name and address, with no EORI screen before it. Asked
     * only when the frontier declaration named no exporter.
     */
    async enterExporterProfileIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.EXPORTER_PROFILE,
            `Name the exporter as "${input.exporterName}"`,
            () => this.consignmentPage.enterExporterProfile(toPartyAddress('exporter', input))
        );
    }

    /** "Delivery terms" - the INCOTERM, and whether the UN/LOCODE is known. */
    async enterDeliveryTermsIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.DELIVERY_TERMS,
            `Declare delivery on ${input.incoterm} terms, `
            + `${input.isKnownUnlocode ? 'quoting' : 'without'} a UN/LOCODE`,
            () => this.commercialTermsPage.enterDeliveryTerms(input.incoterm, input.isKnownUnlocode)
        );
    }

    /** "UN/LOCODE" - the screen behind answering yes above. */
    async enterUnlocodeIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.DELIVERY_UNLOCODE,
            `Quote ${input.unlocode} as the delivery location`,
            () => this.commercialTermsPage.enterUnlocode(input.unlocode)
        );
    }

    /** "Delivery country" - the first of the two screens behind answering no. */
    async selectDeliveryCountryIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.DELIVERY_COUNTRY,
            `Select ${input.deliveryCountryCode} as the delivery country`,
            () => this.commercialTermsPage.selectDeliveryCountry(input.deliveryCountryCode)
        );
    }

    /** "Delivery place" - the options are filtered by the country chosen before it. */
    async selectDeliveryPlaceIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.DELIVERY_PLACE,
            `Select ${input.deliveryPlaceUnlocode} as the delivery place`,
            () => this.commercialTermsPage.selectDeliveryPlace(input.deliveryPlaceUnlocode)
        );
    }

    /** "What is the currency of the invoice?" */
    async selectInvoiceCurrencyIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.INVOICE_CURRENCY,
            `Declare the invoice in ${input.invoiceCurrency}`,
            () => this.consignmentPage.selectInvoiceCurrency(input.invoiceCurrency)
        );
    }

    // ===================== Goods item =====================

    /** "Country of origin" */
    async selectCountryOfOriginIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.COUNTRY_OF_ORIGIN,
            `Declare ${input.countryOfOrigin} as the country of origin`,
            () => this.goodsPage.enterCountryOfOrigin(input.countryOfOrigin)
        );
    }

    /**
     * "Commodity information" - only the supplementary units are typed; the code and
     * the description arrive from the frontier declaration.
     */
    async enterSupplementaryUnitsIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.COMMODITY_INFORMATION,
            `Add the supplementary units (${input.supplementaryUnits}) the tariff wants for this commodity`,
            () => this.goodsPage.enterSupplementaryUnits(input.supplementaryUnits)
        );
    }

    /**
     * "Enter weight information" - the gross mass arrives from the frontier
     * declaration, so only the net mass is new here.
     */
    async enterNetMassIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.WEIGHT_INFORMATION,
            `Add the net mass (${input.netMass}) the frontier declaration never took`,
            async () => {
                await this.goodsPage.inputNetMass(input.netMass);
                await this.goodsPage.clickContinueButton();
            }
        );
    }

    /** "Nature of goods" - the reason the goods are moving, at item level. */
    async selectNatureOfGoodsIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.NATURE_OF_GOODS,
            `Declare the nature of the transaction as ${input.natureOfGoods}`,
            () => this.goodsPage.selectNatureOfGoods(input.natureOfGoods)
        );
    }

    /** "Enter preference and valuation details" - what the duty rate is worked out from. */
    async enterPreferenceAndValuationIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.PREFERENCE_AND_VALUATION,
            `Claim preference ${input.preference} and value the goods by method ${input.valuationMethod}`,
            () => this.goodsPage.enterPreferenceAndValuation(
                input.preference, input.valuationMethod, input.countryOfPreferentialOrigin
            )
        );
    }

    /**
     * "Enter invoice details" - number, currency and price.
     *
     * Entering the number has a side effect worth stating once: the service adds an
     * [N935] invoice document reference to the goods item by itself, so nothing needs
     * to declare that document separately.
     */
    async enterInvoiceDetailsIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.INVOICE_DETAILS,
            `Price the goods at ${input.itemPrice} ${input.itemCurrency} on invoice ${input.invoiceNumber}`,
            () => this.goodsPage.enterInvoiceDetails(
                input.itemPrice, input.invoiceNumber, input.itemCurrency
            )
        );
    }

    /** "Statistical value" - the last answer the goods wizard needs. */
    async enterStatisticalValueIfAsked(input: SupplementaryDeclarationData): Promise<boolean> {
        return this.answerIfAsked(
            STEP.STATISTICAL_VALUE,
            `Declare a statistical value of ${input.statisticalValue}`,
            () => this.goodsPage.enterStatisticalValue(input.statisticalValue)
        );
    }

    // ===================== Both wizards =====================

    /**
     * "Check your answers before completing your submission".
     *
     * Its button reads "Complete and submit" and carries value="finish", so the shared
     * finish button drives it. NOT gated by answerIfAsked: this one has to happen, and
     * a wizard that is not on its last screen has left questions unanswered - which is
     * a failure worth seeing rather than skipping past.
     */
    async completeWizard(what: string): Promise<void> {
        await ReportLog.step(`Confirm the ${what} answers`, async () => {
            await this.goodsPage.clickFinishButton();
        });
    }

    /**
     * The same screen, when reaching it was not certain.
     *
     * Changing one answer from the overview returns to check-your-answers only if
     * nothing else is outstanding; if something is, the wizard asks for that instead and
     * there is nothing to confirm yet. Gated for that reason, unlike completeWizard,
     * where landing anywhere else means questions went unanswered.
     */
    async completeWizardIfOnCheckYourAnswers(what: string): Promise<boolean> {
        if (!this.wizard.isOnStep(STEP.CHECK_YOUR_ANSWERS)) {
            return false;
        }

        await this.completeWizard(what);
        return true;
    }
}
