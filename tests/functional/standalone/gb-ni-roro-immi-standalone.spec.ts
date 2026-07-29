import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME } from '../../../config/environment';
import { previousDocument } from '../../../src/test-data/previous-document-data';
import { documentReference } from '../../../src/test-data/document-reference-data';
import { DOCUMENT_CODE } from '../../../src/constant/document-code-constant';
import { DOCUMENT_STATUS } from '../../../src/constant/document-status-constant';
import { PREVIOUS_DOCUMENT_TYPE } from '../../../src/constant/previous-document-type-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';

test.describe('GB to NI RoRo IMMI Standalone Declaration Process - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI IMMI Standalone Declaration Process');
    // The agent represents the importer, which is why the journey shows the
    // "Representation information" screen.
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct is created and submitted successfully', { tag: ['@smoke' , '@regression' , '@e2e'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct');
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: REPRESENTATION_TYPE.DIRECT,
        headerPreviousDocuments: [
          previousDocument({ documentReference: '4GBXI553202734852-20240501' }),
        ],
      },
      goodsItemOverrides: {
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE['1UKI'], documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XIUKIM15045448908220240124160138' }),
          documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XI896458895023' }),
          documentReference({ documentCode: DOCUMENT_CODE.N705, documentStatus: DOCUMENT_STATUS.AE, documentReference: '0054047' })
        ],
        previousDocuments: [
          previousDocument({ documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355, documentReference: '24GB34F7Y1O2CX8PT4' }),
        ],
      },
    });
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Unaccompanied) - Indirect is created and submitted successfully', { tag: ['@smoke', '@regression', '@e2e'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Unaccompanied) - Indirect');
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        representationType: REPRESENTATION_TYPE.INDIRECT,
        headerPreviousDocuments: [
          previousDocument({ documentReference: '4GBXI553202734852-20240501' }),
        ],
      },
      goodsItemOverrides: {
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE['1UKI'], documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XIUKIM15045448908220240124160138' }),
          documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XI896458895023' }),
          documentReference({ documentCode: DOCUMENT_CODE.N705, documentStatus: DOCUMENT_STATUS.AE, documentReference: '0054047' }),
        ],
        previousDocuments: [
          previousDocument({ documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355, documentReference: '24GB34F7Y1O2CX8PT4' }),
        ],
      },
    });
  });
});

test.describe('GB to NI RoRo IMMI Standalone Declaration Process - Importer Declare by themself', () => {
  // The importer signs in as their OWN company, so there is NO representation:
  // no representTrader here, and representationType is left undefined so the flow
  // skips the "Representation information" screen.
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI IMMI Standalone Declaration Process');
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully', { tag: ['@regression' , '@e2e'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself');
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
        headerPreviousDocuments: [
          previousDocument({ documentReference: '4GBXI553202734852-20240501' }),
        ],
      },
      goodsItemOverrides: {
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE['1UKI'], documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XIUKIM15045448908220240124160138' }),
          documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XI896458895023' }),
          documentReference({ documentCode: DOCUMENT_CODE.N705, documentStatus: DOCUMENT_STATUS.AE, documentReference: '0054047' }),
        ],
        previousDocuments: [
          previousDocument({ documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355, documentReference: '24GB34F7Y1O2CX8PT4' }),
        ],
      },
    });
  });
});
