import { Page, Locator } from '@playwright/test';
import { clickLinkAndWaitForRoute } from '../../helper/element-helper';
import { DUTY_CALCULATION_ROUTE } from '../../constant/endpoints-constant';

const LANDING_TIMEOUT = 60_000;

export class DutyCalculationScreen {
    private readonly viewLink: Locator;
    private readonly confirmButton: Locator;

    constructor(private readonly page: Page) {
        this.viewLink = page.locator(`main a[href$='/${DUTY_CALCULATION_ROUTE.CONFIRM_SEGMENT}']`);
        this.confirmButton = page.locator(
            `main form[action*='/${DUTY_CALCULATION_ROUTE.CONFIRM_SEGMENT}'] button[type='submit']`
        );
    }

    async open(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.viewLink);
    }

    async confirm(): Promise<void> {
        await this.confirmButton.click();
        await this.page.waitForURL(
            url => !url.pathname.endsWith(`/${DUTY_CALCULATION_ROUTE.CONFIRM_SEGMENT}`),
            { timeout: LANDING_TIMEOUT }
        );
    }

}
