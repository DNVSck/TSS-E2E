import { ENVIRONMENT_INFO } from '../../config/environment';
import { ReportLog } from '../../src/core/report/report-log';
import { route } from '../../src/test-data/initial-form-data';
import { getBaseUrl, test } from '../test-hooks';

import { movement } from '../../src/test-data/movements-data';
import { consignment } from '../../src/test-data/consignment-data';


test.describe('Create IMMI Pre-movement GB - NI RoRo Accompanied with TGP',
  { tag: ['@smoke'] },
  () => {

    test.beforeEach(async () => {
      await ReportLog.setFeature('IMMI - Pre-movement');
    });

    test('IMMI - Pre-movement for GB to NI RoRo IMMI Accompanied with TGP',
      async ({ t, portalAccessFlow, initialFormDeclarationFlow, movementHeaderDeclarationFlow, addNewConsignmentFlow }, testInfo) => {
        await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Accompanied with TGP');

        ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

        //-------Access Service as Admin--------
        const expectedTitle = t('portal.title');
        await portalAccessFlow.accessServiceAsAdmin({
          baseUrl: getBaseUrl(),
          testInfo,
          expectedTitle,
        });

        //-------Complete Initial Form Declaration--------
        await ReportLog.step('Complete initial form declaration for GB to NI RoRo Accompanied', async () => {
          await initialFormDeclarationFlow.completeInitialFormDeclaration(route());
        });

        ReportLog.info('Started RoRo IMMI Accompanied declaration successfully');

        //-------Complete New Goods Movement Declaration--------
        await movementHeaderDeclarationFlow.completeNewGoodsMovementDeclaration(movement());

        //-------Add New Consignment--------
        await addNewConsignmentFlow.AddNewENSConsignment(consignment({isGoodsAtRisk: 'no', useIMMI: 'yes'}));

      });

  });
