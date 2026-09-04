import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * The "Traders that you can represent" list (/company-profile/traders), reached
 * from the business profile - see CompanyProfilePage.openTradersList. Its only job
 * is to pick a trader row and start representing that company; the strip that says
 * who is being represented is a cross-page concern and lives in RepresentationBanner,
 * not here.
 */
export class RepresentTraderPage extends BasePage {
    /** A trader row is any row that carries a "start representing" form. */
    private readonly traderRows: Locator;

    constructor(page: Page) {
        super(page);
        this.traderRows = page.locator("tr:has(form[action$='start-representing'])");
    }

    /** Click "Start representing" on the row for the given company. */
    async startRepresenting(companyName: string): Promise<void> {
        // A blank name would make the row filter match every trader (an empty
        // substring is in all of them), surfacing as a confusing strict-mode
        // violation. Fail early with the real cause: the *_COMPANY_NAME var is
        // usually just missing from the .env of the environment under test.
        if (!companyName.trim()) {
            throw new Error(
                'startRepresenting was given an empty company name. Set the ' +
                'matching *_COMPANY_NAME (e.g. HAULIER_COMPANY_NAME) in ' +
                `.env.${process.env.ENV ?? '<env>'}.`
            );
        }

        await this.traderRows
            .filter({ hasText: companyName })
            .locator("button[name='action']")
            .click();
    }
}
