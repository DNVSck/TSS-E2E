import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { selectDropdownValue, checkRadioByValue, fillInputValue } from '../helper/element-helper';
import { BOOLEAN } from '../constant/radio-value-constant';

/**
 * The screens that exist ONLY on the FFD standalone journey (the app's "Standard
 * Declaration"), discovered by walking the wizard on ENV=test.
 *
 * It models nothing else, on purpose. FFD also shows screens the other journeys have,
 * and those keep coming from the page object that owns them:
 *
 *   - pre-lodged / arrived, representation,
 *     goods domestic status, containers     -> StandaloneConsignmentDeclarePage
 *   - method of transport, vehicle details,
 *     arrival date/time, port of arrival    -> MovementDeclarePage
 *   - buyer, transport and destination,
 *     trader reference, invoice currency    -> ConsignmentDeclarePage
 *   - delivery terms, delivery country and
 *     place, method of payment              -> CommercialTermsDeclarePage
 *
 * So do NOT copy a locator here that already exists in one of those.
 *
 * That last line moved out on 2026-08-20: the supplementary declaration shows those
 * four screens too, so they were never FFD-only and this file was the wrong owner.
 */
export class FfdStandaloneConsignmentDeclarePage extends BasePage {
    private readonly natureOfGoodsDropdown: Locator;
    private readonly declarationProcedureRadios: Locator;
    private readonly sameNatureOfGoodsRadios: Locator;
    private readonly inlandModeOfTransportRadios: Locator;
    private readonly warehouseTypeDropdown: Locator;
    private readonly warehouseIdentifierInput: Locator;
    private readonly supervisingCustomsOfficeDropdown: Locator;
    private readonly usePostponedVatRadios: Locator;

    constructor(page: Page) {
        super(page);

        this.natureOfGoodsDropdown = page.locator('select#natureOfGoods');
        this.declarationProcedureRadios = page.locator('input[name="declarationProcedure"]');
        this.sameNatureOfGoodsRadios = page.locator('input[name="isSameNatureOfGoods"]');
        this.inlandModeOfTransportRadios = page.locator('input[name="inlandModeOfTransport"]');
        this.warehouseTypeDropdown = page.locator('select#warehouseType');
        this.warehouseIdentifierInput = page.locator('input#warehouseIdentifier');
        this.supervisingCustomsOfficeDropdown = page.locator('select#supervisingCustomsOffice');
        this.usePostponedVatRadios = page.locator("input[name='postponedVat']");
    }

    async fillWarehouseIdentifier(warehouseType: string, warehouseIdentifier: string): Promise<void> {
        await selectDropdownValue(this.warehouseTypeDropdown, warehouseType);
        await fillInputValue(this.warehouseIdentifierInput, warehouseIdentifier);
        await this.clickContinueButton();
    }

    async continueFromWarehouseIdentifier(): Promise<void> {
        await this.clickContinueButton();
    }

    async continueFromInlandModeOfTransport(): Promise<void> {
        await this.clickContinueButton();
    }

    async selectSupervisingCustomsOffice(supervisingCustomsOffice: string): Promise<void> {
        await selectDropdownValue(this.supervisingCustomsOfficeDropdown, supervisingCustomsOffice);
        await this.clickContinueButton();
    }

    async selectInlandModeOfTransport(inlandModeOfTransport: string): Promise<void> {
        await checkRadioByValue(this.inlandModeOfTransportRadios, inlandModeOfTransport);
        await this.clickContinueButton();
    }

    /**
     * "Which type of declaration do you intend to make?" — the answer picks the tail
     * of the wizard (the app's "h1-journey" for release to free circulation).
     */
    async selectDeclarationProcedure(declarationProcedure: string): Promise<void> {
        await checkRadioByValue(this.declarationProcedureRadios, declarationProcedure);
        await this.clickContinueButton();
    }


    /**
     * "Nature of goods", screen one — is every goods item of the same nature?
     * Answering yes leads to the second screen, which asks what that nature is.
     */
    async selectSameNatureOfGoods(isSameNatureOfGoods: boolean): Promise<void> {
        await checkRadioByValue(
            this.sameNatureOfGoodsRadios, isSameNatureOfGoods ? BOOLEAN.YES : BOOLEAN.NO
        );
        await this.clickContinueButton();
    }

    /** "Nature of goods", screen two — what the nature of the goods actually is. */
    async selectNatureOfGoods(natureOfGoods: string): Promise<void> {
        await selectDropdownValue(this.natureOfGoodsDropdown, natureOfGoods);
        await this.clickContinueButton();
    }

    async answerPostponedVat(usePostponedVat: boolean): Promise<void> {
        await checkRadioByValue(this.usePostponedVatRadios, usePostponedVat ? BOOLEAN.YES : BOOLEAN.NO);
        await this.clickContinueButton();
    }

}
