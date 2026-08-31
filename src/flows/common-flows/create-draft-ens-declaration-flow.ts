import { TestInfo } from '@playwright/test';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../movement/movement-header-declaration-flow';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { initialFormData, InitialFormData } from '../../test-data/initial-form-data';
import { movement, MovementData } from '../../test-data/movements-data';
import { AddNewEnsConsignmentFlow } from '../consignment/add-new-ens-consignment-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { consignment, ConsignmentData } from '../../test-data/consignment-data';
import { AddNewEnsGoodsItemFlow, GoodsJourneyContext } from '../goods-item/add-new-ens-goods-item-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import { goods, GoodsData } from '../../test-data/goods-data';
import { UserCredentials } from '../../auth/credentials';
import { reportTestAccount, reportDeclarationCodes } from '../../helper/report-helper';

/** What a caller supplies to build an ENS declaration, whatever it does with it next. */
export interface EnsDeclarationOptions {
    testInfo: TestInfo;
    url: string;
    initialFormOverrides?: Partial<InitialFormData>;
    movementOverrides?: Partial<MovementData>;
    consignmentOverrides?: Partial<ConsignmentData>;
    goodsItemOverrides?: Partial<GoodsData>;
}

/** An ENS declaration built and left in Draft, and what a caller needs to go on with. */
export interface DraftEnsDeclaration {
    /** The ENS consignment reference (DEC...) - what the overview search looks it up by. */
    consignmentReference: string;
    transportDocumentNumber: string;
    /** Which conditional screens this journey reached; a post-submit check needs it. */
    goodsJourney: GoodsJourneyContext;
    procedureCode: string;
}

/**
 * Builds an ENS declaration - movement header, consignment, goods item and their
 * record tabs - and stops at Draft, without submitting.
 *
 * Split out of CreateAndSubmitEnsDeclarationFlow because that flow is a HAPPY-PATH
 * journey: it submits and then verifies the declaration was authorised, throwing if
 * the service hands it back. The authority specs need the same declaration but a
 * different ending - checking who may edit it while it is still a draft, or expecting
 * the rejection that flow treats as a failure. Neither could reuse a flow that had
 * already decided how the story ends.
 *
 * The signed-in company profile is chosen by the spec through
 * `test.use({ authProfile })`, not here - the sign-in itself happens in globalSetup.
 */
export class CreateDraftEnsDeclarationFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly routeFlow: InitialFormDeclarationFlow,
        private readonly movementHeaderFlow: MovementHeaderDeclarationFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly addNewEnsConsignmentFlow: AddNewEnsConsignmentFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly addNewEnsGoodsItemFlow: AddNewEnsGoodsItemFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        // The account this worker was actually assigned by the auth fixture - the same
        // source of truth that picked the replayed session, so reporting can never
        // drift from the account the test really runs as.
        private readonly authAccount: UserCredentials | null,
    ) { }

    async createDraftEnsDeclaration(options: EnsDeclarationOptions): Promise<DraftEnsDeclaration> {
        const { testInfo, url } = options;

        reportTestAccount(this.authAccount, 'createDraftEnsDeclaration');

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
        await this.addNewEnsConsignmentFlow.addNewEnsConsignment(consignmentData);
        // Report the consignment reference (DEC...) as soon as its draft exists, so a
        // run captures it even if a later step fails.
        const consignmentReference = await this.consignmentOverviewFlow.verifyDraftConsignment();
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);
        // Declaring those tabs leaves the overview on the tab's own route; return to
        // the consignment overview (Goods records tab) before adding the goods item.
        const usedTgp = await this.addNewEnsGoodsItemFlow.addNewGoodsItem(goodsData, goodsJourney);
        // A TGP item never typed its commodity code, description or supplementary
        // units - the service copied them from the record - so the overview is the
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

        return {
            consignmentReference,
            transportDocumentNumber: consignmentData.transportDocumentNumber,
            goodsJourney,
            procedureCode: goodsData.procedureCode,
        };
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
            // SFD journey - not on IMMI (which goes controlled -> country) nor EIDR.
            hasDangerousGoods: consignmentData.isEnsOnly || (!consignmentData.useIMMI && consignmentData.isControlledGoods),
            hasGoodsContainer: consignmentData.isGoodsCrossEUBorder && !consignmentData.isSameContainer,
            hasInvoiceDetails: !consignmentData.isEnsOnly && (consignmentData.useIMMI || consignmentData.isControlledGoods),
            hasSupplementaryUnits: !consignmentData.isEnsOnly
                && (consignmentData.useIMMI || consignmentData.isControlledGoods),
        };
    }
}
