import { ReportLog } from '../../../src/core/report/report-log';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { getBaseUrl, test } from '../../test-hooks';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { previousDocument } from '../../../src/test-data/previous-document-data';
import { documentReference } from '../../../src/test-data/document-reference-data';
import { DOCUMENT_CODE } from '../../../src/constant/document-code-constant';
import { HAULIER_COMPANY_NAME } from '../../../config/environment';
import { DOCUMENT_STATUS } from '../../../src/constant/document-status-constant';
import { gmrData } from '../../../src/test-data/gmr-data';
import { ROUTE_ID_CONSTANT } from '../../../src/constant/routeId-constant';


const ENS_SFD_GMR = '4436';

test.describe('GB to NI RoRo Simplified Customs Declaration Process - Agent Represents Trader', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI RoRo Simplified Customs Declaration Process');
    // Agent represents the Haulier company before declaring on the Importer's
    // behalf — a server-side session state the journeys below then run under.
    await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
  });

  test('Verify ENS-SFD - RoRo (Accompanied) is created and submitted successfully', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration Accompanied');
    reportTestCaseLink(ENS_SFD_GMR);
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
      },
      goodsItemOverrides: {
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: '0054037-0054047' }),
        ],
      },
    });

    await createAndSubmitGmrFlow.addNewGmrAndSubmit(
      gmrData(
        {
          route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES,
          external_contacts_list: ['adam1.taylor@nifreight.co.uk', 'ledt1@nifreight.co.uk'],
        }
    ));
  });

  test('Verify ENS-SFD - RoRo (Unaccompanied) is created and submitted successfully', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration UnAccompanied');
    reportTestCaseLink(ENS_SFD_GMR);
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
      },
      goodsItemOverrides: {
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: '0054037-0054047' }),
        ],
      },
    });

    await createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData());
  });

});
