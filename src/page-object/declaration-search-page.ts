import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { clickLinkAndWaitForRoute } from '../helper/element-helper';

/** The results page re-renders after a search; the form repaints with it. */
const SEARCH_TIMEOUT = 20_000;

/**
 * "Overview of declarations" - the screen reached from "View your draft
 * declarations", where a signed-in account searches every declaration it may see.
 *
 * This is the second, independent way of asking a permission question. Opening a
 * record's URL says whether the service will serve it; searching says whether the
 * account is shown that it exists at all. A record blocked by URL but still listed
 * here would be a real leak, and only this screen can catch it.
 */
export class DeclarationSearchPage extends BasePage {
    private readonly searchInput: Locator;
    private readonly updateResultsButton: Locator;
    private readonly resultLinks: Locator;

    constructor(page: Page) {
        super(page);

        this.searchInput = page.locator('input#searchQuery');
        this.updateResultsButton = page.locator("main button[value='update']");
        // Each result card links to a declaration's own overview. Matched by route
        // shape rather than the "View declaration" label, which is translated.
        this.resultLinks = page.locator("main a[href*='/goods-movement/'][href$='/overview']");
    }

    /**
     * Search for one declaration reference and return the routes of the results that
     * carry it.
     *
     * Returns routes rather than a count so a caller can assert on WHICH declaration
     * came back - and so an empty result is a list, not a zero that could equally
     * mean the page never rendered.
     */
    async findDeclarationsByReference(reference: string): Promise<string[]> {
        await this.searchInput.waitFor({ state: 'visible', timeout: SEARCH_TIMEOUT });
        await this.searchInput.fill(reference);
        await this.updateResultsButton.click();

        // The positive anchor. Submitting reloads the page and the form comes back
        // populated with the query, so seeing the term in the box is proof the RESULTS
        // rendered - not the pre-search page still on screen. Without it, "no results"
        // and "not reloaded yet" are the same observation, and the check that matters
        // most here is an absence.
        await expect(this.searchInput).toHaveValue(reference, { timeout: SEARCH_TIMEOUT });

        const hrefs = await this.resultLinks.evaluateAll(links =>
            links.map(link => link.getAttribute('href') ?? '')
        );
        return hrefs.filter(href => href.includes(reference));
    }

    /**
     * Open the searched-for declaration from its result card.
     *
     * The way back into a declaration once a test has navigated away to search for
     * it - and the user's own route, which is the point: being able to open it from
     * the list is part of what having access to it means.
     */
    async openDeclaration(reference: string): Promise<void> {
        await clickLinkAndWaitForRoute(
            this.page,
            this.page.locator(`main a[href*='${reference}'][href$='/overview']`)
        );
    }
}
