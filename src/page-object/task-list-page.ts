import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';


export class TaskListPage extends BasePage {
    private readonly transportDetailsLink: Locator;

    constructor(page: Page) {
        super(page);
        this.transportDetailsLink = page.locator('a[aria-describedby="transport-details-status"]');
    }

    async clickTransportDetails(): Promise<void> {
        await this.transportDetailsLink.click();
    }
}
