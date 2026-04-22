import { ENVIRONMENT_INFO } from '../../config/environment';
import { ReportLog } from '../../src/core/report/report-log';
import { GB_TO_NI_RORO_SIMPLE_ACCO } from '../../src/test-data/gb-ni-roro-simple-acco';
import { getBaseUrl, test } from '../test-hooks';

import { PortalAccessFlow } from '../../src/flows/portal-access-flow';
import { RouteDeclarationFlow } from '../../src/flows/route-declaration-flow';


test.describe('GB to NI RoRo Simple Acco',
  { tag: ['@smoke'] },
  () => {

    test.beforeEach(async () => {
      await ReportLog.setFeature('ENS - Simplified Declaration');
    });

    test('ENS - Simplified Declaration for GB to NI RoRo Simple Accompanied',
      async ({ t, portalPage, basePage, signInPage, initialFormDeclaraPage}, testInfo) => {
        await ReportLog.setStory('ENS SFD - GB to NI RoRo Simple Accompanied');

        ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

        const accessFlow = new PortalAccessFlow(basePage, portalPage, signInPage);
        const routeFlow = new RouteDeclarationFlow(initialFormDeclaraPage);

        //-------Access Service as Admin--------
        const expectedTitle = t('portal.title');
        await accessFlow.accessServiceAsAdmin(getBaseUrl(), testInfo, expectedTitle);

        //-------Complete Route Declaration--------
        await ReportLog.step('Complete route declaration for GB to NI RoRo Simple Acco', async () => {
          await routeFlow.completeRouteDeclaration(GB_TO_NI_RORO_SIMPLE_ACCO.route);
        });

        ReportLog.info('Started Simple Acco declaration successfully');
      });

  });