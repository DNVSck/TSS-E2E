import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { clickLinkAndWaitForRoute } from '../helper/element-helper';
import { ROUTES } from '../constant/endpoints-constant';

export class RequestEoriChangePage extends BasePage {
    private readonly backToCompanyProfileLink: Locator;

    constructor(page: Page) {
        super(page);

        this.backToCompanyProfileLink = page.locator(
            `main a[href$='${ROUTES.PORTAL.COMPANY_PROFILE}']`
        );
    }

    async waitForScreen(): Promise<void> {
        await this.backToCompanyProfileLink.waitFor({ state: 'visible' });
    }

    async returnToCompanyProfile(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.backToCompanyProfileLink);
    }
}
