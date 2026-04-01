import { BasePage } from "./base-page";
import { Page, Locator, expect } from '@playwright/test';

export class GoodsMovementTaskListPage extends BasePage {

    transportDetailsBtn: Locator;

    constructor(page: Page) {
        super(page);
        this.transportDetailsBtn = page.locator('button[aria-describedby="transport-details-status"]');
    }


    async clickTransportDetails(): Promise<void> {
        await this.transportDetailsBtn.click();
    }
    
}
