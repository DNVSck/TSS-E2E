import { Page, Locator } from '@playwright/test';
import { checkRadioByValue } from '../core/util/element-helper';
import { BasePage } from './base-page';

/**
 * The standalone consignment declaration wizard (IMMI / SFD / FFD standalone). It
 * models only the screens unique to standalone: "Pre-lodged or arrived" and the
 * representation screen. The task-list entry ("Transport Details") is a separate
 * concern - the flow drives it via a TaskListPage, not this declare page.
 *
 * Everything else the journeys need is the same screen as the ENS wizards and is
 * reused from those page objects by the flow (typeOfMovement / vehicle / arrival on
 * MovementDeclarePage; exporter / trader reference / invoice currency on
 * ConsignmentDeclarePage; the goods item on GoodsDeclarePage), so no locators are
 * duplicated here.
 *
 * One concrete page for all three journeys: at the page level they are identical -
 * their differences are all flow-level (see AddNewStandaloneConsignmentFlow's
 * STANDALONE_STRUCTURE). When a journey grows a screen the others do not have,
 * subclass this then.
 */
export class StandaloneConsignmentDeclarePage extends BasePage {
    // "Pre-lodged or arrived" screen - same field on every standalone journey, only
    // the route (and the H1 wording) differs, so it is located by id.
    private readonly preLodgedOption: Locator;
    private readonly arrivedOption: Locator;

    constructor(page: Page) {
        super(page);
        this.preLodgedOption = page.locator('input#preLodgeOrArrived-preLodgeOrArrivedOptions-pre-lodged');
        this.arrivedOption = page.locator('input#preLodgeOrArrived-preLodgeOrArrivedOptions-arrived');
    }

    async selectPreLodged(): Promise<void> {
        await this.preLodgedOption.check();
        await this.clickContinueButton();
    }

    async selectArrived(): Promise<void> {
        await this.arrivedOption.check();
        await this.clickContinueButton();
    }

    /**
     * "What type of representation are you using?" - shown right after Pre-lodged or
     * arrived when the agent represents a trader. Driven by the radio value (an
     * opaque code, see REPRESENTATION_TYPE), never the "Direct"/"Indirect" label.
     */
    async selectRepresentationType(representationType: string): Promise<void> {
        await checkRadioByValue(this.page, 'representationType', representationType);
        await this.clickContinueButton();
    }
}
