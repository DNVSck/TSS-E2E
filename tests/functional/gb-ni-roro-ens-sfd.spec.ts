import { ReportLog } from '../../src/core/report/report-log';
import { getBaseUrl, test } from '../test-hooks';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../src/constant/type-of-movement-code-constant';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';
import { previousDocument } from '../../src/test-data/previous-document-data';
import { holderOfAuthorisation } from '../../src/test-data/holder-of-authorisation-data';
import { documentReference } from '../../src/test-data/document-reference-data';
import { DOCUMENT_CODE } from '../../src/constant/document-code-constant';
import { HAULIER_COMPANY_NAME } from '../../config/environment';
import { DOCUMENT_STATUS } from '../../src/constant/document-status-constant';
import { gmrData } from '../../src/test-data/gmr-data';


const TEST_CASE_ID = '2423';

test.describe('GB to NI RoRo Simplified Customs Declaration Process', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI RoRo Simplified Customs Declaration Process');
    // Agent represents the Haulier company before declaring on the Importer's
    // behalf — a server-side session state the journeys below then run under.
    await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
  });

  test('Verify ENS-SFD - RoRo (Accompanied) is created and submitted successfully', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration Accompanied');
    ReportLog.setTestCaseLink(TEST_CASE_ID);
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
      },
      consignmentOverrides: {
        headerPreviousDocuments: [
          previousDocument({ documentReference: '3XI352196303000-12345' })
        ],
        holdersOfAuthorisation: [
          holderOfAuthorisation()
        ],
      },
      goodsItemOverrides: {
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE.C512, documentStatus: undefined, documentReference: 'XISDE896458895023I20231019133850' }),
          documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: '0054037-0054047' }),
        ],
      },
    });

    await createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData());
  });

  test('Verify ENS-SFD - RoRo (Unaccompanied) is created and submitted successfully', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration UnAccompanied');
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
      },
      consignmentOverrides: {
        headerPreviousDocuments: [
          previousDocument({ documentReference: '5GB553202734852-09042025' })
        ],
        holdersOfAuthorisation: [
          holderOfAuthorisation()
        ],
      },
      goodsItemOverrides: {
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: '0054037-0054047' }),
          documentReference({ documentCode: DOCUMENT_CODE.C512, documentStatus: undefined, documentReference: 'XISDE896458895023I20231019133850' }),
        ],
      },
    });

    await createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData());
  });

});
