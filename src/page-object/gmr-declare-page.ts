import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { readSelectedOptionLabel, selectDropdownValue } from '../helper/element-helper';

export class GmrDeclarePage extends BasePage {
    private readonly routeIdDropdown: Locator;

    constructor(page: Page) {
        super(page);
        this.routeIdDropdown = page.locator("select#routeId");
    }

    async selectRouteId(routeId: string): Promise<string> {
        await selectDropdownValue(this.routeIdDropdown, routeId);
        const routeLabel = await readSelectedOptionLabel(this.routeIdDropdown);
        await this.clickContinueButton();

        return routeLabel;
    }

    
}