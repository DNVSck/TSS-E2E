import { Page, Locator } from '@playwright/test';
import { clickLinkAndWaitForRoute } from '../../helper/element-helper';
import { RECLASSIFICATION_ROUTE } from '../../constant/endpoints-constant';

const LANDING_TIMEOUT = 60_000;

export class ReclassificationScreen {
    private readonly startLink: Locator;
    private readonly confirmButton: Locator;

    constructor(private readonly page: Page) {
        this.startLink = page.locator(`main a[href$='/${RECLASSIFICATION_ROUTE.CONFIRM_SEGMENT}']`);
        this.confirmButton = page.locator(
            `main form[action$='/${RECLASSIFICATION_ROUTE.CONFIRM_SEGMENT}'] button[type='submit']`
        );
    }

    async isOffered(): Promise<boolean> {
        return (await this.startLink.count()) > 0;
    }

    async open(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.startLink);
    }

    async confirm(destinationSegment: string): Promise<string> {
        await this.confirmButton.click();
        await this.page.waitForURL(`**/${destinationSegment}/*/overview`, { timeout: LANDING_TIMEOUT });

        const segments = new URL(this.page.url()).pathname.split('/');
        return segments[segments.indexOf(destinationSegment) + 1];
    }
}
