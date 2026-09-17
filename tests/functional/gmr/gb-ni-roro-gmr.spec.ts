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

  test('Verify a GMR on an ENS-SFD RoRo (Accompanied) movement is carried through to completed', { tag: ['@e2e', '@happyPath'] }, async ({ raiseMovementForGmrFlow, createAndSubmitGmrFlow, triggerGmrStatusThroughGvmsFlow }, testInfo) => {
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

    await triggerGmrStatusThroughGvmsFlow.carryGmrToCompleted(
      gmrReference, GMR_MOVEMENT.ACCOMPANIED
    );
  });

  test('Verify a GMR on an ENS-IMMI RoRo (Unaccompanied) movement is held for inspection', { tag: ['@e2e', '@happyPath'] }, async ({ raiseMovementForGmrFlow, createAndSubmitGmrFlow, triggerGmrStatusThroughGvmsFlow }, testInfo) => {
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

    await triggerGmrStatusThroughGvmsFlow.carryGmrToCompletedThroughInspection(
      gmrReference, GMR_MOVEMENT.UNACCOMPANIED
    );
  });

  test('Verify a GMR on an ENS-EIDR RoRo (Accompanied) movement is carried through to completed', { tag: ['@e2e', '@happyPath'] }, async ({ raiseMovementForGmrFlow, createAndSubmitGmrFlow, triggerGmrStatusThroughGvmsFlow }, testInfo) => {
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

    await triggerGmrStatusThroughGvmsFlow.carryGmrToCompleted(
      gmrReference, GMR_MOVEMENT.ACCOMPANIED
    );
  });

  test('Verify a GMR on an ENS-IMMI RoRo (Accompanied) movement declared through the Trader API is carried through to completed', { tag: ['@regression', '@happyPath', '@smoke'] }, async ({ raiseMovementForGmrThroughApiFlow, declarationAccessFlow, createAndSubmitGmrFlow, triggerGmrStatusThroughGvmsFlow }, testInfo) => {
    await ReportLog.setStory('GMR - GB to NI RoRo Accompanied - raised on an ENS-IMMI movement declared through the Trader API');

    // ENS-IMMI wizard skipped here - covered by
    // tests/functional/ens-integrated/gb-ni-roro-ens-immi.spec.ts
    const { consignmentReference } = await raiseMovementForGmrThroughApiFlow
      .raiseEligibleMovementThroughTraderApi({ journey: immiGmrJourney(GMR_MOVEMENT.ACCOMPANIED) });

    await declarationAccessFlow.openDeclarationInPortal(getBaseUrl(), testInfo, consignmentReference);

    const gmrReference = await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData({ route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES })
      )
    );

    await triggerGmrStatusThroughGvmsFlow.carryGmrToCompleted(
      gmrReference, GMR_MOVEMENT.ACCOMPANIED
    );
  });

  test('Verify a GMR on an ENS-EIDR RoRo (Unaccompanied) movement declared through the Trader API is carried through to completed', { tag: ['@regression', '@happyPath'] }, async ({ raiseMovementForGmrThroughApiFlow, declarationAccessFlow, createAndSubmitGmrFlow, triggerGmrStatusThroughGvmsFlow }, testInfo) => {
    await ReportLog.setStory('GMR - GB to NI RoRo Unaccompanied - raised on an ENS-EIDR movement declared through the Trader API');

    // ENS-EIDR wizard skipped here - covered by
    // tests/functional/ens-integrated/gb-ni-roro-ens-eidr.spec.ts
    const { consignmentReference } = await raiseMovementForGmrThroughApiFlow
      .raiseEligibleMovementThroughTraderApi({ journey: eidrGmrJourney(GMR_MOVEMENT.UNACCOMPANIED) });

    await declarationAccessFlow.openDeclarationInPortal(getBaseUrl(), testInfo, consignmentReference);

    const gmrReference = await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData({ route_id: ROUTE_ID_CONSTANT.GB_TO_NI.HEYSHAM_BELFAST_STENA_LINE })
      )
    );

    await triggerGmrStatusThroughGvmsFlow.carryGmrToCompleted(
      gmrReference, GMR_MOVEMENT.UNACCOMPANIED
    );
  });

  test('Verify a GMR on an ENS-SFD RoRo (Unaccompanied) movement declared through the Trader API is carried through to completed', { tag: ['@regression', '@happyPath'] }, async ({ raiseMovementForGmrThroughApiFlow, declarationAccessFlow, createAndSubmitGmrFlow, triggerGmrStatusThroughGvmsFlow }, testInfo) => {
    await ReportLog.setStory('GMR - GB to NI RoRo Unaccompanied - raised on an ENS-SFD movement declared through the Trader API');

    // ENS-SFD wizard skipped here - covered by
    // tests/functional/ens-integrated/gb-ni-roro-ens-sfd.spec.ts
    const { consignmentReference } = await raiseMovementForGmrThroughApiFlow
      .raiseEligibleMovementThroughTraderApi({ journey: sfdGmrJourney(GMR_MOVEMENT.UNACCOMPANIED) });

    await declarationAccessFlow.openDeclarationInPortal(getBaseUrl(), testInfo, consignmentReference);

    const gmrReference = await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData({ route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_BELFAST_STENA_LINE })
      )
    );

    await triggerGmrStatusThroughGvmsFlow.carryGmrToCompleted(
      gmrReference, GMR_MOVEMENT.UNACCOMPANIED
    );
  });

  test('Verify an Open GMR with Auto Update GMR enabled - ENS-SFD movement is resubmitted automatically when a second eligible consignment joins it', { tag: ['@regression', '@happyPath'] }, async ({
    raiseMovementForGmrThroughApiFlow, declarationAccessFlow, createAndSubmitGmrFlow, gmrOverviewFlow,
  }, testInfo) => {
    await ReportLog.setStory('GMR auto update - a second eligible ENS-SFD consignment resubmits the GMR');

    const autoUpdates = await raiseMovementForGmrThroughApiFlow.isGmrAutoUpdateAllowed();
    test.skip(!autoUpdates,
      'gmr_auto_update is off for this company, so no consignment ever resubmits its GMR'
    );

    const journey = sfdGmrJourney(GMR_MOVEMENT.ACCOMPANIED);

    // ENS-SFD wizard skipped here - covered by
    // tests/functional/ens-integrated/gb-ni-roro-ens-sfd.spec.ts
    const { movementLrn, consignmentReference } = await raiseMovementForGmrThroughApiFlow
      .raiseEligibleMovementThroughTraderApi({ journey });

    await declarationAccessFlow.openDeclarationInPortal(getBaseUrl(), testInfo, consignmentReference);

    await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData({ route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES })
      )
    );

    const lastUpdateBefore =
      await gmrOverviewFlow.waitForGvmsLastUpdate('before the second consignment');

    await raiseMovementForGmrThroughApiFlow
      .addEligibleConsignmentThroughTraderApi(movementLrn, journey);

    await gmrOverviewFlow.verifyGmrResubmitted(lastUpdateBefore);
  });

  test('Verify an Open GMR with Auto Update GMR enabled - ENS-IMMI movement is resubmitted automatically when a second eligible consignment joins it', { tag: ['@regression', '@happyPath'] }, async ({
    raiseMovementForGmrThroughApiFlow, declarationAccessFlow, createAndSubmitGmrFlow, gmrOverviewFlow,
  }, testInfo) => {
    await ReportLog.setStory('GMR auto update - a second eligible ENS-IMMI consignment resubmits the GMR');

    const autoUpdates = await raiseMovementForGmrThroughApiFlow.isGmrAutoUpdateAllowed();
    test.skip(!autoUpdates,
      'gmr_auto_update is off for this company, so no consignment ever resubmits its GMR'
    );

    const journey = immiGmrJourney(GMR_MOVEMENT.ACCOMPANIED);

    // ENS-IMMI wizard skipped here - covered by
    // tests/functional/ens-integrated/gb-ni-roro-ens-immi.spec.ts
    const { movementLrn, consignmentReference } = await raiseMovementForGmrThroughApiFlow
      .raiseEligibleMovementThroughTraderApi({ journey });

    await declarationAccessFlow.openDeclarationInPortal(getBaseUrl(), testInfo, consignmentReference);

    await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData({ route_id: ROUTE_ID_CONSTANT.GB_TO_NI.BIRKENHEAD_LIVERPOOL_BELFAST_STENA_LINE })
      )
    );

    const lastUpdateBefore =
      await gmrOverviewFlow.waitForGvmsLastUpdate('before the second consignment');

    await raiseMovementForGmrThroughApiFlow
      .addEligibleConsignmentThroughTraderApi(movementLrn, journey);

    await gmrOverviewFlow.verifyGmrResubmitted(lastUpdateBefore);
  });

  test('Verify an Open GMR with Auto Update GMR enabled - ENS-EIDR movement is resubmitted automatically when a second eligible consignment joins it', { tag: ['@regression', '@happyPath'] }, async ({
    raiseMovementForGmrThroughApiFlow, declarationAccessFlow, createAndSubmitGmrFlow, gmrOverviewFlow,
  }, testInfo) => {
    await ReportLog.setStory('GMR auto update - a second eligible ENS-EIDR consignment resubmits the GMR');

    const autoUpdates = await raiseMovementForGmrThroughApiFlow.isGmrAutoUpdateAllowed();
    test.skip(!autoUpdates,
      'gmr_auto_update is off for this company, so no consignment ever resubmits its GMR'
    );

    const journey = eidrGmrJourney(GMR_MOVEMENT.ACCOMPANIED);

    // ENS-EIDR wizard skipped here - covered by
    // tests/functional/ens-integrated/gb-ni-roro-ens-eidr.spec.ts
    const { movementLrn, consignmentReference } = await raiseMovementForGmrThroughApiFlow
      .raiseEligibleMovementThroughTraderApi({ journey });

    await declarationAccessFlow.openDeclarationInPortal(getBaseUrl(), testInfo, consignmentReference);

    await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData({ route_id: ROUTE_ID_CONSTANT.GB_TO_NI.HEYSHAM_WARRENPOINT_SEATRUCK_FERRIES })
      )
    );

    const lastUpdateBefore =
      await gmrOverviewFlow.waitForGvmsLastUpdate('before the second consignment');

    await raiseMovementForGmrThroughApiFlow
      .addEligibleConsignmentThroughTraderApi(movementLrn, journey);

    await gmrOverviewFlow.verifyGmrResubmitted(lastUpdateBefore);
  });
});
