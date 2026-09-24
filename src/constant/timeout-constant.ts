/**
 * The waits more than one screen needs, because they describe a behaviour of the
 * SERVICE rather than of a page.
 *
 * Four page objects had declared their own SUMMARY_READ_TIMEOUT and two their own
 * DETAIL_READ_TIMEOUT, at the same values, for the same reason. Six copies of one
 * number is six places to change when the service gets slower, and a run where five
 * of them were changed reads as a flaky screen rather than a stale constant.
 *
 * A wait that belongs to ONE screen stays in that screen - the tariff autocomplete,
 * the portal render, a linked consignment the backend generates late. Those are facts
 * about a particular page, and pulling them here would suggest they move together.
 */
export const RENDER_TIMEOUT = {
    /** A summary list paints a beat after the page that carries it has loaded. */
    SUMMARY_LIST: 20_000,
    /** A record's own detail fields arrive with the record, not with the route. */
    RECORD_DETAIL: 15_000,
    /** A tab panel paints a beat after the tab's route settles. */
    TAB_PANEL: 30_000,
} as const;
