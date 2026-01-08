import { BasePage } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';


export class TransportDetailsPage extends BasePage {

    // Declare properties - Using stable locators (NOT text-based)
    typeOfMovement: Locator;
    imoNumberInput: Locator;
    vehicleRegistrationNumberInput: Locator;
    nationalityOfMeanOfTransportInput: Locator;

    constructor(page: Page) {
        super(page);
        this.typeOfMovement = page.locator("select#typeOfMovement");
        this.imoNumberInput = page.locator("input#imoNumber");
        this.vehicleRegistrationNumberInput = page.locator("input#vehicleRegistrationNumber");
        this.nationalityOfMeanOfTransportInput = page.locator("select#nationalityOfMeanOfTransport");
    }

    async selectTypeOfMovement(movementType: string): Promise<void> {
        await this.typeOfMovement.selectOption({ label: movementType });
    }
}