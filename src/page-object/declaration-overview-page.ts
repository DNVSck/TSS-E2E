import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { clickLinkAndWaitForRoute } from '../helper/element-helper';

/** The list paints its results a beat after the route settles. */
const RESULTS_TIMEOUT = 20_000;

/**
 * How long a supplementary declaration gets to appear against its frontier
 * declaration.
 *
 * The service creates it once the frontier declaration is cleared, and creating it is
 * the last thing in that chain rather than part of the response to it - so a search
 * run the instant the consignment reads "Arrived" can legitimately find nothing yet.
 * Polled by re-running the search, not by waiting on a page that will never change
 * itself.
 */
const SUPPLEMENTARY_APPEARS_TIMEOUT = 120_000;

/** The reference is the third path segment: /supplementary-declaration/<LRN>/overview */
function supplementaryReferenceFrom(href: string): string {
    return href.split('/').filter(Boolean)[2] ?? '';
}

/**
 * "Overview of declarations" - the portal's single list screen, shared by every
 * declaration type and reached either from "View your draft declarations" or, already
 * filtered, from "Complete your supplementary declarations".
 *
 * Only the search is modelled, because only the search can find one declaration among
 * hundreds: the SIT importer account carries ~400 SD drafts, sorted newest first, and
 * the suite itself adds to the top of that list on every run. Taking "the first row"
 * would have four parallel workers competing for the same record.
 */
export class DeclarationOverviewPage extends BasePage {
    private readonly supplementaryDeclarationLinks: Locator;

    constructor(page: Page) {
        super(page);

        this.supplementaryDeclarationLinks = page.locator("main a[href*='/supplementary-declaration/']");
    }

    /**
     * Filter the list down to one reference.
     *
     * Done through the query parameter rather than the search box, and that is not a
     * shortcut past the UI - "searchQuery" is the screen's own interface. The portal's
     * landing page links straight to this list with the same parameter spelled out
     * ("...&searchQuery=&declarationType=&statuses=..."), so this asks the screen for
     * exactly what its own navigation asks it for.
     *
     * The box itself was tried first and does not apply the filter under automation.
     * Measured three ways on SIT, 2026-08-20, searching one reference against a list of
     * 3,269 declarations:
     *
     *   fill + "Update results" (filters open)    3269 results, URL unchanged
     *   fill + Enter                              3269 results, URL unchanged
     *   ?searchQuery=<reference>                     2 results
     *
     * Whatever the cause, a search that silently returns everything is worse than no
     * search: the list still holds supplementary declarations, so the first one looks
     * like an answer. That is exactly how a search for DEC178723644504407 came back
     * with the declaration belonging to DEC178724276804414.
     *
     * Any filter already in the URL is preserved - only the query is set - so this
     * composes with however the caller reached the list.
     */
    async searchByReference(reference: string): Promise<void> {
        const listUrl = new URL(this.page.url());
        listUrl.searchParams.set('searchQuery', reference);
        await this.page.goto(listUrl.toString(), { waitUntil: 'domcontentloaded' });
    }

    /**
     * Find and open the supplementary declaration raised against a frontier
     * declaration, and return its own reference.
     *
     * Searching the FRONTIER reference returns two rows - that declaration and its SD -
     * of which only one is a supplementary declaration, so the TYPE of the link is what
     * identifies it rather than its position. The SD carries the frontier reference on
     * its "Simplified Declaration Reference" row, which is what makes it findable this
     * way; see SupplementaryDeclarationOverviewPage.getSimplifiedDeclarationReference,
     * which the flow uses to prove the pair really is a pair.
     *
     * The wait below checks that the list really is the answer to this query: the
     * frontier declaration has a row of its own among the results, and waiting for it
     * is cheap. It is kept even though searchByReference now navigates - a filtered
     * list is a claim worth testing before the first answer is typed into whatever it
     * returns.
     */
    async openSupplementaryDeclarationFor(lrn: string): Promise<string> {
        let href = '';

        await expect(async () => {
            await this.searchByReference(lrn);

            await this.page
                .locator(`main a[href*="${lrn}"]`)
                .first()
                .waitFor({ state: 'visible', timeout: RESULTS_TIMEOUT });

            href = await this.supplementaryDeclarationLinks.first().getAttribute('href') ?? '';
            expect(href, `a supplementary declaration for ${lrn}`).not.toBe('');
        }).toPass({ timeout: SUPPLEMENTARY_APPEARS_TIMEOUT, intervals: [3_000, 5_000, 10_000] });

        await clickLinkAndWaitForRoute(this.page, this.supplementaryDeclarationLinks.first());
        return supplementaryReferenceFrom(href);
    }
}
