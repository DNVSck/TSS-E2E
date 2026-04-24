import { ENVIRONMENT_INFO } from '../../config/environment';
import { ReportLog } from '../../src/core/report/report-log';
import { route } from '../../src/test-data/route';
import { getBaseUrl, test } from '../test-hooks';

import { PortalAccessFlow } from '../../src/flows/portal-access-flow';
import { RouteDeclarationFlow } from '../../src/flows/route-declaration-flow';
import { MovementHeaderDeclarationFlow } from '../../src/flows/movement-header-declaration-flow';
import { NewGoodsMovementTransportDetailsFlow } from '../../src/flows/new-goods-movement-transport-details-flow';
import { NewGoodsMovementMovementDetailsFlow } from '../../src/flows/new-goods-movement-movement-details-flow';
import { movement } from '../../src/test-data/movements';
import { consignment } from '../../src/test-data/consignment';
import { NewGoodsMovementLoadingDetailsFlow } from '../../src/flows/new-goods-movement-loading-details-flow';
import { AddNewConsignmentFlow } from '../../src/flows/add-new-consignment-flow';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../src/constant/goods-movement-declaration-constants';


test.describe('Create IMMI Pre-movement GB - NI RoRo Accompanied with TGP',
  { tag: ['@smoke'] },
  () => {

    test.beforeEach(async () => {
      await ReportLog.setFeature('IMMI - Pre-movement');
    });

    test('IMMI - Pre-movement for GB to NI RoRo IMMI Accompanied with TGP',
      async ({ t, portalPage, basePage, signInPage, initialFormDeclaraPage, goodsMovementTaskListPage, newGoodsMovementDeclarePage, declarationOverviewPage, consignmentDeclarePage }, testInfo) => {
        await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Accompanied with TGP');

        ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

        const accessFlow = new PortalAccessFlow(basePage, portalPage, signInPage);
        const routeFlow = new RouteDeclarationFlow(initialFormDeclaraPage);

        //-------Access Service as Admin--------
        const expectedTitle = t('portal.title');
        await accessFlow.accessServiceAsAdmin(getBaseUrl(), testInfo, expectedTitle);

        //-------Complete Route Declaration--------
        await ReportLog.step('Complete route declaration for GB to NI RoRo Accompanied', async () => {
          await routeFlow.completeRouteDeclaration(route());
        });

        ReportLog.info('Started RoRo IMMI Accompanied declaration successfully');

        const movementDeclarationHeaderFlow = new MovementHeaderDeclarationFlow(goodsMovementTaskListPage);
        const newGoodsMovementTransportDetailsFlow = new NewGoodsMovementTransportDetailsFlow(newGoodsMovementDeclarePage);

        //-------Complete Movement Header Declaration--------
        await movementDeclarationHeaderFlow.completeMovementHeaderDeclaration(movement());

        //-------Submit Transport Details--------
        // RoRo Accompanied movement
        await newGoodsMovementTransportDetailsFlow.NewGoodsMovementTransportDetails(
          movement({typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED})
        );

        const newGoodsMovementMovementDetailsFlow = new NewGoodsMovementMovementDetailsFlow(newGoodsMovementDeclarePage);

        //-------Submit Movement Details--------

        await newGoodsMovementMovementDetailsFlow.NewGoodsMovementMovementDetails(
          movement()
        );

        const newGoodsMovementLoadingDetailsFlow = new NewGoodsMovementLoadingDetailsFlow(newGoodsMovementDeclarePage);

        //-------Submit Loading Details--------

        await newGoodsMovementLoadingDetailsFlow.NewGoodsMovementLoadingDetails(
          movement()
        );

        const addNewConsignmentFlow = new AddNewConsignmentFlow(declarationOverviewPage, consignmentDeclarePage);

        //-------Add New Consignment--------
        await addNewConsignmentFlow.AddNewENSConsignment(consignment({isGoodsAtRisk: 'no', useIMMI: 'yes'}));

      });

  });