import { ReportLog } from '../../../src/core/report/report-log';
import { getBaseUrl, test } from '../../test-hooks';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME, IMPORTER_IPO, IMPORTER_CWP, IMPORTER_EXW, IMPORTER_UKIMS } from '../../../config/environment';
import { immiStandaloneGoodsItem } from '../../../src/test-data/immi-standalone-goods-item-data';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { TGP_RECORD } from '../../../src/test-data/tgp-record-data';
import { holderOfAuthorisation } from '../../../src/test-data/holder-of-authorisation-data';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';
import { PROCEDURE_CODES } from '../../../src/constant/procedure-codes-constant';
import { documentReference } from '../../../src/test-data/document-reference-data';
import { DOCUMENT_CODE } from '../../../src/constant/document-code-constant';
import { DOCUMENT_STATUS } from '../../../src/constant/document-status-constant';
import { additionalInformation } from '../../../src/test-data/additional-information-data';
import { previousDocument } from '../../../src/test-data/previous-document-data';
import { PREVIOUS_DOCUMENT_TYPE } from '../../../src/constant/previous-document-type-constant';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { inwardProcessingLocationOfGoods, locationOfGoodsOfOther } from '../../../src/helper/location-of-goods-helper';

const IMMI_PRELODGED = '4442';
const IMMI_ARRIVED = '4443';

test.describe('GB to NI RoRo IMMI Standalone Declaration Process - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI IMMI Standalone Declaration Process');
    // The agent represents the importer, which is why the journey shows the
    // "Representation information" screen.
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct without TGP is created and submitted successfully', { tag: ['@smoke' , '@regression' , '@e2e', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct without TGP');
    reportTestCaseLink(IMMI_PRELODGED);
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: REPRESENTATION_TYPE.DIRECT,
      },
      goodsItemOverrides: immiStandaloneGoodsItem(
        {
          procedureCode: PROCEDURE_CODES.FREE_CIRC_WITH_EXCISE_WAREHOUSE_0700,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
          supplementaryUnits: '12',
          documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE['1UKI'], documentStatus: DOCUMENT_STATUS.AC, documentReference: IMPORTER_UKIMS }),
          documentReference({ documentCode: DOCUMENT_CODE.N730, documentStatus: DOCUMENT_STATUS.AE, documentReference: '0054047' }),
        ],
        }
      ),
    });
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct with TGP is created and submitted successfully', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct with TGP');
    reportTestCaseLink(IMMI_PRELODGED);
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: REPRESENTATION_TYPE.DIRECT,
      },
      // The commodity code, goods description and country of origin are NOT declared
      // here: the TGP record supplies them and the app skips those screens. They are
      // asserted on the goods-item overview instead.
      goodsItemOverrides: immiStandaloneGoodsItem({
        useTGP: true,
        tgpRecord: TGP_RECORD.MACHINERY_TGP456,
      }),
    });
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Unaccompanied) - Indirect is created and submitted successfully', { tag: ['@smoke', '@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Unaccompanied) - Indirect');
    reportTestCaseLink(IMMI_PRELODGED);
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        representationType: REPRESENTATION_TYPE.INDIRECT,
      },
      goodsItemOverrides: immiStandaloneGoodsItem({
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
      }),
    });
  });


  test('Verify IMMI Standalone - Arrived - RoRo (Accompanied) - Direct is created and submitted successfully', { tag: ['@regression', '@e2e', '@happyPath', '@smoke'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Accompanied) - Direct - 4000 - 1LG');
    reportTestCaseLink(IMMI_ARRIVED);
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: REPRESENTATION_TYPE.DIRECT,
      },
      goodsItemOverrides: immiStandaloneGoodsItem({
        procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_NON_EXCISE_1LG,
        additionalInformations: [
          additionalInformation({ code: 'GEN45', description: '12345' }),
        ],
      })
    });
  });

    test('Verify IMMI Standalone - Arrived - RoRo (Accompanied) - Direct with Inward Processing is created and submitted successfully', { tag: ['@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Accompanied) - Direct with Inward Processing - 4051 - 1EN');
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: REPRESENTATION_TYPE.DIRECT,
        // The goods sit at the IP authorisation holder's premises, not at a listed
        // port, so the arrived branch's "Location of Goods" names them: the prefix
        // followed by the same IPO authorisation the holder and C601 below carry.
        locationOfGoods: inwardProcessingLocationOfGoods(IMPORTER_IPO),
        holdersOfAuthorisation: [
          holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.INWARD_PROCESSING_IPO }),
        ],
      },
      // Procedure 4051 releases goods to free circulation AFTER inward processing, so
      // the whole item hangs together around one IP authorisation: the IPO holder above,
      // the C601 document that names it, and the 10200 additional information that
      // repeats its reference.
      goodsItemOverrides: immiStandaloneGoodsItem({
        procedureCode: PROCEDURE_CODES.FREE_CIRC_AFTER_IP_4051,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,

        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE.N730, documentStatus: DOCUMENT_STATUS.AC,   documentReference: '0054039' }),
          documentReference({ documentCode: DOCUMENT_CODE.C601, documentStatus: undefined,            documentReference: IMPORTER_IPO }),
          documentReference({ documentCode: DOCUMENT_CODE.C669, documentStatus: DOCUMENT_STATUS.AC,   documentReference: '0054037' }),
          documentReference({ documentCode: DOCUMENT_CODE.C670, documentStatus: DOCUMENT_STATUS.AC,   documentReference: 'GBIWP12345' }),
        ],

        additionalInformations: [
          // 10200 restates the IP authorisation from the C601 above, prefixed with "IP".
          additionalInformation({ code: '10200', description: `IP${IMPORTER_IPO}` }),
          additionalInformation({ code: 'GEN45', description: '12345' }),
        ],

        // Declared on the "Additional procedure codes" tab, on TOP of the 1EN chosen
        // during the goods declaration above.
        additionalProcedureCodes: [
          ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1SP,
          ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1NR,
        ],
      })
    });
  });

  test('Verify IMMI Standalone - Arrived - RoRo (Unaccompanied) - Indirect is created and submitted successfully', { tag: ['@smoke', '@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Unaccompanied) - Indirect - 0751 - 1EL');
    reportTestCaseLink(IMMI_ARRIVED);
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
       consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        representationType: REPRESENTATION_TYPE.INDIRECT,
        holdersOfAuthorisation: [
          holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.INWARD_PROCESSING_IPO }),
          holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW }),
        ],
      },

      goodsItemOverrides: immiStandaloneGoodsItem({
        procedureCode: PROCEDURE_CODES.FREE_CIRC_EXCISE_AFTER_IP_0751,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
        supplementaryUnits: '12',
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE.N760, documentStatus: DOCUMENT_STATUS.AC,   documentReference: '0054039' }),
          documentReference({ documentCode: DOCUMENT_CODE.C601, documentStatus: undefined,            documentReference: IMPORTER_IPO }),
          documentReference({ documentCode: DOCUMENT_CODE.C676, documentStatus: undefined,            documentReference: IMPORTER_EXW}),
        ],
        additionalInformations: [
          // 10200 restates the IP authorisation from the C601 above, prefixed with "IP".
          additionalInformation({ code: 'ECONR', description: 'Reg No. 1234567890' }),
          additionalInformation({ code: 'GEN45', description: '10200' }),
        ],

        // Declared on the "Additional procedure codes" tab, on TOP of the 1EN chosen
        // during the goods declaration above.
        additionalProcedureCodes: [
          ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1SP,
          ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1NR,
          ADDITIONAL_PROCEDURE_CODES.EXCISE_MOVEMENT_DUTY_SUSPENSION_F06,
        ],
      })
    });
  });

  test('Verify IMMI Standalone - Arrived - RoRo (Accompanied) - Direct with TGP is created and submitted successfully', { tag: ['@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Accompanied) - Direct with TGP - 4071 - 1LG');
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: REPRESENTATION_TYPE.DIRECT,
        headerPreviousDocuments: [
          previousDocument({ documentType: PREVIOUS_DOCUMENT_TYPE.DCR, documentReference: '4GBXI896458895015-0611EC04' }),
          previousDocument({ documentType: PREVIOUS_DOCUMENT_TYPE.DCS, documentReference: 'DEF' }),
          previousDocument({ documentType: PREVIOUS_DOCUMENT_TYPE.MRN, documentReference: '25GBCDS123456789B1' }),
        ],
        holdersOfAuthorisation: [
          holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.PRIVATE_CUSTOMS_WAREHOUSE_CWP }),
        ],
      },

      goodsItemOverrides: immiStandaloneGoodsItem({
        useTGP: true,
        tgpRecord: TGP_RECORD.TEXTILES_TGP123,
        procedureCode: PROCEDURE_CODES.FREE_CIRC_FROM_CW_4071,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_NON_EXCISE_1LG,
        supplementaryUnits: '2',
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE.N760, documentStatus: DOCUMENT_STATUS.AC,   documentReference: '0054039' }),
          documentReference({ documentCode: DOCUMENT_CODE.C601, documentStatus: undefined,            documentReference: IMPORTER_IPO }),
          documentReference({ documentCode: DOCUMENT_CODE.C517, documentStatus: undefined,            documentReference: IMPORTER_CWP }),
        ],

        additionalProcedureCodes: [
          ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1SP,
          ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1NR,
        ],
      }),
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

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully', { tag: ['@regression' , '@e2e', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself');
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
      },
      goodsItemOverrides: immiStandaloneGoodsItem(),
    });
  });

   test('Verify IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully', { tag: ['@regression' , '@e2e', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself');
    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: {
        isPreLodged: false,
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
        locationOfGoods: locationOfGoodsOfOther(IMPORTER_CWP),
        holdersOfAuthorisation: [
          holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW }),
          holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.PRIVATE_CUSTOMS_WAREHOUSE_CWP }),
        ],
      },

      goodsItemOverrides: immiStandaloneGoodsItem({
        procedureCode: PROCEDURE_CODES.FREE_CIRC_EXCISE_FROM_CW_0771,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
        supplementaryUnits: '2',
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE.N760, documentStatus: DOCUMENT_STATUS.AC,   documentReference: '0054039' }),
          documentReference({ documentCode: DOCUMENT_CODE.C517, documentStatus: undefined,   documentReference: IMPORTER_CWP }),
          documentReference({ documentCode: DOCUMENT_CODE.C676, documentStatus: undefined,   documentReference: IMPORTER_EXW}),
          documentReference({ documentCode: DOCUMENT_CODE.Y923, documentStatus: undefined,   documentReference: 'Excluded product', documentReason: 'Excluded product' }),
        ],

        additionalInformations: [
          additionalInformation({ code: 'ECONR', description: 'Reg No. 1234567890' })
        ],
        additionalProcedureCodes: [
          ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1SP,
          ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1NR,
        ],
      })
    });
  });
  
});
