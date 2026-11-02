import { TestInfo } from '@playwright/test';
import {
    FfdStandaloneConsignmentData, ffdH4StandaloneConsignment,
} from '../../test-data/ffd-standalone-consignment-data';
import { FfdH4GoodsData, ffdH4StandaloneGoodsItem } from '../../test-data/ffd-standalone-goods-item-data';
import { UserCredentials } from '../../auth/credentials';
import {
    CreateDraftFfdStandaloneFlow, DraftFfdStandaloneDeclaration,
} from './create-draft-ffd-standalone-flow';
import { PortalAccessFlow } from '../portal-access-flow';
import { InitialFormDeclarationFlow } from '../initial-form-declaration-flow';
import { AddNewFfdStandaloneConsignmentFlow } from '../consignment/add-new-ffd-standalone-consignment-flow';
import { AddNewFfdStandaloneGoodsItemFlow } from '../goods-item/add-new-ffd-standalone-goods-item-flow';
import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { GoodsOverviewFlow } from '../goods-item/goods-overview-flow';

export class CreateDraftFfdH4StandaloneFlow extends CreateDraftFfdStandaloneFlow {
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

    async createDraftFfdH4Standalone(options: {
        testInfo: TestInfo;
        url: string;
        declaringForEori?: string;
        consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
        goodsItemOverrides?: Partial<FfdH4GoodsData>;
    }): Promise<DraftFfdStandaloneDeclaration> {
        const consignmentData = ffdH4StandaloneConsignment(options.consignmentOverrides);
        const goodsData = ffdH4StandaloneGoodsItem(options.goodsItemOverrides);
        return this.createDraftFfdStandalone(
            options,
            consignmentData,
            [goodsData],
            (goods) => this.addGoodsItemFlow.addNewFfdH4StandaloneGoodsItem(goods, !consignmentData.isSameNatureOfGoods),
            'createDraftFfdH4Standalone',
        );
    }
}
