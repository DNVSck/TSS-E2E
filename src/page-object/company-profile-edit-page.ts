import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { fillInputValue, readErrorSummary, selectDropdownValue } from '../helper/element-helper';
import { ROUTES } from '../constant/endpoints-constant';

const SUBMIT_ATTEMPTS = 3;
const SUBMIT_ATTEMPT_TIMEOUT = 20_000;

export class CompanyProfileEditPage extends BasePage {

    private formField(id: string): Locator {
        return this.page.locator(`main #${id}`);
    }

    async enterValue(id: string, value: string): Promise<void> {
        const field = this.formField(id);
        const tag = await field.evaluate(element => element.tagName);

        if (tag === 'SELECT') {
            await selectDropdownValue(field, value);
            return;
        }

        await fillInputValue(field, value);
    }

    async readSelectedOption(id: string): Promise<string> {
        return (await this.formField(id).locator('option:checked').innerText()).trim();
    }

    async continueToCheckAnswers(): Promise<void> {
        await this.submitUntilRoute(this.commonContinueButton, ROUTES.PORTAL.COMPANY_INFORMATION_CHECK_ANSWERS);
    }

    async saveAnswers(): Promise<void> {
        await this.submitUntilRoute(this.commonFinishButton, ROUTES.PORTAL.COMPANY_PROFILE);
    }

    private async submitUntilRoute(button: Locator, route: string): Promise<void> {
        const from = this.currentPath();

        for (let attempt = 1; attempt <= SUBMIT_ATTEMPTS; attempt++) {
            if (await button.isVisible() && await button.isEnabled()) {
                await button.click({ timeout: SUBMIT_ATTEMPT_TIMEOUT }).catch(() => undefined);
            }

            if (await this.reachesRoute(route)) {
                return;
            }

            if (this.currentPath() !== from || (await readErrorSummary(this.page)).length > 0) {
                break;
            }
        }

        throw new Error(
            `The company profile edit did not move from "${from}" to "${route}"; it is on `
            + `"${this.currentPath()}". Errors on the page: `
            + `${(await readErrorSummary(this.page)).join('; ') || 'none'}.`
        );
    }

    private async reachesRoute(route: string): Promise<boolean> {
        return this.page.waitForURL(
            url => url.pathname.endsWith(route),
            { waitUntil: 'domcontentloaded', timeout: SUBMIT_ATTEMPT_TIMEOUT }
        ).then(() => true, () => false);
    }

    private currentPath(): string {
        return new URL(this.page.url()).pathname;
    }
}
