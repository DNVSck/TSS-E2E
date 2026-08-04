import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../movement/movement-header-declaration-flow';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { initialFormData, InitialFormData } from '../../test-data/initial-form-data';
import { movement, MovementData } from '../../test-data/movements-data';
import { TestInfo } from '@playwright/test';
import { AddNewEnsConsignmentFlow } from '../consignment/add-new-ens-consignment-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { consignment, ConsignmentData } from '../../test-data/consignment-data';
import { AddNewEnsGoodsItemFlow, GoodsJourneyContext } from '../goods-item/add-new-ens-goods-item-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import { goods, GoodsData } from '../../test-data/goods-data';
import { UserCredentials } from '../../auth/credentials';
import { reportTestAccount, reportDeclarationCodes } from '../../helper/report-helper';

export class CreateAndSubmitEnsDeclarationFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly routeFlow: InitialFormDeclarationFlow,
        private readonly movementHeaderFlow: MovementHeaderDeclarationFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly addNewConsignmentFlow: AddNewEnsConsignmentFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly addNewGoodsItemFlow: AddNewEnsGoodsItemFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        // The account this worker was actually assigned by the auth fixture â€” the
        // same source of truth that picked the replayed session, so reporting can
        // never drift from the account the test really runs as.
        private readonly authAccount: UserCredentials | null,
    ) { }

    /**
     * The signed-in company profile is chosen by the spec through
     * `test.use({ storageState: authStatePath(PROFILE) })`, not here â€” the sign-in
     * itself happens once, in globalSetup.
     */
    async completeEnsDeclarationFlow(options: {
        testInfo: TestInfo;
        url: string;
        initialFormOverrides?: Partial<InitialFormData>;
        movementOverrides?: Partial<MovementData>;
        consignmentOverrides?: Partial<ConsignmentData>;
        goodsItemOverrides?: Partial<GoodsData>;
    }): Promise<{ transportDocumentNumber: string; ensMrn: string }> {
        const { testInfo, url } = options;

        reportTestAccount(this.authAccount, 'completeEnsDeclarationFlow');

        const routeData = initialFormData(options.initialFormOverrides);
        const movementData = movement(options.movementOverrides);
        const consignmentData = consignment(options.consignmentOverrides);
        const goodsData = goods(options.goodsItemOverrides);
        const goodsJourney = this.buildGoodsJourney(consignmentData);

        reportDeclarationCodes(goodsData);

        // Each flow reports its own top-level step; re-wrapping here would add a
        // redundant nesting level with a second name for the same phase.
        await this.accessFlow.openService({ baseUrl: url, testInfo });
        await this.routeFlow.completeInitialFormDeclaration(routeData);
        await this.movementHeaderFlow.completeNewGoodsMovementDeclaration(movementData);
        await this.movementOverviewFlow.verifyDraftMovementOverview();
        await this.addNewConsignmentFlow.addNewEnsConsignment(consignmentData);
        // Report the consignment reference (DEC…) as soon as its draft exists, so a
        // run captures it even if a later step fails.
        await this.consignmentOverviewFlow.verifyDraftConsignment();
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);
        // Declaring those tabs leaves the overview on the tab's own route; return to
        // the consignment overview (Goods records tab) before adding the goods item.
        const usedTgp = await this.addNewGoodsItemFlow.addNewGoodsItem(goodsData, goodsJourney);
        // A TGP item never typed its commodity code, description or supplementary
        // units — the service copied them from the record — so the overview is the
        // only place that proves the record was applied. No-op on every other journey.
        await this.goodsOverviewFlow.verifyTgpPopulatedFields(usedTgp ? goodsData.tgpRecord : undefined);
        // Goods-item overview tabs (e.g. document references). No-op unless the goods
        // data supplies entries, so existing journeys are unaffected.
        await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
        await this.goodsOverviewFlow.declareAdditionalInformations(goodsData.additionalInformations);
        await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);
        await this.goodsOverviewFlow.declareAdditionalProcedureCodes(goodsData.additionalProcedureCodes);
        await this.goodsOverviewFlow.declareTaricAdditionalCodes(goodsData.taricAdditionalCodes);
        await this.goodsOverviewFlow.declareNationalAdditionalCodes(goodsData.nationalAdditionalCodes);
        // Goods-item work done: return to the consignment overview via the breadcrumb
        // and submit the consignment.
        await this.consignmentOverviewFlow.submitConsignment();
        const ensMrn = await this.verifyPostSubmit(goodsJourney);
        return { transportDocumentNumber: consignmentData.transportDocumentNumber, ensMrn };
    }

    /**
     * Post-submit verification. The conditional detail check runs before the shared
     * authorised-movement check, so the interleaved ordering stays owned here rather
     * than leaking into each spec.
     *
     * Each non-ENS-only journey auto-generates one linked consignment: SFD
     * (controlled goods), IMMI, or EIDR (controlled goods = No). SFD/IMMI are
     * verified as "Awaiting arrival" with an MRN; EIDR lands "Trader Input Required"
     * with NO MRN (it is never authorised with one). Verify whichever applies, then
     * confirm the ENS consignment MRN is returned (the smoke proof-of-life).
     */
    private async verifyPostSubmit(goodsJourney: GoodsJourneyContext): Promise<string> {
        await this.movementOverviewFlow.waitForSubmittedMovementOverview();
        if (goodsJourney.useIMMI) {
            await this.movementOverviewFlow.verifyImmiConsignmentDetail();
        } else if (goodsJourney.isControlledGoods) {
            await this.movementOverviewFlow.verifySfdConsignmentDetail();
        } else if (!goodsJourney.isEnsOnly) {
            // The remaining full journey (non-IMMI, controlled goods = No) is EIDR.
            await this.movementOverviewFlow.verifyEidrConsignmentDetail();
        }
        // Submitting auto-returns to the movement overview.
        return this.movementOverviewFlow.verifyEnsConsignmentDetail();
    }

    /**
     * Derive which conditional goods-item screens this journey reaches. The goods
     * flow branches on consignment-level answers, so the context is derived here
     * where both data sets are known.
     */
    private buildGoodsJourney(consignmentData: ConsignmentData): GoodsJourneyContext {
        return {
            useIMMI: !consignmentData.isEnsOnly && consignmentData.useIMMI,
            isEnsOnly: consignmentData.isEnsOnly,
            isControlledGoods: !consignmentData.isEnsOnly && consignmentData.isControlledGoods,
            // The dangerous-goods question shows on ENS-only and on the controlled-goods
            // SFD journey — not on IMMI (which goes controlled -> country) nor EIDR.
            hasDangerousGoods: consignmentData.isEnsOnly || (!consignmentData.useIMMI && consignmentData.isControlledGoods),
            hasGoodsContainer: consignmentData.isGoodsCrossEUBorder && !consignmentData.isSameContainer,
            hasInvoiceDetails: !consignmentData.isEnsOnly && (consignmentData.useIMMI || consignmentData.isControlledGoods),
        };
    }
}
