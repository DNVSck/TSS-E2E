import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { gmrData } from '../../../src/test-data/gmr-data';
import { ROUTE_ID_CONSTANT } from '../../../src/constant/routeId-constant';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const ENS_EIDR_GMR = '4438';

test.describe('GB to NI RoRo EIDR Declaration Process - Agent Represents Trader', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo EIDR Declaration Process');
  });

  test('Verify ENS-EIDR - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow, ics2NotificationFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - GB to NI RoRo Accompanied (controlled goods = No)');
    reportTestCaseLink(ENS_EIDR_GMR);
    const { transportDocumentNumber, ensMrn } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: getBaseUrl(),
        movementOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        },
        consignmentOverrides: { isControlledGoods: false },
      })
    );

    await ics2NotificationFlow.authoriseForMovementUnlessMocked(ensMrn, transportDocumentNumber);

    await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData({
        route_id: ROUTE_ID_CONSTANT.GB_TO_NI.LIVERPOOL_WARRENPOINT_SEATRUCK_FERRIES,
        external_contacts_list: ['adam1.taylor@nifreight.co.uk', 'john.doe@nifreight.co.uk'],
      }))
    );
  });

  test('Verify ENS-EIDR - RoRo (Unaccompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow, ics2NotificationFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - GB to NI RoRo Unaccompanied (controlled goods = No)');
    reportTestCaseLink(ENS_EIDR_GMR);
    const { transportDocumentNumber, ensMrn } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: getBaseUrl(),
        movementOverrides: { 
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED 
        },
        consignmentOverrides: { isControlledGoods: false },
      })
    );

    await ics2NotificationFlow.authoriseForMovementUnlessMocked(ensMrn, transportDocumentNumber);

    await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData())
    );
  });

  test('Verify ENS-EIDR - RoRo (Accompanied), goods item requires container details, is created and submitted successfully (4000-000)', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow, ics2NotificationFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - GB to NI RoRo Accompanied with a goods item declaring its own container');
    // Different containers on the consignment makes each goods item declare its own
    // container details.
    const { transportDocumentNumber, ensMrn } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: getBaseUrl(),
        movementOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        },
        consignmentOverrides: { isControlledGoods: false, isGoodsCrossEUBorder: true, isSameContainer: false },
      })
    );

    await ics2NotificationFlow.authoriseForMovementUnlessMocked(ensMrn, transportDocumentNumber);

    await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData())
    );
  });
});
