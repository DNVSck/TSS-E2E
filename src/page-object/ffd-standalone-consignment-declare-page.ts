import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { selectDropdownValue, checkRadioByValue } from '../helper/element-helper';

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
    private readonly inlandModeOfTransportDropdown: Locator;
    private readonly warehouseTypeDropdown: Locator;
    private readonly warehouseIdentifierInput: Locator;
    private readonly natureOfGoodsDropdown: Locator;

    constructor(page: Page) {
        super(page);

        this.inlandModeOfTransportDropdown = page.locator('select#inlandModeOfTransport');
        this.warehouseTypeDropdown = page.locator('select#warehouseType');
        this.warehouseIdentifierInput = page.locator('input#warehouseIdentifier');
        this.natureOfGoodsDropdown = page.locator('select#natureOfGoods');
    }

    /** "What is the inland mode of transport?" */
    async selectInlandModeOfTransport(inlandMode: string): Promise<void> {
        await selectDropdownValue(this.inlandModeOfTransportDropdown, inlandMode);
        await this.clickContinueButton();
    }

    /**
     * "Which type of declaration do you intend to make?" — the answer shapes the rest
     * of the wizard: customs warehousing adds the two warehouse screens below.
     */
    async selectDeclarationProcedure(declarationProcedure: string): Promise<void> {
        await checkRadioByValue(this.page, 'declarationProcedure', declarationProcedure);
        await this.clickContinueButton();
    }

    /** "What type of warehouse is used for the goods?" — customs warehousing only. */
    async selectWarehouseType(warehouseType: string): Promise<void> {
        await selectDropdownValue(this.warehouseTypeDropdown, warehouseType);
        await this.clickContinueButton();
    }

    /** "Warehouse identifier" — customs warehousing only. */
    async inputWarehouseIdentifier(warehouseIdentifier: string): Promise<void> {
        await this.warehouseIdentifierInput.fill(warehouseIdentifier);
        await this.clickContinueButton();
    }


    /**
     * "Nature of goods", screen one — is every goods item of the same nature?
     * Answering yes leads to the second screen, which asks what that nature is.
     */
    async selectSameNatureOfGoods(isSameNatureOfGoods: boolean): Promise<void> {
        await checkRadioByValue(
            this.page, 'isSameNatureOfGoods', isSameNatureOfGoods ? 'yes' : 'no'
        );
        await this.clickContinueButton();
    }

    /** "Nature of goods", screen two — what the nature of the goods actually is. */
    async selectNatureOfGoods(natureOfGoods: string): Promise<void> {
        await selectDropdownValue(this.natureOfGoodsDropdown, natureOfGoods);
        await this.clickContinueButton();
    }

}
