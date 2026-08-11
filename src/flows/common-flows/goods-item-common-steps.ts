import { GoodsDeclarePage } from '../../page-object/goods-declare-page';
import { GoodsData } from '../../test-data/goods-data';
import { ReportLog } from '../../core/report/report-log';

/**
 * Steps shared by the standalone goods-item wizards (IMMI/SFD/FFD) and, where
 * noted, the ENS AddNewGoodsItemFlow.
 *
 * Only steps that were byte-for-byte identical across flows live here.
 * Journey-specific branching (SFD's controlled/dangerous fork, IMMI's TGP
 * placement, ENS's decision-tree ordering) stays on each flow, since that
 * branching is the reason each journey owns its own wizard in the first place.
 */
export class GoodsItemCommonSteps {
    constructor(private readonly goodsDeclarePage: GoodsDeclarePage) { }

    /**
     * The standalone packaging screen has no "number of pieces" field, so the
     * three fields it shows are filled individually rather than via the ENS
     * enterPackagingDetails helper (which also fills number of pieces).
     * Identical across the IMMI, SFD and FFD standalone goods-item flows.
     */
    async fillStandalonePackaging(input: Pick<GoodsData, 'shippingMarks' | 'typeOfPackages' | 'numberOfPackages'>): Promise<void> {
        await this.goodsDeclarePage.inputShippingMarks(input.shippingMarks);
        await this.goodsDeclarePage.selectTypeOfPackages(input.typeOfPackages);
        await this.goodsDeclarePage.inputNumberOfPackages(input.numberOfPackages);
        await this.goodsDeclarePage.clickContinueButton();
    }

    /**
     * The "use TGP?" screen only appears for IMMI goods when the signed-in
     * trader has a TGP profile, so it is detected at runtime; when absent
     * there is nothing to answer. A test that asked to use TGP but never saw
     * the screen fails so a green result is not misleading.
     *
     * Shared, including the error message, between the IMMI standalone
     * goods-item flow and the ENS AddNewGoodsItemFlow (IMMI branch) - the two
     * places this string previously lived and could have drifted apart.
     */
    async handleTgpFlow(input: Pick<GoodsData, 'useTGP'>): Promise<void> {
        await ReportLog.step('Answer "Do you want to use TGP?" (IMMI goods only)', async () => {
            const shown = await this.goodsDeclarePage.answerUseTgpIfPresent(input.useTGP);
            if (!shown && input.useTGP) {
                throw new Error(
                    'Requested useTGP=true but the TGP screen never appeared — the signed-in ' +
                    'profile has no TGP set up, so the TGP path was not exercised.'
                );
            }
        });
    }
}
