import { ENVIRONMENT_INFO } from '../../config/environment';
import { ReportLog } from '../../src/core/report/ReportLog';
import { GB_TO_NI_RORO_SIMPLE_ACCO } from '../../src/test-data/gb-ni-roro-simple-acco';
import { getBaseUrl, test, expect } from '../test-hooks';

import { PortalAccessFlow } from '../../src/flows/portal-access-flow';
import { RouteDeclarationFlow } from '../../src/flows/route-declaration-flow';


test.describe('GB to NI RoRo Simple Acco',
  { tag: ['@smoke'] },
  () => {

    test('Sign in as admin and complete route declaration',
      async ({ t, portalPage, basePage, signInPage, movementHeaderDeclarePage, newGoodsMovementDeclarePage,  goodsMovementTaskListPage}, testInfo) => {
        ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

        const accessFlow = new PortalAccessFlow(basePage, portalPage, signInPage);
        const routeFlow = new RouteDeclarationFlow(movementHeaderDeclarePage);

        //-------Access Service as Admin--------
        await accessFlow.accessServiceAsAdmin(getBaseUrl(), testInfo);

        await ReportLog.step('Verify portal title', async () => {
          const expectedTitle = t('portal.title');
          await expect(portalPage.portalTitleLocator).toHaveText(expectedTitle);
        });

        //-------Complete Route Declaration--------
        await ReportLog.step('Complete route declaration for GB to NI RoRo Simple Acco', async () => {
          await routeFlow.completeRouteDeclaration(
            GB_TO_NI_RORO_SIMPLE_ACCO.route,
            GB_TO_NI_RORO_SIMPLE_ACCO.goodsMovementProcess,
            GB_TO_NI_RORO_SIMPLE_ACCO.process,
            GB_TO_NI_RORO_SIMPLE_ACCO.howToStart
          );
        });

        ReportLog.info('Started Simple Acco declaration successfully');
      })
  });