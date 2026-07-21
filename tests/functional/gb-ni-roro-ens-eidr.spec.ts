import { ReportLog } from '../../src/core/report/report-log';
import { getBaseUrl, test } from '../test-hooks';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../src/constant/type-of-movement-code-constant';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';
import { HAULIER_COMPANY_NAME } from '../../config/environment';
import { gmrData } from '../../src/test-data/gmr-data';


test.describe('GB to NI RoRo EIDR Declaration Process', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI RoRo EIDR Declaration Process');
    // Agent represents the Haulier company before declaring on the Importer's
    // behalf — a server-side session state the journeys below then run under.
    await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
  });

  test('Verify ENS-EIDR - RoRo (Accompanied) is created and submitted successfully', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - GB to NI RoRo Accompanied (controlled goods = No)');
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
      },
      consignmentOverrides: { isControlledGoods: false },
    });

    await createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData());
  });

  test('Verify ENS-EIDR - RoRo (Unaccompanied) is created and submitted successfully', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - GB to NI RoRo Unaccompanied (controlled goods = No)');
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      movementOverrides: { 
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED 
      },
      consignmentOverrides: { isControlledGoods: false },
    });

    await createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData());
  });

  test('Verify ENS-EIDR - RoRo (Accompanied), goods item requires container details, is created and submitted successfully', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - GB to NI RoRo Accompanied with a goods item declaring its own container');
    // Different containers on the consignment makes each goods item declare its own
    // container details.
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
      },
      consignmentOverrides: { isControlledGoods: false, isGoodsCrossEUBorder: true, isSameContainer: false },
    });

    await createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData());
  });
});
