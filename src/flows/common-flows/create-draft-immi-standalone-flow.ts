import { TestInfo } from '@playwright/test';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewImmiStandaloneConsignmentFlow } from '../consignment/add-new-immi-standalone-consignment-flow';
import { AddNewImmiStandaloneGoodsItemFlow } from '../goods-item/add-new-immi-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import {
    ImmiStandaloneConsignmentData, immiStandaloneConsignment,
} from '../../test-data/immi-standalone-consignment-data';
import { GoodsData, goods } from '../../test-data/goods-data';
import { initialFormData } from '../../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../../constant/initial-form-declaration-constants';
import { LOCAL_REFERENCE } from '../../constant/local-reference-constants';
import { UserCredentials } from '../../auth/credentials';
import { reportTestAccount, reportDeclarationCodes } from '../../helper/report-helper';
import { requiresWarehouseIdentifier } from '../../helper/procedure-code-helper';
import { SUPERVISING_CUSTOMS_OFFICE } from '../../constant/supervising-customs-office-constant';

/** What a caller supplies to build an IMMI standalone declaration. */
export interface ImmiStandaloneDeclarationOptions {
    testInfo: TestInfo;
    url: string;
    consignmentOverrides?: Partial<ImmiStandaloneConsignmentData>;
    goodsItemOverrides?: Partial<GoodsData>;
}

/** An IMMI standalone declaration built and left in Draft. */
export interface DraftImmiStandaloneDeclaration {
    /** The consignment reference (GLR...) - what the overview search looks it up by. */
    consignmentReference: string;
    /** The data it was built from, so a caller can decide what submitting it should do. */
    consignmentData: ImmiStandaloneConsignmentData;
}

/**
 * Builds an IMMI standalone declaration - consignment, goods item and their record
 * tabs - and stops at Draft, without submitting.
 *
 * Split out of CreateAndSubmitImmiStandaloneFlow for the reason the SFD and ENS drafts
 * were split out of theirs: a flow that submits decides how the story ends, and a caller
 * that wants a different ending cannot reuse it. The authority specs want a declaration
 * that was never submitted at all, and had no way to ask for one.
 *
 * Leaves the browser on the CONSIGNMENT overview, not on the goods item the last step
 * wrote to, so every caller starts from the same screen.
 */
export class CreateDraftImmiStandaloneFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly initialFormFlow: InitialFormDeclarationFlow,
        private readonly addConsignmentFlow: AddNewImmiStandaloneConsignmentFlow,
        private readonly addGoodsItemFlow: AddNewImmiStandaloneGoodsItemFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        // The account this worker was assigned by the auth fixture - the same source
        // that picked the replayed session, so the report never names another account.
        private readonly authAccount: UserCredentials | null,
    ) { }

    async createDraftImmiStandalone(
        options: ImmiStandaloneDeclarationOptions
    ): Promise<DraftImmiStandaloneDeclaration> {
        const { testInfo, url } = options;
        const consignmentData = immiStandaloneConsignment(options.consignmentOverrides);
        const goodsData = goods(options.goodsItemOverrides);

        reportTestAccount(this.authAccount, 'createDraftImmiStandalone');
        reportDeclarationCodes(goodsData);

        await this.accessFlow.openService({ baseUrl: url, testInfo });
        await this.initialFormFlow.completeInitialFormDeclaration(initialFormData({
            typeOfSubmission: INITIAL_FORM_DECLARATION.TYPE_OF_SUBMISSION.STANDALONE,
            standaloneDeclarationType:
                INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.INTERNAL_MARKET_MOVEMENT_INFORMATION,
            typeOfEnsSubmission: undefined,
        }));
        await this.addConsignmentFlow.addNewImmiStandaloneConsignment(consignmentData);
        // Report the LRN as soon as the draft exists, before anything that could fail.
        // IMMI stamps a "GLR" reference, so asserting the prefix asserts the journey
        // that actually ran rather than merely that some standalone draft exists.
        const consignmentReference = await this.consignmentOverviewFlow
            .verifyStandaloneConsignmentLrn(LOCAL_REFERENCE.GLR_PREFIX);
        // Consignment-overview tabs, declared before the goods item (no-op on empty lists).
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);

        const usedTgp = await this.addGoodsItemFlow.addNewImmiStandaloneGoodsItem(goodsData);
        // A TGP item never typed its commodity code, description or country of origin -
        // the service copied them from the record - so the overview is the only place
        // that proves the record was applied. No-op when the item did not use TGP.
        await this.goodsOverviewFlow.verifyTgpPopulatedFields(
            usedTgp ? goodsData.tgpRecord : undefined,
            goodsData.additionalProcedureCode
        );
        // Goods-item-overview tabs, declared while on the goods item's overview. All six
        // tabs the IMMI goods item shows are wired, each a no-op on an empty list, so a
        // test opting into one only has to supply its data - same set as the ENS flow.
        await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
        await this.goodsOverviewFlow.declareAdditionalInformations(goodsData.additionalInformations);
        await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);
        await this.goodsOverviewFlow.declareAdditionalProcedureCodes(goodsData.additionalProcedureCodes);
        await this.goodsOverviewFlow.declareTaricAdditionalCodes(goodsData.taricAdditionalCodes);
        await this.goodsOverviewFlow.declareNationalAdditionalCodes(goodsData.nationalAdditionalCodes);

        // The goods-item work above leaves the browser on the GOODS ITEM overview (on
        // whichever tab was declared last); everything a caller does next lives on the
        // consignment overview.
        await this.consignmentOverviewFlow.goToConsignmentOverview();

        // Checked BEFORE submit, unlike the ENS journey: this consignment carries its
        // own warehouse, so the service has already derived the office by the time the
        // goods item is finished - there is nothing to wait for and no reason to let a
        // wrong one through to submission.
        if (requiresWarehouseIdentifier(goodsData.procedureCode)) {
            await this.consignmentOverviewFlow.verifySupervisingCustomsOffice(
                SUPERVISING_CUSTOMS_OFFICE.GBBEL004
            );
        }

        return { consignmentReference, consignmentData };
    }
}
