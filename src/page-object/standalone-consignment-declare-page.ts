import { Page, Locator } from '@playwright/test';
import { checkRadioByValue } from '../helper/element-helper';
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
    private readonly representationTypeRadios: Locator;
    private readonly goodsDomesticStatusRadios: Locator;
    private readonly transportingInContainersRadios: Locator;

    constructor(page: Page) {
        super(page);
        this.preLodgedOption = page.locator('input#preLodgeOrArrived-preLodgeOrArrivedOptions-pre-lodged');
        this.arrivedOption = page.locator('input#preLodgeOrArrived-preLodgeOrArrivedOptions-arrived');
        this.representationTypeRadios = page.locator('input[name="representationType"]');
        this.goodsDomesticStatusRadios = page.locator('input[name="goodsDomesticStatus"]');
        this.transportingInContainersRadios = page.locator('input[name="isTransportingInContainers"]');
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
        await checkRadioByValue(this.representationTypeRadios, representationType);
        await this.clickContinueButton();
    }

    /**
     * `sfd-standalone-journey~goods-domestic-status` - the radios on their own.
     *
     * The SAME question the ENS and EIDR journeys ask as one field of their
     * "Transport and destination details" screen, which is why it shares that
     * screen's radio name and its D/I codes. On the SFD standalone journey the app
     * gives it a screen of its own, so it needs a method of its own - see
     * ConsignmentDeclarePage.fillSfdTransportAndDestinationDetails for the combined
     * screen the EIDR standalone journey still shows.
     */
    async selectGoodsDomesticStatus(goodsDomesticStatusCode: string): Promise<void> {
        await checkRadioByValue(this.goodsDomesticStatusRadios, goodsDomesticStatusCode);
        await this.clickContinueButton();
    }

    /**
     * `container-information~container-is-transported` - "Are the goods transported in
     * containers when crossing the EU's external borders?"
     *
     * NOT the ENS container question. ENS asks whether the goods cross the EU border
     * and then whether they all share a container (`isTheSameContainer`); the
     * standalone journeys fold both into this one field, so it keeps its own locator.
     */
    async selectTransportingInContainers(isTransportingInContainers: boolean): Promise<void> {
        await checkRadioByValue(
            this.transportingInContainersRadios, isTransportingInContainers ? 'yes' : 'no'
        );
        await this.clickContinueButton();
    }
}
