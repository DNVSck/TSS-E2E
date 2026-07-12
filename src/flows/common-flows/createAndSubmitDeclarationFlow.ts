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
import { AddNewGoodsItemFlow } from '../add-new-goods-item-flow';
import { GoodsOverviewFlow } from '../goods-overview-flow';
import { goods, GoodsData } from '../../test-data/goods-data';
import { ReportLog } from '../../core/report/report-log';
import { COMPANY_PROFILE, CompanyProfile, getCredentials } from '../../core/auth/credentials';

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
    ) { }

    /**
     * The signed-in company profile is chosen by the spec through
     * `test.use({ storageState: authStatePath(PROFILE) })`, not here — the sign-in
     * itself happens once, in globalSetup.
     */
    async completeEnsDeclarationFlow(options: {
        testInfo: TestInfo;
        url: string;
        profile?: CompanyProfile;
        initialFormOverrides?: Partial<InitialFormData>;
        movementOverrides?: Partial<MovementData>;
        consignmentOverrides?: Partial<ConsignmentData>;
        goodsItemOverrides?: Partial<GoodsData>;
    }): Promise<void> {
        const { testInfo, url } = options;

        // Which account this journey runs as — surfaced in the report for tracking.
        // Defaults to AGENT because that is the profile every current spec signs in
        // as via `test.use({ storageState })`; pass `profile` when a spec differs.
        const profile = options.profile ?? COMPANY_PROFILE.AGENT;
        const account = `${getCredentials(profile).username} (${profile})`;
        ReportLog.setParameter('Test account', account);
        await ReportLog.info(`Test account: ${account}`);

        const routeData = initialFormData(options.initialFormOverrides);
        const movementData = movement(options.movementOverrides);
        const consignmentData = consignment(options.consignmentOverrides);
        const goodsData = goods(options.goodsItemOverrides);

        // The goods-item flow branches on consignment-level answers, so derive the
        // journey context here where both data sets are known.
        const goodsJourney = {
            useIMMI: !consignmentData.isEnsOnly && consignmentData.useIMMI,
            isEnsOnly: consignmentData.isEnsOnly,
            isControlledGoods: !consignmentData.isEnsOnly && consignmentData.isControlledGoods,
            // The dangerous-goods question shows on ENS-only and on the controlled-goods
            // SFD journey — not on IMMI (which goes controlled -> country) nor EIDR.
            hasDangerousGoods: consignmentData.isEnsOnly || (!consignmentData.useIMMI && consignmentData.isControlledGoods),
            hasGoodsContainer: consignmentData.isGoodsCrossEUBorder && !consignmentData.isSameContainer,
            hasInvoiceDetails: !consignmentData.isEnsOnly && (consignmentData.useIMMI || consignmentData.isControlledGoods),
        };

        // Each flow reports its own top-level step; re-wrapping here would add a
        // redundant nesting level with a second name for the same phase.
        await this.accessFlow.openService({ baseUrl: url, testInfo });
        await this.routeFlow.completeInitialFormDeclaration(routeData);
        await this.movementHeaderFlow.completeNewGoodsMovementDeclaration(movementData);
        await this.movementOverviewFlow.verifyDraftMovementOverview();
        await this.addNewConsignmentFlow.addNewEnsConsignment(consignmentData);
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
    }
}
