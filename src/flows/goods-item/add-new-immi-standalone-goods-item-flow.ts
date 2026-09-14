import { ReportLog } from '../../core/report/report-log';
import { GoodsData } from '../../test-data/goods-data';
import { GoodsItemSteps } from './goods-item-steps';
import { hidesSupplementaryUnit } from '../../helper/procedure-code-helper';
import { nirmsExpectation } from '../../helper/nirms-helper';
import {
    CompanyPermissionService,
} from '../../api-service/portal-api/company-permission-service';
import {
    TraderGoodsProfileService, describeTgpGap,
} from '../../api-service/portal-api/trader-goods-profile-service';
import { COMPANY_PROFILE, UserCredentials } from '../../auth/credentials';
import { ENV } from '../../../config/environment';

/**
 * One goods item on the IMMI standalone journey.
 *
 * IMMI is the standalone journey that asks about TGP at goods level, and answering
 * yes puts the app on its own route: the record supplies the commodity code, the
 * goods description and the country of origin, so both of those screens are skipped.
 */
export class AddNewImmiStandaloneGoodsItemFlow {
    constructor(
        private readonly steps: GoodsItemSteps,
        private readonly companyPermissionService: CompanyPermissionService,
        private readonly traderGoodsProfileService: TraderGoodsProfileService,
        private readonly authAccount: UserCredentials | null,
    ) { }

    /**
     * Returns whether the item was declared from a TGP record — the caller needs it
     * to know whether the overview should carry TGP-populated values.
     */
    async addNewImmiStandaloneGoodsItem(
        input: GoodsData,
        declaringForEori: string
    ): Promise<boolean> {
        return ReportLog.step('Add new IMMI standalone goods item', async () => {
            await this.steps.openNewGoodsRecord();

            const usesTgp = await this.declareTgp(input, declaringForEori);

            await this.steps.selectGoodsProcedureCode(input);
            await this.steps.selectAdditionalProcedureCode(input);

            // No supervising office step, unlike the standard and simplified wizards
            // beside this one: IMMI is not a route that asks for it, and the service
            // supplies the office itself. What it chose is checked on the consignment
            // overview - see CreateDraftImmiStandaloneFlow.
            await this.steps.enterWarehouseIdentifierIfAsked(input);

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
                await this.answerNirms(input, declaringForEori);
            }

            await this.steps.enterStandalonePackagingDetails(input);

            if (usesTgp) {
                await this.answerNirms(input, declaringForEori);
            }

            await this.steps.enterWeightInformation(input);
            await this.steps.enterItemPrice(input);

            if (!usesTgp) {
                await this.steps.enterCountryOfOrigin(input);
            }

            await this.steps.finishGoodsItemDeclaration();
            return usesTgp;
        });
    }

    /**
     * "Do you want to use NIRMS for these goods?" - decided by the same rule as the ENS
     * wizard (see nirms-helper), because it is one rule of the service rather than one
     * per journey. Only where it sits in the wizard differs.
     */
    private async answerNirms(input: GoodsData, importerEORI: string): Promise<void> {
        const grant = await this.companyPermissionService.readPermissionGrant(importerEORI);

        const { expected, because } = nirmsExpectation({
            isEnsOnly: false,
            useIMMI: true,
            importerEORI,
            hasNirmsAuthorisation: grant.hasNirmsAuthorisation,
            additionalProcedureCode: input.additionalProcedureCode,
            commodityCode: input.commodityCode,
            countryOfOrigin: input.countryOfOrigin,
        });

        if (input.useNirms && !expected) {
            throw new Error(
                `Test data sets "useNirms" but the NIRMS screen is never put for this item on `
                + `"${ENV}": ${because}.`
            );
        }

        const asked = await this.steps.answerNirmsIfAsked(input);

        if (asked === expected) {
            return;
        }

        throw new Error(
            expected
                ? `The NIRMS screen was never shown, but it was owed: ${because}. Nothing in `
                + `the test data explains this - the screen was not offered.`
                : `The NIRMS screen was shown, but it should not have been: ${because}. `
                + `The service and what it permits disagree.`
        );
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
    private async declareTgp(input: GoodsData, declaringForEori: string): Promise<boolean> {
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

        const { asked, usesTgp } = await this.steps.declareTgp(input);

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
