import { PREVIOUS_DOCUMENT_TYPE } from '../../../src/constant/previous-document-type-constant';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { DOCUMENT_CODE } from '../../../src/constant/document-code-constant';
import { documentReference } from '../../../src/test-data/document-reference-data';
import { holderOfAuthorisation } from '../../../src/test-data/holder-of-authorisation-data';
import { previousDocument } from '../../../src/test-data/previous-document-data';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';
import { DOCUMENT_STATUS } from '../../../src/constant/document-status-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { HAULIER_COMPANY_NAME } from '../../../config/environment';
import { gmrData } from '../../../src/test-data/gmr-data';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';

const TGP_TC_ID = '2793';
const NO_TGP_TC_ID = '2809';

test.describe('GB to NI RoRo IMMI Pre-movement - Agent Represents Trader', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI RoRo IMMI - Pre-movement');
    await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
  });

  test('Verify ENS-IMMI - RoRo (Accompanied) with TGP is created and submitted successfully', { tag: ['@smoke'] }, async ({
    createAndSubmitEnsDeclarationFlow,
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Accompanied with TGP');
    reportTestCaseLink(TGP_TC_ID);
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED },
      consignmentOverrides: {
        useIMMI: true,
        headerPreviousDocuments: [
            previousDocument({ documentReference: '4GBXI553202734852-20240501' })
        ],
        holdersOfAuthorisation: [
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME, roleId: 'XI896458895023' })
        ],
      },
      goodsItemOverrides: {
        useTGP: true,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
        // "1UKI" is not inputted by user, but it is automatically added by system inside generated IMMI Consignment.
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE.C672,   documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XI896458895023' }),
          documentReference({ documentCode: DOCUMENT_CODE.N705,   documentStatus: DOCUMENT_STATUS.AE, documentReference: '0054047' }),
        ],
        previousDocuments: [
           previousDocument({ documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355, documentReference: '24GB34F7Y1O2CX8PT4' }),
        ],
      },
      
    });

  });

  test('Verify ENS-IMMI - RoRo (Unaccompanied) without TGP is created and submitted successfully', { tag: ['@smoke'] }, async ({
    createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Unaccompanied without TGP');
    reportTestCaseLink(NO_TGP_TC_ID);
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED },
      consignmentOverrides: {
        useIMMI: true,
        headerPreviousDocuments: [
            previousDocument({ documentReference: '4GBXI553202734852-20240501' })
        ],
        holdersOfAuthorisation: [
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME, roleId: 'XI896458895023' })
        ],
      },
      goodsItemOverrides: {
        useTGP: false,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
        // "1UKI" is inputted by user, checking the code list and input manually step.
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE['1UKI'], documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XIUKIM89645889502320240124160138' }),
          documentReference({ documentCode: DOCUMENT_CODE.C672,   documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XI896458895023' }),
          documentReference({ documentCode: DOCUMENT_CODE.N705,   documentStatus: DOCUMENT_STATUS.AE, documentReference: '0054047' }),
        ],
         previousDocuments: [
           previousDocument({ documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355, documentReference: '24GB34F7Y1O2CX8PT4' }),
        ],
      },
    });

    await createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData());
  });

});
