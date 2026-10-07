import { Page, Locator } from '@playwright/test';
import { textsOf } from '../../helper/element-helper';
import { GOVUK } from './govuk-selectors';
import { CANCELLATION_ROUTE } from '../../constant/endpoints-constant';

export class CancellationScreen {
    private readonly reason: Locator;
    private readonly confirmButton: Locator;
    private readonly reasonError: Locator;

    constructor(private readonly page: Page) {
        this.reason = page.locator('#cancelReason');
        this.confirmButton = page.locator("form:has(#cancelReason) button[type='submit']");
        this.reasonError = page.locator(`main ${GOVUK.ERROR_MESSAGE}`);
    }

    async waitForReason(timeout: number): Promise<void> {
        await this.reason.waitFor({ state: 'visible', timeout });
    }

    async confirm(reason: string, timeout: number): Promise<string[]> {
        await this.reason.fill(reason);
        await this.confirmButton.click();

        const confirmed = await Promise.race([
            this.page
                .waitForURL(url => url.pathname.endsWith(`/${CANCELLATION_ROUTE.CONFIRMATION_SEGMENT}`), { timeout })
                .then(() => true, () => false),
            this.reasonError.first()
                .waitFor({ state: 'visible', timeout })
                .then(() => false, () => false),
        ]);

        return confirmed ? [] : textsOf(this.reasonError);
    }
}
