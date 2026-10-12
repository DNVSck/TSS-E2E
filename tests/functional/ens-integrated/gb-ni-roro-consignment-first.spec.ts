import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import {
  ensOnlyDeclaration, ensSfdDeclaration, ensEidrDeclaration, ensImmiDeclaration,
} from '../../../src/test-data/ens-declaration-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { UNKNOWN_CONSIGNMENT_REFERENCE } from '../../../src/test-data/consignment-data';

const CONSIGNMENT_FIRST_ENS_ONLY = '7133';
const CONSIGNMENT_FIRST_ENS_SFD = '7134';
const CONSIGNMENT_FIRST_ENS_IMMI = '7135';
const CONSIGNMENT_FIRST_ENS_EIDR = '7136';
const CONSIGNMENT_FIRST_LRN_NOT_FOUND = '4508';
const CONSIGNMENT_FIRST_LRN_ALREADY_LINKED = '4509';

test.describe('GB to NI RoRo Consignment First Declaration Process - Agent declares the consignment before the movement', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo Consignment First Declaration Process');
  });

  test('Verify an ENS-only consignment declared first can be linked to a movement and submitted', { tag: ['@regression', '@consignmentFirst', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('Consignment first - ENS-only consignment linked to a RoRo Accompanied movement');
    reportTestCaseLink(CONSIGNMENT_FIRST_ENS_ONLY);
    await ReportLog.step('Create the consignment, link it to a movement and submit', () =>
      createAndSubmitEnsDeclarationFlow.completeConsignmentFirstFlow(ensOnlyDeclaration(testInfo, {}))
    );
  });

  test('Verify an ENS-SFD consignment declared first can be linked to a movement and submitted (4000-000)', { tag: ['@regression', '@consignmentFirst', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('Consignment first - ENS-SFD consignment linked to a RoRo Accompanied movement');
    reportTestCaseLink(CONSIGNMENT_FIRST_ENS_SFD);
    await ReportLog.step('Create the consignment, link it to a movement and submit', () =>
      createAndSubmitEnsDeclarationFlow.completeConsignmentFirstFlow(ensSfdDeclaration(testInfo, {}))
    );
  });

  test('Verify an ENS-EIDR consignment declared first can be linked to a movement and submitted (4000-000)', { tag: ['@regression', '@consignmentFirst', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('Consignment first - ENS-EIDR consignment linked to a RoRo Accompanied movement');
    reportTestCaseLink(CONSIGNMENT_FIRST_ENS_EIDR);
    await ReportLog.step('Create the consignment, link it to a movement and submit', () =>
      createAndSubmitEnsDeclarationFlow.completeConsignmentFirstFlow(ensEidrDeclaration(testInfo))
    );
  });

  test('Verify an ENS-IMMI consignment declared first can be linked to a movement and submitted (4000-1SG)', { tag: ['@regression', '@consignmentFirst', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('Consignment first - ENS-IMMI consignment linked to a RoRo Accompanied movement');
    reportTestCaseLink(CONSIGNMENT_FIRST_ENS_IMMI);
    await ReportLog.step('Create the consignment, link it to a movement and submit', () =>
      createAndSubmitEnsDeclarationFlow.completeConsignmentFirstFlow(ensImmiDeclaration(testInfo))
    );
  });

  test('Verify System Displays Clear Error Message When LRN is Not Found', { tag: ['@regression', '@consignmentFirst'] }, async ({
    createDraftEnsDeclarationFlow, addNewEnsConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('Consignment first - linking a consignment that does not exist is refused');
    reportTestCaseLink(CONSIGNMENT_FIRST_LRN_NOT_FOUND);

    await createDraftEnsDeclarationFlow.createDraftMovement(ensOnlyDeclaration(testInfo, {}));
    await addNewEnsConsignmentFlow.verifyAssociationRefused(UNKNOWN_CONSIGNMENT_REFERENCE, 'linkConsignment.lrnNotFound');
  });

  test('Verify System Displays Clear Error Message When LRN is Already Linked', { tag: ['@regression', '@consignmentFirst'] }, async ({
    createDraftConsignmentFirstFlow, createDraftEnsDeclarationFlow, addNewEnsConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('Consignment first - linking a consignment already linked to another movement is refused');
    reportTestCaseLink(CONSIGNMENT_FIRST_LRN_ALREADY_LINKED);

    const { consignmentReference } =
      await createDraftConsignmentFirstFlow.createDraftConsignmentFirstDeclaration(ensOnlyDeclaration(testInfo, {}));
    await createDraftEnsDeclarationFlow.createDraftMovement(ensOnlyDeclaration(testInfo, {}));
    await addNewEnsConsignmentFlow.verifyAssociationRefused(consignmentReference, 'linkConsignment.alreadyLinked');
  });
});
