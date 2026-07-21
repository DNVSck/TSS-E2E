import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../movement-header-declaration-flow';
import { MovementOverviewFlow } from '../movement-overview-flow';
import { initialFormData, InitialFormData } from '../../test-data/initial-form-data';
import { movement, MovementData } from '../../test-data/movements-data';
import { TestInfo } from '@playwright/test';
import { AddNewConsignmentFlow } from '../add-new-consignment-flow';
import { ConsignmentOverviewFlow } from '../consignment-overview-flow';
import { consignment, ConsignmentData } from '../../test-data/consignment-data';
import { AddNewGoodsItemFlow, GoodsJourneyContext } from '../add-new-goods-item-flow';
import { GoodsOverviewFlow } from '../goods-overview-flow';
import { goods, GoodsData } from '../../test-data/goods-data';
import { ReportLog } from '../../core/report/report-log';
import { UserCredentials } from '../../core/auth/credentials';

export class CreateAndSubmitEnsDeclarationFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly routeFlow: InitialFormDeclarationFlow,
        private readonly movementHeaderFlow: MovementHeaderDeclarationFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly addNewConsignmentFlow: AddNewConsignmentFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly addNewGoodsItemFlow: AddNewGoodsItemFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        // The account this worker was actually assigned by the auth fixture — the
        // same source of truth that picked the replayed session, so reporting can
        // never drift from the account the test really runs as.
        private readonly authAccount: UserCredentials | null,
    ) { }

    /**
     * The signed-in company profile is chosen by the spec through
     * `test.use({ storageState: authStatePath(PROFILE) })`, not here — the sign-in
     * itself happens once, in globalSetup.
     */
    async completeEnsDeclarationFlow(options: {
        testInfo: TestInfo;
        url: string;
        initialFormOverrides?: Partial<InitialFormData>;
        movementOverrides?: Partial<MovementData>;
        consignmentOverrides?: Partial<ConsignmentData>;
        goodsItemOverrides?: Partial<GoodsData>;
    }): Promise<void> {
        const { testInfo, url } = options;

        await this.reportTestAccount();

        const routeData = initialFormData(options.initialFormOverrides);
        const movementData = movement(options.movementOverrides);
        const consignmentData = consignment(options.consignmentOverrides);
        const goodsData = goods(options.goodsItemOverrides);
        const goodsJourney = this.buildGoodsJourney(consignmentData);

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
        await this.addNewGoodsItemFlow.addNewGoodsItem(goodsData, goodsJourney);
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
        await this.verifyPostSubmit(goodsJourney);
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
    private async verifyPostSubmit(goodsJourney: GoodsJourneyContext): Promise<void> {
        if (goodsJourney.useIMMI) {
            await this.movementOverviewFlow.verifyImmiConsignmentDetail();
        } else if (goodsJourney.isControlledGoods) {
            await this.movementOverviewFlow.verifySfdConsignmentDetail();
        } else if (!goodsJourney.isEnsOnly) {
            // The remaining full journey (non-IMMI, controlled goods = No) is EIDR.
            await this.movementOverviewFlow.verifyEidrConsignmentDetail();
        }
        // Submitting auto-returns to the movement overview.
        await this.movementOverviewFlow.verifyEnsConsignmentDetail();
    }

    /**
     * Surface the account this journey runs as in the report (for tracking). Reads
     * the account the auth fixture actually assigned — the same one whose session
     * `storageState` replayed — so the report can never name a different account
     * than the test signed in as. A spec running this flow is always signed in, so
     * a null account means it forgot `test.use({ authProfile })`.
     */
    private async reportTestAccount(): Promise<void> {
        if (!this.authAccount) {
            throw new Error(
                'completeEnsDeclarationFlow ran without an authenticated account — ' +
                'the spec must set test.use({ authProfile: ... }).'
            );
        }

        const { username, profile, accountNumber } = this.authAccount;
        const account = `${username} (${profile} account ${accountNumber ?? 1})`;
        ReportLog.setParameter('Test account', account);
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
