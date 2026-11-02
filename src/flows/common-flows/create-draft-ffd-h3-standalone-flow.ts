import { TestInfo } from '@playwright/test';
import {
    FfdStandaloneConsignmentData, ffdH3StandaloneConsignment,
} from '../../test-data/ffd-standalone-consignment-data';
import { FfdH3GoodsData, ffdH3StandaloneGoodsItem } from '../../test-data/ffd-standalone-goods-item-data';
import { UserCredentials } from '../../auth/credentials';
import {
    CreateDraftFfdStandaloneFlow, DraftFfdStandaloneDeclaration, FfdGoodsItemsOptions,
} from './create-draft-ffd-standalone-flow';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewFfdStandaloneConsignmentFlow } from '../consignment/add-new-ffd-standalone-consignment-flow';
import { AddNewFfdStandaloneGoodsItemFlow } from '../goods-item/add-new-ffd-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';

export class CreateDraftFfdH3StandaloneFlow extends CreateDraftFfdStandaloneFlow {
    constructor(
        accessFlow: PortalAccessFlow,
        initialFormFlow: InitialFormDeclarationFlow,
        addConsignmentFlow: AddNewFfdStandaloneConsignmentFlow,
        addGoodsItemFlow: AddNewFfdStandaloneGoodsItemFlow,
        consignmentOverviewFlow: ConsignmentOverviewFlow,
        goodsOverviewFlow: GoodsOverviewFlow,
        authAccount: UserCredentials | null,
    ) {
        super(accessFlow, initialFormFlow, addConsignmentFlow, addGoodsItemFlow, consignmentOverviewFlow, goodsOverviewFlow, authAccount);
    }

    async createDraftFfdH3Standalone(options: {
        testInfo: TestInfo;
        url: string;
        declaringForEori?: string;
        consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
    } & FfdGoodsItemsOptions<FfdH3GoodsData>): Promise<DraftFfdStandaloneDeclaration> {
        const consignmentData = ffdH3StandaloneConsignment(options.consignmentOverrides);
        const goodsItems = this.goodsItemsOf(options, ffdH3StandaloneGoodsItem);
        return this.createDraftFfdStandalone(
            options,
            consignmentData,
            goodsItems,
            (goods, isFirstGoodsItem) => this.addGoodsItemFlow.addNewFfdH3StandaloneGoodsItem(goods, {
                asksNatureOfGoods: !consignmentData.isSameNatureOfGoods,
                asksSupervisingCustomsOffice: isFirstGoodsItem,
            }),
            'createDraftFfdH3Standalone',
        );
    }
}
