import { ReportLog } from '../../../src/core/report/report-log';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { gmrData } from '../../../src/test-data/gmr-data';
import { ROUTE_ID_CONSTANT } from '../../../src/constant/routeId-constant';
import {
  GMR_MOVEMENT, sfdGmrJourney, immiGmrJourney, eidrGmrJourney,
} from '../../../src/test-data/gmr-journey-data';

const GMR_ENS_SFD_SMOKE = '6342';

test.describe('GB to NI RoRo GMR - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo GMR');
  });

  test('Verify a GMR on an ENS-SFD RoRo (Accompanied) movement is carried through to completed', { tag: ['@smoke', '@regression', '@happyPath'] }, async ({ raiseMovementForGmrFlow, createAndSubmitGmrFlow, gmrOverviewFlow, triggerGmrStatusThroughGvmsFlow }, testInfo) => {
    await ReportLog.setStory('GMR - GB to NI RoRo Accompanied - raised on an ENS-SFD movement');
    reportTestCaseLink(GMR_ENS_SFD_SMOKE);

    await raiseMovementForGmrFlow.raiseMovement({
      testInfo,
      url: getBaseUrl(),
      journey: sfdGmrJourney(GMR_MOVEMENT.ACCOMPANIED),
    });

    const gmrReference = await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData(
        {
          route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES,
          external_contacts_list: ['adam1.taylor@nifreight.co.uk', 'ledt1@nifreight.co.uk'],
        }
      ))
    );

    await ReportLog.step('Validate the GMR carries the movement transport', () =>
      gmrOverviewFlow.verifyTransportIdentity(GMR_MOVEMENT.ACCOMPANIED.isTrailerUnaccompanied)
    );

    await ReportLog.step('Check the GMR in through GVMS', () =>
      triggerGmrStatusThroughGvmsFlow.checkInGmr(gmrReference)
    );
    await ReportLog.step('Embark the GMR through GVMS', () =>
      triggerGmrStatusThroughGvmsFlow.embarkGmr(gmrReference)
    );
    await ReportLog.step('Complete the GMR through GVMS', () =>
      triggerGmrStatusThroughGvmsFlow.completeGmr(gmrReference)
    );
  });

  test('Verify a GMR on an ENS-IMMI RoRo (Unaccompanied) movement is held for inspection', { tag: ['@regression', '@happyPath'] }, async ({ raiseMovementForGmrFlow, createAndSubmitGmrFlow, gmrOverviewFlow, triggerGmrStatusThroughGvmsFlow }, testInfo) => {
    await ReportLog.setStory('GMR - GB to NI RoRo Unaccompanied - raised on an ENS-IMMI movement');

    await raiseMovementForGmrFlow.raiseMovement({
      testInfo,
      url: getBaseUrl(),
      journey: immiGmrJourney(GMR_MOVEMENT.UNACCOMPANIED),
    });

    const gmrReference = await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData(
        {
          route_id: ROUTE_ID_CONSTANT.GB_TO_NI.LIVERPOOL_WARRENPOINT_SEATRUCK_FERRIES,
        }
      ))
    );

    await ReportLog.step('Validate the GMR carries the movement transport', () =>
      gmrOverviewFlow.verifyTransportIdentity(GMR_MOVEMENT.UNACCOMPANIED.isTrailerUnaccompanied)
    );

    await ReportLog.step('Check the GMR in through GVMS', () =>
      triggerGmrStatusThroughGvmsFlow.checkInGmr(gmrReference)
    );
    await ReportLog.step('Embark the GMR through GVMS and hold it for inspection', () =>
      triggerGmrStatusThroughGvmsFlow.embarkGmrForInspection(gmrReference)
    );
    await ReportLog.step('Complete the GMR through GVMS', () =>
      triggerGmrStatusThroughGvmsFlow.completeGmr(gmrReference)
    );
  });

  test('Verify a GMR on an ENS-EIDR RoRo (Accompanied) movement is carried through to completed', { tag: ['@regression', '@happyPath'] }, async ({ raiseMovementForGmrFlow, createAndSubmitGmrFlow, gmrOverviewFlow, triggerGmrStatusThroughGvmsFlow }, testInfo) => {
    await ReportLog.setStory('GMR - GB to NI RoRo Accompanied - raised on an ENS-EIDR movement');

    await raiseMovementForGmrFlow.raiseMovement({
      testInfo,
      url: getBaseUrl(),
      journey: eidrGmrJourney(GMR_MOVEMENT.ACCOMPANIED),
    });

    const gmrReference = await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData(
        {
          route_id: ROUTE_ID_CONSTANT.GB_TO_NI.HEYSHAM_WARRENPOINT_SEATRUCK_FERRIES,
          external_contacts_list: ['adam3.taylor@nifreight.co.uk'],
        }
      ))
    );

    await ReportLog.step('Validate the GMR carries the movement transport', () =>
      gmrOverviewFlow.verifyTransportIdentity(GMR_MOVEMENT.ACCOMPANIED.isTrailerUnaccompanied)
    );

    await ReportLog.step('Check the GMR in through GVMS', () =>
      triggerGmrStatusThroughGvmsFlow.checkInGmr(gmrReference)
    );
    await ReportLog.step('Embark the GMR through GVMS', () =>
      triggerGmrStatusThroughGvmsFlow.embarkGmr(gmrReference)
    );
    await ReportLog.step('Complete the GMR through GVMS', () =>
      triggerGmrStatusThroughGvmsFlow.completeGmr(gmrReference)
    );
  });

  test('Verify a GMR can be raised on an ENS-IMMI RoRo (Accompanied) movement declared through the Trader API', { tag: ['@happyPath'] }, async ({ raiseMovementForGmrThroughApiFlow, createAndSubmitGmrFlow, gmrOverviewFlow }, testInfo) => {
    await ReportLog.setStory('GMR - GB to NI RoRo Accompanied - raised on a movement declared through the Trader API');

    await raiseMovementForGmrThroughApiFlow.raiseMovement({
      testInfo,
      url: getBaseUrl(),
      journey: immiGmrJourney(GMR_MOVEMENT.ACCOMPANIED),
    });

    await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData({ route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES })
      )
    );

    await ReportLog.step('Validate the GMR carries the movement transport', () =>
      gmrOverviewFlow.verifyTransportIdentity(GMR_MOVEMENT.ACCOMPANIED.isTrailerUnaccompanied)
    );
  });
});
