import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';

export class GmrDeclarePage extends BasePage {
    routeIdDropdown: Locator;

    constructor(page: Page) {
        super(page);
        this.routeIdDropdown = page.locator("select#routeId");
    }

    async selectRouteId(routeId: string): Promise<void> {
        await this.routeIdDropdown.selectOption({ value: routeId });
        await this.commonContinueButton.click();
    }

    
}