import { ReportLog } from '../../core/report/report-log';
import { GoodsData } from '../../test-data/goods-data';
import { GoodsItemSteps } from './goods-item-steps';
import { hidesSupplementaryUnit } from '../../helper/procedure-code-helper';
import { DeclareNirmsFlow, NirmsJourney } from './declare-nirms-flow';
import { AccessibilityCheckpoint } from '../accessibility-audit-flow';
import {
    TraderGoodsProfileService, describeTgpGap,
} from '../../api-service/portal-api/trader-goods-profile-service';
import { COMPANY_PROFILE, UserCredentials } from '../../auth/credentials';
import { ENV } from '../../../config/environment';

const ADDITIONAL_PROCEDURE_CODE_FIELD = 'additionalProcedureCode';

const USE_TGP_FIELD = 'useTgp';

const USE_NIRMS_FIELD = 'useNirms';

/**
 * One goods item on the IMMI standalone journey.
 *
 * IMMI is the standalone journey that asks about TGP at goods level, and answering
 * yes puts the app on its own route: the record supplies the commodity code, the
 * goods description and the country of origin, so both of those screens are skipped.
 *
 * It also changes an item already declared - the one an IMMI converted from a
 * supplementary declaration inherits - through the same screens.
 */
export class AddNewImmiStandaloneGoodsItemFlow {
    constructor(
        private readonly steps: GoodsItemSteps,
        private readonly declareNirmsFlow: DeclareNirmsFlow,
        private readonly traderGoodsProfileService: TraderGoodsProfileService,
        private readonly authAccount: UserCredentials | null,
    ) { }

    /**
     * Returns whether the item was declared from a TGP record — the caller needs it
     * to know whether the overview should carry TGP-populated values.
     */
    async addNewImmiStandaloneGoodsItem(
        input: GoodsData,
        declaringForEori: string,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<boolean> {
        return ReportLog.step('Add new IMMI standalone goods item', async () => {
            await this.steps.openNewGoodsRecord();

            const usesTgp = await this.declareTgp(input, declaringForEori, checkpoint);

            await checkpoint?.('Goods item - procedure code', { probeErrors: true });
            await this.steps.selectGoodsProcedureCode(input);
            await checkpoint?.('Goods item - additional procedure code', { probeErrors: true });
            await this.steps.selectImmiAdditionalProcedureCode(input);

            // No supervising office step, unlike the standard and simplified wizards
            // beside this one: IMMI is not a route that asks for it, and the service
            // supplies the office itself. What it chose is checked on the consignment
            // overview - see CreateDraftImmiStandaloneFlow.
            await this.steps.enterWarehouseIdentifierIfAsked(input, checkpoint);

            if (!usesTgp) {
                // Unlike the ENS journeys, standalone IMMI always collects supplementary
                // units, so only the goods item's own additional procedure code can take
                // the field away - see hidesSupplementaryUnit for which codes do, and why
                // the code decides rather than a flag in the test data.
                const showsSupplementaryUnits =
                    !hidesSupplementaryUnit(input.additionalProcedureCode);

                if (showsSupplementaryUnits) {
                    await this.steps.enterCommodityInformation(input);
                } else {
                    await this.steps.enterCommodityInformationWithoutSupplementaryUnits(input);
                }
            }

            if (!usesTgp) {
                await this.declareNirmsFlow.answerNirms(input, this.nirmsJourney(declaringForEori), checkpoint);
            }

            await checkpoint?.('Goods item - packaging', { probeErrors: true });
            await this.steps.enterImmiStandalonePackagingDetails(input);

            if (usesTgp) {
                await this.declareNirmsFlow.answerNirms(input, this.nirmsJourney(declaringForEori), checkpoint);
            }

            await this.steps.enterWeightInformation(input);
            await this.steps.enterItemPrice(input);

            if (!usesTgp) {
                await checkpoint?.('Goods item - country of origin', { probeErrors: true });
                await this.steps.enterCountryOfOrigin(input);
            }

            await this.steps.finishGoodsItemDeclaration();
            return usesTgp;
        });
    }

    async changeGoodsItem(
        input: GoodsData,
        declaringForEori: string,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<boolean> {
        return ReportLog.step('Change the IMMI goods item', async () => {
            await this.steps.changeAnswer(ADDITIONAL_PROCEDURE_CODE_FIELD);
            await checkpoint?.('Goods item - change additional procedure code', { probeErrors: true });
            await this.steps.selectImmiAdditionalProcedureCode(input);
            await checkpoint?.('Goods item - check your answers (changed)');

            const usesTgp = input.useTGP && await this.redeclareFromTgp(input, declaringForEori, checkpoint);

            if (input.useNirms) {
                await this.steps.changeAnswer(USE_NIRMS_FIELD);
                await this.declareNirmsFlow.answerNirms(input, this.nirmsJourney(declaringForEori), checkpoint);
            }

            await this.steps.finishGoodsItemDeclaration();
            return usesTgp;
        });
    }

    private async redeclareFromTgp(
        input: GoodsData,
        declaringForEori: string,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<boolean> {
        await this.steps.changeAnswer(USE_TGP_FIELD);
        const usesTgp = await this.declareTgp(input, declaringForEori, checkpoint);

        await this.steps.selectGoodsProcedureCode(input);
        await this.steps.selectImmiAdditionalProcedureCode(input);
        await this.steps.keepAnswersUntilCheckYourAnswers();
        return usesTgp;
    }

    private nirmsJourney(importerEORI: string): NirmsJourney {
        return { isEnsOnly: false, useIMMI: true, importerEORI };
    }

    /**
     * "Do you want to use a Trader Goods Profile?" - put only where the IMPORTER's
     * goods profile is open to whoever is declaring against it.
     *
     * The importer's, never the signed-in company's: a standalone declaration names no
     * importer on any screen because the agent journeys represent it before they start
     * and the importer journeys ARE it. How much of the profile has to be open still
     * follows the declarer - an agent reaches it as a third party and needs both
     * permissions, the importer needs only its own TSS access.
     */
    private async declareTgp(
        input: GoodsData,
        declaringForEori: string,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<boolean> {
        const permission = await this.traderGoodsProfileService
            .readTgpPermission(declaringForEori);

        const declaringAsAgent = this.authAccount?.profile === COMPANY_PROFILE.AGENT;
        const expected = declaringAsAgent
            ? permission.allowsTssAccess && permission.allowsThirdPartyAccess
            : permission.allowsTssAccess;

        if (input.useTGP && !expected) {
            throw new Error(
                `Test data sets "useTGP" but the TGP question is never put for ${declaringForEori} `
                + `on "${ENV}": ${describeTgpGap(permission, declaringAsAgent)}. The TGP path `
                + `cannot be exercised against that importer.`
            );
        }

        const { asked, usesTgp } = await this.steps.declareTgp(input, checkpoint);

        ReportLog.setParameter('TGP question', asked ? 'asked' : 'not asked');

        if (asked !== expected) {
            const asThirdParty = declaringAsAgent ? ' to a third party' : '';

            throw new Error(
                expected
                    ? `The TGP question was never put, but ${declaringForEori} grants every `
                    + `permission it needs${asThirdParty}, so the `
                    + `service should have asked. Nothing in the test data explains this - the `
                    + `screen that was owed was not offered.`
                    : `The TGP question was put, but ${describeTgpGap(permission, declaringAsAgent)}. `
                    + `The permissions and the screen disagree.`
            );
        }

        return usesTgp;
    }
}
