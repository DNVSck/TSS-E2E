import { TestInfo } from '@playwright/test';
import {
    FfdStandaloneConsignmentData, ffdH2StandaloneConsignment,
} from '../../test-data/ffd-standalone-consignment-data';
import { FfdH2GoodsData, ffdH2StandaloneGoodsItem } from '../../test-data/ffd-standalone-goods-item-data';
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

export class CreateDraftFfdH2StandaloneFlow extends CreateDraftFfdStandaloneFlow {
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

    async createDraftFfdH2Standalone(options: {
        testInfo: TestInfo;
        url: string;
        consignmentOverrides?: Partial<FfdStandaloneConsignmentData>;
        goodsItemOverrides?: Partial<FfdH2GoodsData>;
    }): Promise<DraftFfdStandaloneDeclaration> {
        const consignmentData = ffdH2StandaloneConsignment(options.consignmentOverrides);
        const goodsData = ffdH2StandaloneGoodsItem(options.goodsItemOverrides);
        return this.createDraftFfdStandalone(
            options,
            consignmentData,
            [goodsData],
            (goods) => this.addGoodsItemFlow.addNewFfdH2StandaloneGoodsItem(goods),
            'createDraftFfdH2Standalone',
        );
    }
}
