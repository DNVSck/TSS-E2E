import { ReportLog } from '../../../src/core/report/report-log';
import {
  CANCELLATION_REASON, containerIdentification, ensOnlyConsignment,
} from '../../../src/test-data/consignment-data';
import { test } from '../../base-test';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { ENS_ONLY_REASON } from '../../../src/constant/ens-only-reason-constant';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { IS_ISC2_MOCK, BASE_URL } from '../../../config/environment';
import { rejectedByIcs2 } from '../../../src/test-data/rejection-lever-data';
import { ensOnlyDeclaration } from '../../../src/test-data/ens-declaration-data';

const ENS_ONLY_ACCO = '2268';
const ENS_ONLY_UNACCO = '2269';
const ENS_ONLY_CONTAINER = '6658';
const ENS_ONLY_CANCEL_CONSIGNMENT_DRAFT = '6429';
const ENS_ONLY_CANCEL_MOVEMENT_DRAFT = '6486';
const ENS_ONLY_CANCEL_NEEDS_REASON = '6427';
const ENS_ONLY_CANCEL_CONSIGNMENT_TIR = '6430';
const ENS_ONLY_CANCEL_MOVEMENT_TIR = '6491';
const ENS_ONLY_CANCEL_MOVEMENT_NEEDS_REASON = '6468';
const ENS_ONLY_CANCEL_MOVEMENT_DISMISSED = '7099';
const ENS_ONLY_CANCEL_ONE_OF_TWO = '7100';
const ENS_ONLY_RESUBMIT_AFTER_ICS2 = '7101';

test.describe('GB to NI RoRo ENS-only Declaration Process - Agent Represents Trader', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo ENS-only Declaration Process');
  });

  test('Verify ENS Only - RoRo (Accompanied) is created and submitted successfully', { tag: ['@smoke', '@regression' , '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS-only - GB to NI RoRo Accompanied');
    reportTestCaseLink(ENS_ONLY_ACCO);
    await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: BASE_URL,
        movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED },
        consignmentOverrides: ensOnlyConsignment(),
      })
    );
  });

  test('Verify ENS Only - RoRo (Unaccompanied) is created and submitted successfully', { tag: ['@smoke', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS-only - GB to NI RoRo Unaccompanied');
    reportTestCaseLink(ENS_ONLY_UNACCO);
    await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: BASE_URL,
        movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED },
        consignmentOverrides: ensOnlyConsignment({
          ensOnlyReason: ENS_ONLY_REASON.EMPTY_VEHICLE,
        }),
      })
    );
  });

  test('Verify ENS Only - RoRo (Accompanied), goods item requires container details, is created and submitted successfully', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS-only - GB to NI RoRo Accompanied with a goods item declaring its own container');
    reportTestCaseLink(ENS_ONLY_CONTAINER);
    // Crossing the EU border with goods in DIFFERENT containers makes each goods item
    // declare its own container details.
    await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: BASE_URL,
        movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED },
        consignmentOverrides: ensOnlyConsignment({
          ensOnlyReason: ENS_ONLY_REASON.EIDR_WITH_OWN_AUTHORISATION,
          isGoodsCrossEUBorder: true,
          isSameContainer: false,
        }),
      })
    );
  });
});


test.describe('GB to NI RoRo ENS-only Declaration Process - Cancellation from draft', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo ENS-only Declaration Process');
  });

  test('Verify a "Draft" ENS consignment can be cancelled, and takes its movement with it', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftEnsDeclarationFlow, cancelEnsDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-only - cancel the consignment while it is still a draft');
    reportTestCaseLink(ENS_ONLY_CANCEL_CONSIGNMENT_DRAFT);

    await createDraftEnsDeclarationFlow.createDraftEnsDeclaration(ensOnlyDeclaration(testInfo, {}));
    await cancelEnsDeclarationFlow.cancelConsignmentAndVerifyDeclarationIsCancelled(CANCELLATION_REASON);
  });

  test('Verify a "Draft" movement can be cancelled, and takes its ENS consignment with it', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftEnsDeclarationFlow, cancelEnsDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-only - cancel the movement while it is still a draft');
    reportTestCaseLink(ENS_ONLY_CANCEL_MOVEMENT_DRAFT);

    await createDraftEnsDeclarationFlow.createDraftEnsDeclaration(ensOnlyDeclaration(testInfo, {}));
    await cancelEnsDeclarationFlow.cancelMovementAndVerifyDeclarationIsCancelled(CANCELLATION_REASON);
  });

  test('Verify a movement survives going back from its cancel screen', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftEnsDeclarationFlow, cancelEnsDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-only - open the movement cancel screen, go back, and the movement is untouched');
    reportTestCaseLink(ENS_ONLY_CANCEL_MOVEMENT_DISMISSED);

    await createDraftEnsDeclarationFlow.createDraftEnsDeclaration(ensOnlyDeclaration(testInfo, {}));
    await cancelEnsDeclarationFlow.verifyMovementCancellationCanBeDismissed();
  });

  test('Verify a movement cannot be cancelled without a reason, and survives the refusal', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftEnsDeclarationFlow, cancelEnsDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-only - the service refuses a movement cancellation with no reason');
    reportTestCaseLink(ENS_ONLY_CANCEL_MOVEMENT_NEEDS_REASON);

    await createDraftEnsDeclarationFlow.createDraftEnsDeclaration(ensOnlyDeclaration(testInfo, {}));
    await cancelEnsDeclarationFlow.verifyMovementCancellationExplainsScopeAndNeedsAReason();
  });

  test('Verify a consignment cannot be cancelled without a reason, and survives the refusal', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftEnsDeclarationFlow, cancelEnsDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-only - the service refuses a cancellation with no reason');
    reportTestCaseLink(ENS_ONLY_CANCEL_NEEDS_REASON);

    await createDraftEnsDeclarationFlow.createDraftEnsDeclaration(ensOnlyDeclaration(testInfo, {}));
    await cancelEnsDeclarationFlow.verifyCancellationNeedsAReason();
  });

  test('Verify cancelling one of two ENS consignments leaves the movement and the other consignment alone', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftEnsDeclarationFlow, addNewEnsConsignmentFlow, declarationAccessFlow, cancelEnsDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-only - cancelling one consignment of two stops at that consignment');
    reportTestCaseLink(ENS_ONLY_CANCEL_ONE_OF_TWO);

    await createDraftEnsDeclarationFlow.createDraftEnsDeclaration(ensOnlyDeclaration(testInfo, {}));
    const first = await declarationAccessFlow.locateEnsConsignmentRecords();

    await declarationAccessFlow.locateMovementHeader();
    await addNewEnsConsignmentFlow.addNewEnsConsignment(ensOnlyConsignment());
    const second = declarationAccessFlow.locateConsignmentHere();

    await cancelEnsDeclarationFlow.cancelOneConsignmentAndVerifyTheOtherSurvives({
      cancel: first.consignment,
      survives: second,
      reason: CANCELLATION_REASON,
    });
  });
});


test.describe('GB to NI RoRo ENS-only Declaration Process - Cancellation "Trader Input Required" after ICS2 hands it back', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.skip(IS_ISC2_MOCK, 'A mock ICS2 authorises the movement, so no rejection can be produced');

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo ENS-only Declaration Process');
  });

  test('Verify an ENS consignment in "Trader Input Required" by ICS2 can be cancelled instead of corrected', { tag: ['@regression', '@cancellation'] }, async ({
    createAndSubmitEnsDeclarationFlow, cancelEnsDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-only - ICS2 hands it back, and the trader cancels rather than correcting');
    reportTestCaseLink(ENS_ONLY_CANCEL_CONSIGNMENT_TIR);

    await createAndSubmitEnsDeclarationFlow.submitEnsDeclarationExpectingRejection(
      ensOnlyDeclaration(testInfo, rejectedByIcs2())
    );
    await cancelEnsDeclarationFlow.cancelConsignmentAndVerifyDeclarationIsCancelled(CANCELLATION_REASON);
  });

  test('Verify a movement whose ENS consignment was in "Trader Input Required" by ICS2 can be cancelled', { tag: ['@regression', '@cancellation'] }, async ({
    createAndSubmitEnsDeclarationFlow, cancelEnsDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-only - ICS2 hands it back, and the trader cancels the whole movement');
    reportTestCaseLink(ENS_ONLY_CANCEL_MOVEMENT_TIR);

    await createAndSubmitEnsDeclarationFlow.submitEnsDeclarationExpectingRejection(
      ensOnlyDeclaration(testInfo, rejectedByIcs2())
    );
    await cancelEnsDeclarationFlow.cancelMovementAndVerifyDeclarationIsCancelled(CANCELLATION_REASON);
  });
});


test.describe('GB to NI RoRo ENS-only Declaration Process - Resubmission after ICS2 hands it back', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.skip(IS_ISC2_MOCK, 'A mock ICS2 authorises the movement, so no rejection can be produced');

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo ENS-only Declaration Process');
  });

  test('Verify an ENS consignment in "Trader Input Required" by ICS2 can be corrected and resubmitted', { tag: ['@regression', '@resubmission'] }, async ({
    createAndSubmitEnsDeclarationFlow, resubmitDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-only - ICS2 hands it back, and the trader corrects the container and resubmits');
    reportTestCaseLink(ENS_ONLY_RESUBMIT_AFTER_ICS2);

    await createAndSubmitEnsDeclarationFlow.submitEnsDeclarationExpectingRejection(
      ensOnlyDeclaration(testInfo, rejectedByIcs2())
    );
    await resubmitDeclarationFlow.correctContainerAndResubmitEnsConsignment(containerIdentification());
  });
});
