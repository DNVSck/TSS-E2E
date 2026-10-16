import { expect, Page, Locator } from '@playwright/test';
import { clickLinkAndWaitForRoute } from '../../helper/element-helper';
import { ROUTES } from '../../constant/endpoints-constant';
import { GOVUK } from './govuk-selectors';

/**
 * The Beta banner under the header, whose "feedback" link opens the per-page feedback
 * form. Keyed on the link's href, never its text - the text is translated.
 *
 * The link's `fromUrl` query names the page it was clicked on, which is how the service
 * knows where to send the user back to once the feedback is saved.
 */
export class PhaseBanner {
    private readonly feedbackLink: Locator;

    constructor(private readonly page: Page) {
        this.feedbackLink = page
            .locator(`${GOVUK.PHASE_BANNER.ROOT} a[href*='${ROUTES.PORTAL.FEEDBACK_PER_PAGE_START}']`)
            .first();
    }

    /** The decoded page path the link will return the user to, e.g. "/declaration/form/gb-ni-process". */
    async readFromUrl(): Promise<string> {
        await this.feedbackLink.waitFor({ state: 'visible' });

        // The banner is part of the layout, so after a client-side navigation its link still
        // names the previous page (the portal home's "/") until the new screen has rendered.
        // Wait for it to agree with where the browser is, or the caller records a stale page.
        await expect.poll(async () => {
            const fromUrl = await this.readLinkFromUrl();
            return fromUrl !== '' && new URL(this.page.url()).pathname.endsWith(fromUrl);
        }, { message: 'The feedback link should name the page it is on' }).toBe(true);

        return this.readLinkFromUrl();
    }

    private async readLinkFromUrl(): Promise<string> {
        const href = await this.feedbackLink.getAttribute('href');
        return new URL(href ?? '', this.page.url()).searchParams.get('fromUrl') ?? '';
    }

    async openFeedback(): Promise<void> {
        await clickLinkAndWaitForRoute(this.page, this.feedbackLink);
    }
}
