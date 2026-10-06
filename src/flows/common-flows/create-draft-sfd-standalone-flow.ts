import { TestInfo } from '@playwright/test';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewSfdStandaloneConsignmentFlow } from '../consignment/add-new-sfd-standalone-consignment-flow';
import { AddNewSfdStandaloneGoodsItemFlow } from '../goods-item/add-new-sfd-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import {
    SfdStandaloneConsignmentData, sfdStandaloneConsignment,
} from '../../test-data/sfd-standalone-consignment-data';
import { GoodsData, goods } from '../../test-data/goods-data';
import { AccessibilityAudit, checkpointFor } from '../accessibility-audit-flow';
import { initialFormData } from '../../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../../constant/initial-form-declaration-constants';
import { UserCredentials } from '../../auth/credentials';
import { reportTestAccount, reportDeclarationCodes } from '../../helper/report-helper';
import { LOCAL_REFERENCE } from '../../constant/local-reference-constants';

/** What a caller supplies to build an SFD standalone declaration. */
export interface SfdStandaloneDeclarationOptions {
    testInfo: TestInfo;
    url: string;
    consignmentOverrides?: Partial<SfdStandaloneConsignmentData>;
    goodsItemOverrides?: Partial<GoodsData>;
    audit?: AccessibilityAudit;
}

/** An SFD standalone declaration built and left in Draft. */
export interface DraftSfdStandaloneDeclaration {
    /** The consignment reference (DEC...) - what the overview search looks it up by. */
    consignmentReference: string;
    /** The data it was built from, so a caller can decide what submitting it should do. */
    consignmentData: SfdStandaloneConsignmentData;
}

/**
 * Builds an SFD standalone declaration - consignment, goods item and their record
 * tabs - and stops at Draft, without submitting.
 *
 * Split out of CreateAndSubmitSfdStandaloneFlow for the same reason the ENS draft flow
 * was split out of its own submitting flow: that one decides how the story ends, and a
 * caller that wants a different ending cannot reuse it. Two callers want one now - the
 * submitting flow, which composes this and carries on, and the authority spec asking who
 * may reach a declaration that was never submitted at all.
 *
 * Leaves the browser on the CONSIGNMENT overview, not on the goods item the last step
 * wrote to, so every caller starts from the same screen.
 */
export class CreateDraftSfdStandaloneFlow {
    constructor(
        private readonly accessFlow: PortalAccessFlow,
        private readonly initialFormFlow: InitialFormDeclarationFlow,
        private readonly addConsignmentFlow: AddNewSfdStandaloneConsignmentFlow,
        private readonly addGoodsItemFlow: AddNewSfdStandaloneGoodsItemFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly goodsOverviewFlow: GoodsOverviewFlow,
        // The account this worker was assigned by the auth fixture - the same source
        // that picked the replayed session, so the report never names another account.
        private readonly authAccount: UserCredentials | null,
    ) { }

    async createDraftSfdStandalone(
        options: SfdStandaloneDeclarationOptions
    ): Promise<DraftSfdStandaloneDeclaration> {
        const { testInfo, url } = options;
        const consignmentData = sfdStandaloneConsignment(options.consignmentOverrides);
        const goodsData = goods(options.goodsItemOverrides);

        reportTestAccount(this.authAccount, 'createDraftSfdStandalone');
        reportDeclarationCodes(goodsData);

        const checkpoint = checkpointFor(options.audit, testInfo);
        const auditTabs = (record: string) =>
            options.audit?.verifyEveryTab({ testInfo, record });

        await this.accessFlow.openService({ baseUrl: url, testInfo });
        const initialForm = initialFormData({
            typeOfSubmission: INITIAL_FORM_DECLARATION.TYPE_OF_SUBMISSION.STANDALONE,
            standaloneDeclarationType: INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.SIMPLIFIED_DECLARATION,
            typeOfEnsSubmission: undefined,
        });
        await this.initialFormFlow.completeInitialFormDeclaration(initialForm, checkpoint);
        await this.addConsignmentFlow.addNewSfdStandaloneConsignment(consignmentData, checkpoint);
        // Report the LRN as soon as the draft exists, before anything that could fail.
        const consignmentReference =
            await this.consignmentOverviewFlow.verifyStandaloneConsignmentLrn(LOCAL_REFERENCE.DEC_PREFIX);
        await auditTabs('Consignment');
        await this.consignmentOverviewFlow.auditRecordWizards(options.audit, testInfo);
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);

        await this.addGoodsItemFlow.addNewSfdStandaloneGoodsItem(goodsData, {
            isControlledConsignment: consignmentData.isControlledGoods,
            declaringForEori: initialForm.declaringForEori,
        }, checkpoint);
        if (goodsData.useNirms) {
            await this.goodsOverviewFlow.verifyNirmsDocumentReferences(goodsData.nirmsDocumentCodes);
        }

        // Goods-item-overview tabs, declared while on the goods item's overview.
        await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
        await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);
        await auditTabs('Goods item');
        await this.goodsOverviewFlow.auditRecordWizards(options.audit, testInfo);

        // The goods-item work above leaves the browser on the GOODS ITEM overview;
        // everything a caller does next lives on the consignment overview.
        await this.consignmentOverviewFlow.goToConsignmentOverview();

        return { consignmentReference, consignmentData };
    }
}
