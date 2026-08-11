import { StandaloneConsignmentDeclarePage } from '../../page-object/standalone-consignment-declare-page';
import { ReportLog } from '../../core/report/report-log';

/**
 * The screens that exist only on the standalone journeys. Everything else those
 * wizards show is a screen the ENS journeys also have, so it comes from MovementSteps
 * or ConsignmentSteps — which is exactly why a standalone flow draws from all three.
 *
 * NOT a page object — see StandaloneConsignmentDeclarePage for the locators.
 */
export class StandaloneConsignmentSteps {
    constructor(private readonly standalonePage: StandaloneConsignmentDeclarePage) { }

    /**
     * "Is this a pre-lodged or arrived movement?" opens the wizard. The step name
     * carries the answer, since on SFD and FFD it also decides whether the arrival
     * screen asks for a date/time further down.
     */
    async declarePreLodgedOrArrived(isPreLodged: boolean): Promise<void> {
        const answer = isPreLodged ? 'Pre-lodged' : 'Arrived';
        await ReportLog.step(`Declare movement as ${answer}`, async () => {
            if (isPreLodged) {
                await this.standalonePage.selectPreLodged();
            } else {
                await this.standalonePage.selectArrived();
            }
        });
    }

    /**
     * "Representation information" follows pre-lodge. Asked only when the agent
     * represents a trader — an importer signing in as their own company skips the
     * screen, which the data says by leaving representationType undefined.
     */
    async selectRepresentationType(representationType: string): Promise<void> {
        await ReportLog.step('Select representation type', async () => {
            await this.standalonePage.selectRepresentationType(representationType);
        });
    }

    /**
     * "Enter goods domestic status" as a screen of its own. Only the SFD standalone
     * journey shows it that way; every other journey asks the same question as one
     * field of "Transport and destination details" (ConsignmentSteps
     * .fillSfdTransportAndDestination), which is why both spellings exist.
     */
    async selectGoodsDomesticStatus(goodsDomesticStatus: string): Promise<void> {
        await ReportLog.step('Select goods domestic status', async () => {
            await this.standalonePage.selectGoodsDomesticStatus(goodsDomesticStatus);
        });
    }

    /**
     * "Container information". Shared by the FFD and SFD standalone journeys, which is
     * why it sits here rather than beside the FFD-only screens where it started.
     */
    async declareTransportingInContainers(isTransportingInContainers: boolean): Promise<void> {
        await ReportLog.step('Answer "Are the goods transported in containers?"', async () => {
            await this.standalonePage.selectTransportingInContainers(isTransportingInContainers);
        });
    }

    async finishStandaloneConsignment(): Promise<void> {
        await ReportLog.step('Finish standalone consignment declaration', async () => {
            await this.standalonePage.clickFinishButton();
        });
    }
}
