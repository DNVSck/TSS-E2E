import { TestInfo } from '@playwright/test';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewFfdStandaloneConsignmentFlow } from '../consignment/add-new-ffd-standalone-consignment-flow';
import { AddNewFfdStandaloneGoodsItemFlow } from '../goods-item/add-new-ffd-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import { FfdStandaloneConsignmentData } from '../../test-data/ffd-standalone-consignment-data';
import { GoodsData } from '../../test-data/goods-data';
import { initialFormData } from '../../test-data/initial-form-data';
import { INITIAL_FORM_DECLARATION } from '../../constant/initial-form-declaration-constants';
import { LOCAL_REFERENCE } from '../../constant/local-reference-constants';
import { UserCredentials } from '../../auth/credentials';
import { reportTestAccount, reportDeclarationCodes } from '../../helper/report-helper';

export type FfdGoodsItemsOptions<G extends GoodsData> =
    | { goodsItemOverrides?: Partial<G>; goodsItemsOverrides?: never }
    | { goodsItemsOverrides: Partial<G>[]; goodsItemOverrides?: never };

export interface DraftFfdStandaloneDeclaration {
    consignmentReference: string;
    consignmentData: FfdStandaloneConsignmentData;
}

export abstract class CreateDraftFfdStandaloneFlow {
    constructor(
        protected readonly accessFlow: PortalAccessFlow,
        protected readonly initialFormFlow: InitialFormDeclarationFlow,
        protected readonly addConsignmentFlow: AddNewFfdStandaloneConsignmentFlow,
        protected readonly addGoodsItemFlow: AddNewFfdStandaloneGoodsItemFlow,
        protected readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        protected readonly goodsOverviewFlow: GoodsOverviewFlow,
        // The account this worker was assigned by the auth fixture - the same source
        // that picked the replayed session, so the report never names another account.
        protected readonly authAccount: UserCredentials | null,
    ) { }

    protected goodsItemsOf<G extends GoodsData>(
        options: FfdGoodsItemsOptions<G>,
        build: (overrides?: Partial<G>) => G,
    ): G[] {
        return (options.goodsItemsOverrides ?? [options.goodsItemOverrides]).map((overrides) => build(overrides));
    }

    protected async createDraftFfdStandalone<G extends GoodsData>(
        options: { testInfo: TestInfo; url: string; declaringForEori?: string },
        consignmentData: FfdStandaloneConsignmentData,
        goodsItems: G[],
        addGoodsItemStep: (goodsData: G, isFirstGoodsItem: boolean) => Promise<void>,
        reportLabel: string,
    ): Promise<DraftFfdStandaloneDeclaration> {
        reportTestAccount(this.authAccount, reportLabel);
        reportDeclarationCodes(goodsItems[0]);

        const draft = await this.declareConsignment(options, consignmentData);

        for (const [index, goodsData] of goodsItems.entries()) {
            await addGoodsItemStep(goodsData, index === 0);
            await this.goodsOverviewFlow.declareDocumentReferences(goodsData.documentReferences);
            await this.goodsOverviewFlow.declareAdditionalInformations(goodsData.additionalInformations);
            await this.goodsOverviewFlow.declarePreviousDocuments(goodsData.previousDocuments);
            await this.goodsOverviewFlow.declareAdditionalProcedureCodes(goodsData.additionalProcedureCodes);
            await this.goodsOverviewFlow.declareTaricAdditionalCodes(goodsData.taricAdditionalCodes);
            await this.goodsOverviewFlow.declareNationalAdditionalCodes(goodsData.nationalAdditionalCodes);

            await this.consignmentOverviewFlow.goToConsignmentOverview();
        }
        return draft;
    }

    protected async declareConsignment(
        options: { testInfo: TestInfo; url: string; declaringForEori?: string },
        consignmentData: FfdStandaloneConsignmentData,
    ): Promise<DraftFfdStandaloneDeclaration> {
        const { testInfo, url } = options;
        await this.accessFlow.openService({ baseUrl: url, testInfo });
        await this.initialFormFlow.completeInitialFormDeclaration(initialFormData({
            typeOfSubmission: INITIAL_FORM_DECLARATION.TYPE_OF_SUBMISSION.STANDALONE,
            standaloneDeclarationType: INITIAL_FORM_DECLARATION.STANDALONE_DECLARATION_TYPE.STANDARD_DECLARATION,
            typeOfEnsSubmission: undefined,
            ...(options.declaringForEori === undefined ? {} : { declaringForEori: options.declaringForEori }),
        }));
        await this.addConsignmentFlow.addNewFfdStandaloneConsignment(consignmentData);
        const consignmentReference = await this.consignmentOverviewFlow.verifyStandaloneConsignmentLrn(LOCAL_REFERENCE.FFD_PREFIX);
        await this.consignmentOverviewFlow.declareHeaderPreviousDocuments(consignmentData.headerPreviousDocuments);
        await this.consignmentOverviewFlow.declareHoldersOfAuthorisation(consignmentData.holdersOfAuthorisation);
        return { consignmentReference, consignmentData };
    }
}
