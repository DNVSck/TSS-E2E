import { TestInfo } from '@playwright/test';
import {
    FfdStandaloneConsignmentData, ffdH1StandaloneConsignment,
} from '../../test-data/ffd-standalone-consignment-data';
import { FfdH1GoodsData, ffdH1StandaloneGoodsItem, ffdH1TraderDdaGoodsItem } from '../../test-data/ffd-standalone-goods-item-data';
import { UserCredentials } from '../../auth/credentials';
import { CreateDraftFfdStandaloneFlow, DraftFfdStandaloneDeclaration, FfdGoodsItemsOptions } from './create-draft-ffd-standalone-flow';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewFfdStandaloneConsignmentFlow } from '../consignment/add-new-ffd-standalone-consignment-flow';
import { AddNewFfdStandaloneGoodsItemFlow } from '../goods-item/add-new-ffd-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';
import { UploadGoodsCsvFlow } from '../goods-item/upload-goods-csv-flow';
import { reportTestAccount } from '../../helper/report-helper';

export class CreateDraftFfdH1StandaloneFlow extends CreateDraftFfdStandaloneFlow {
    constructor(
        accessFlow: PortalAccessFlow,
        initialFormFlow: InitialFormDeclarationFlow,
        addConsignmentFlow: AddNewFfdStandaloneConsignmentFlow,
        addGoodsItemFlow: AddNewFfdStandaloneGoodsItemFlow,
        consignmentOverviewFlow: ConsignmentOverviewFlow,
        goodsOverviewFlow: GoodsOverviewFlow,
        authAccount: UserCredentials | null,
        private readonly uploadGoodsCsvFlow: UploadGoodsCsvFlow,
    ) {
        super(accessFlow, initialFormFlow, addConsignmentFlow, addGoodsItemFlow, consignmentOverviewFlow, goodsOverviewFlow, authAccount);
    }

    async createDraftFfdH1Standalone(options: {
        testInfo: TestInfo;
        url: string;
        declaringForEori?: string;
        consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
    } & FfdGoodsItemsOptions<FfdH1GoodsData>): Promise<DraftFfdStandaloneDeclaration> {
        const consignmentData = ffdH1StandaloneConsignment(options.consignmentOverrides);
        const goodsItems = this.goodsItemsOf(options, (overrides) => overrides
            ? ffdH1StandaloneGoodsItem(overrides)
            : ffdH1TraderDdaGoodsItem());
        return this.createDraftFfdStandalone(
            options,
            consignmentData,
            goodsItems,
            (goods, isFirstGoodsItem) => this.addGoodsItemFlow.addNewFfdStandaloneGoodsItem(goods, {
                asksNatureOfGoods: !consignmentData.isSameNatureOfGoods,
                asksSupervisingCustomsOffice: isFirstGoodsItem,
            }),
            'createDraftFfdH1Standalone',
        );
    }

    async createDraftFfdH1StandaloneWithGoodsCsv(
        options: {
            testInfo: TestInfo;
            url: string;
            declaringForEori?: string;
            consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
        },
        csvFile: string,
    ): Promise<DraftFfdStandaloneDeclaration> {
        reportTestAccount(this.authAccount, 'createDraftFfdH1StandaloneWithGoodsCsv');
        const consignmentData = ffdH1StandaloneConsignment(options.consignmentOverrides);
        const draft = await this.declareConsignment(options, consignmentData);
        await this.uploadGoodsCsvFlow.uploadGoodsCsv(csvFile);
        return draft;
    }
}
