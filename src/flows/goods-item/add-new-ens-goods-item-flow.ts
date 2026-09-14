import { ReportLog } from '../../core/report/report-log';
import { GoodsData } from '../../test-data/goods-data';
import { GoodsItemSteps } from './goods-item-steps';
import { hidesSupplementaryUnit } from '../../helper/procedure-code-helper';
import {
    nirmsExpectation, nirmsNeedsTariff, NirmsExpectation,
} from '../../helper/nirms-helper';
import {
    CompanyPermissionService,
} from '../../api-service/portal-api/company-permission-service';
import {
    TraderGoodsProfileService, describeTgpGap,
} from '../../api-service/portal-api/trader-goods-profile-service';
import { TariffService } from '../../api-service/portal-api/tariff-service';
import { COMPANY_PROFILE, UserCredentials } from '../../auth/credentials';
import { ENV } from '../../../config/environment';

/**
 * Which of the conditional goods-item screens a journey reaches. Derived from the
 * consignment answers, because the goods flow branches on consignment-level facts
 * (see the goods BPMN): the domestic status and risk status are auto-filled from
 * the consignment and never shown here; ENS-only skips the procedure codes; the
 * controlled-goods question only shows when the consignment declared controlled
 * goods; the TGP screen only shows on IMMI; the per-item container screen only
 * shows when the consignment declared goods in different containers; and the goods
 * invoice screen only shows (asking the item price alone) when the consignment
 * already captured an invoice currency.
 */
export interface GoodsJourneyContext {
    readonly importerEORI: string;
    readonly useIMMI: boolean;
    readonly isEnsOnly: boolean;
    readonly isControlledGoods: boolean;
    readonly hasDangerousGoods: boolean;
    readonly hasGoodsContainer: boolean;
    readonly hasInvoiceDetails: boolean;
    /** The commodity screen collects supplementary units on SFD and IMMI only. */
    readonly hasSupplementaryUnits: boolean;
}

/**
 * One goods item on the four ENS-integrated journeys (ENS-only, EIDR, SFD, IMMI).
 *
 * The method body IS the screen list: every screen is one call on GoodsItemSteps,
 * and the conditionals say which journey reaches it. Screens are shared with the
 * standalone wizards beside this file; the order and the conditions are not, which
 * is why each journey keeps its own spine.
 */
function asksDangerousGoods(input: GoodsData, journey: GoodsJourneyContext): boolean {
    return journey.hasDangerousGoods
        && (!journey.isControlledGoods || input.areGoodsControlled);
}

export class AddNewEnsGoodsItemFlow {
    constructor(
        private readonly steps: GoodsItemSteps,
        private readonly companyPermissionService: CompanyPermissionService,
        private readonly traderGoodsProfileService: TraderGoodsProfileService,
        private readonly tariffService: TariffService,
        private readonly authAccount: UserCredentials | null,
    ) { }

    /**
     * Returns whether the item was declared from a TGP record — the caller needs it
     * to know whether the overview should carry TGP-populated values.
     */
    async addNewGoodsItem(input: GoodsData, journey: GoodsJourneyContext): Promise<boolean> {
        return ReportLog.step('Add new goods item', async () => {
            await this.steps.openNewGoodsRecord();

            // The TGP screen is the first goods screen, but only on the IMMI journey.
            const usesTgp = journey.useIMMI ? await this.declareTgp(input, journey) : false;

            // ENS-only has no procedure codes; every other journey starts here.
            if (!journey.isEnsOnly) {
                await this.steps.selectGoodsProcedureCode(input);
                await this.steps.selectAdditionalProcedureCode(input);

                // The supervising office is asked on the standard and simplified
                // routes; IMMI is not one of them - the service fills that field in
                // for itself there, and the consignment overview is where this suite
                // checks the value it chose.
                if (!journey.useIMMI) {
                    await this.steps.selectSupervisingCustomsOfficeIfAsked(input);
                }

                await this.steps.enterWarehouseIdentifierIfAsked(input);
            }

            // The goods-level "are the goods controlled?" question only appears when
            // the consignment itself declared controlled goods.
            if (journey.isControlledGoods) {
                await this.steps.declareControlledGoods(input);
            }

            if (asksDangerousGoods(input, journey)) {
                await this.steps.declareDangerousGoodsWithCodes(input);
            }

            if (journey.hasInvoiceDetails && !usesTgp) {
                await this.steps.enterCountryOfOrigin(input);
            }

            // A TGP item skips the commodity screen outright — the record already
            // supplies the commodity code, description and supplementary units.
            if (!usesTgp) {
                await this.enterCommodity(input, journey);
            }

            // The NIRMS question follows the COMMODITY, because whether the service asks
            // it at all depends on the commodity - so it sits wherever the commodity
            // became known, and that is not the same place on both routes.
            //
            // Without TGP the commodity was just typed in, so the screen comes next, as
            // its own Back link says ("...~nirms-confirmation" returns to
            // commodity-information). With TGP there IS no commodity screen and the
            // service asks at the end instead - see after the invoice screen below.
            if (!usesTgp) {
                await this.answerNirms(input, journey);
            }

            await this.steps.enterPackagingDetails(input);
            await this.steps.enterWeightInformation(input);

            // Per-item container details, only when goods are in different containers.
            if (journey.hasGoodsContainer) {
                await this.steps.enterContainerInformation(input);
            }

            if (journey.hasInvoiceDetails) {
                await this.steps.enterItemPrice(input);
            }

            if (usesTgp) {
                await this.answerNirms(input, journey);
            }

            await this.steps.finishGoodsItemDeclaration();
            return usesTgp;
        });
    }

    private async declareTgp(input: GoodsData, journey: GoodsJourneyContext): Promise<boolean> {
        const permission = await this.traderGoodsProfileService
            .readTgpPermission(journey.importerEORI);

        const declaringAsAgent = this.authAccount?.profile === COMPANY_PROFILE.AGENT;
        const expected = declaringAsAgent
            ? permission.allowsTssAccess && permission.allowsThirdPartyAccess
            : permission.allowsTssAccess;

        if (input.useTGP && !expected) {
            throw new Error(
                `Test data sets "useTGP" but the TGP question is never put for `
                + `${journey.importerEORI} on "${ENV}": ${describeTgpGap(permission, declaringAsAgent)}. `
                + `The TGP path cannot be exercised against that importer.`
            );
        }

        const { asked, usesTgp } = await this.steps.declareTgp(input);

        ReportLog.setParameter('TGP question', asked ? 'asked' : 'not asked');

        if (asked !== expected) {
            const asThirdParty = declaringAsAgent ? ' to a third party' : '';

            throw new Error(
                expected
                    ? `The TGP question was never put, but ${journey.importerEORI} grants every `
                    + `permission it needs${asThirdParty}, so the `
                    + `service should have asked. Nothing in the test data explains this - the `
                    + `screen that was owed was not offered.`
                    : `The TGP question was put, but ${describeTgpGap(permission, declaringAsAgent)}. `
                    + `The permissions and the screen disagree.`
            );
        }

        return usesTgp;
    }

    /**
     * "Do you want to use NIRMS for these goods?"
     *
     * Always needs the importer's NIRMS authorisation, and then a second condition that
     * is NOT the same on every journey - see nirmsExpectation.
     */
    private async answerNirms(input: GoodsData, journey: GoodsJourneyContext): Promise<void> {
        const { expected, because } = await this.expectedNirmsScreen(input, journey);

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

    private async expectedNirmsScreen(
        input: GoodsData,
        journey: GoodsJourneyContext
    ): Promise<NirmsExpectation> {
        const grant = journey.isEnsOnly
            ? undefined
            : await this.companyPermissionService.readPermissionGrant(journey.importerEORI);

        const facts = {
            isEnsOnly: journey.isEnsOnly,
            useIMMI: journey.useIMMI,
            importerEORI: journey.importerEORI,
            hasNirmsAuthorisation: grant?.hasNirmsAuthorisation ?? false,
            additionalProcedureCode: input.additionalProcedureCode,
            commodityCode: input.commodityCode,
            countryOfOrigin: input.countryOfOrigin,
        };

        return nirmsExpectation({
            ...facts,
            tariffCoversCommodity: nirmsNeedsTariff(facts)
                ? await this.tariffService.isNirmsSupported(input.commodityCode, input.countryOfOrigin)
                : undefined,
        });
    }

    /**
     * The commodity screen, in whichever of its two shapes this item reaches.
     *
     * Two independent rules decide that. The JOURNEY decides whether the screen has a
     * supplementary-unit field at all - SFD and IMMI have one, the others do not - and
     * the item's own additional procedure code can then take it away again, which is
     * what hidesSupplementaryUnit reads off the code.
     */
    private async enterCommodity(input: GoodsData, journey: GoodsJourneyContext): Promise<void> {
        const showsSupplementaryUnits = journey.hasSupplementaryUnits
            && !hidesSupplementaryUnit(input.additionalProcedureCode);

        if (showsSupplementaryUnits) {
            await this.steps.enterCommodityInformation(input);
        } else {
            await this.steps.enterCommodityInformationWithoutSupplementaryUnits(input);
        }
    }
}
