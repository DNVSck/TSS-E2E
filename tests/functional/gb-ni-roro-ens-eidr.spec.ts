import { ReportLog } from '../../src/core/report/report-log';
import { consignment } from '../../src/test-data/consignment-data';
import { movement } from '../../src/test-data/movements-data';
import { initialFormData } from '../../src/test-data/initial-form-data';
import { goods } from '../../src/test-data/goods-data';
import { getBaseUrl, test } from '../test-hooks';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../src/constant/type-of-movement-code-constant';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';
import { authStatePath } from '../../src/core/auth/auth-state';

// TODO: set the Azure test case id for the EIDR journey once it exists.

/**
 * EIDR is the SFD journey taken when the goods are declared as not controlled.
 * Answering "controlled goods = No" drops the exporter and the invoice-currency
 * screens, so the consignment goes straight from the consignee to the seller and
 * on to the container questions. `isControlledGoods: false` is the only override
 * that distinguishes it from the controlled-goods SFD journey.
 */
test.describe('GB to NI RoRo EIDR Declaration Process', () => {
  // Replays the session cached by globalSetup; no sign-in per test.
  test.use({ storageState: authStatePath(COMPANY_PROFILE.AGENT) });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo EIDR Declaration Process');
  });

  test('Accompanied', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - GB to NI RoRo Accompanied (controlled goods = No)');

    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(
      testInfo,
      getBaseUrl(),
      initialFormData(),
      movement(),
      consignment({ isControlledGoods: false }),
      goods()
    );
  });

  test('Unaccompanied', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - GB to NI RoRo Unaccompanied (controlled goods = No)');

    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(
      testInfo,
      getBaseUrl(),
      initialFormData(),
      movement({ typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED }),
      consignment({ isControlledGoods: false }),
      goods()
    );
  });

  test('Accompanied - goods in different containers', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {

    test.fixme(true, 'Per-item container screen does not appear on SIT — app bug.');

    await ReportLog.setStory('EIDR - GB to NI RoRo Accompanied with goods in different containers');

    // Different containers on the consignment makes each goods item declare its own
    // container details.
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow(
      testInfo,
      getBaseUrl(),
      initialFormData(),
      movement(),
      consignment({ isControlledGoods: false, isGoodsCrossEUBorder: true, isSameContainer: false }),
      goods()
    );
  });
});
