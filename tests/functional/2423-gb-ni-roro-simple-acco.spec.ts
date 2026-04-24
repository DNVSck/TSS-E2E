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
import { NewGoodsMovementLoadingDetailsFlow } from '../../src/flows/new-goods-movement-loading-details-flow';


test.describe('GB to NI RoRo Simple Acco',
  { tag: ['@smoke'] },
  () => {

    test.beforeEach(async () => {
      await ReportLog.setFeature('ENS - Simplified Declaration');
    });

    test('ENS - Simplified Declaration for GB to NI RoRo Simple Accompanied',
      async ({ t, portalPage, basePage, signInPage, initialFormDeclaraPage, goodsMovementTaskListPage, newGoodsMovementDeclarePage }, testInfo) => {
        await ReportLog.setStory('ENS SFD - GB to NI RoRo Simple Accompanied');

        ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

        const accessFlow = new PortalAccessFlow(basePage, portalPage, signInPage);
        const routeFlow = new RouteDeclarationFlow(initialFormDeclaraPage);

        //-------Access Service as Admin--------
        const expectedTitle = t('portal.title');
        await accessFlow.accessServiceAsAdmin(getBaseUrl(), testInfo, expectedTitle);

        //-------Complete Route Declaration--------
        await ReportLog.step('Complete route declaration for GB to NI RoRo Simple Acco', async () => {
          await routeFlow.completeRouteDeclaration(route());
        });

        ReportLog.info('Started RoRo Simple Accompanied declaration successfully');

        const movementDeclarationHeaderFlow = new MovementHeaderDeclarationFlow(goodsMovementTaskListPage);
        const newGoodsMovementTransportDetailsFlow = new NewGoodsMovementTransportDetailsFlow(newGoodsMovementDeclarePage);

        //-------Complete Movement Header Declaration--------
        await movementDeclarationHeaderFlow.completeMovementHeaderDeclaration(movement());

        //-------Submit Transport Details--------
        await newGoodsMovementTransportDetailsFlow.NewGoodsMovementTransportDetails(
          movement()
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

      });

  });