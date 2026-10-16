import { ADDITIONAL_INFORMATION_CODE } from '../../../src/constant/additional-information-constant';
import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { IMPORTER_COMPANY_NAME, IMPORTER_IPO, IMPORTER_CWP, IMPORTER_EXW, IMPORTER_UKIMS, BASE_URL } from '../../../config/environment';
import {
  immiStandaloneGoodsItem, immiStandaloneTransportDocument, IMMI_STANDALONE_COMMODITY_CODE,
} from '../../../src/test-data/immi-standalone-goods-item-data';
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
import { inwardProcessingAuthorisationNumber } from '../../../src/helper/authorisation-helper';
import { previousDocument } from '../../../src/test-data/previous-document-data';
import { PREVIOUS_DOCUMENT_TYPE } from '../../../src/constant/previous-document-type-constant';
import { CANCELLATION_REASON } from '../../../src/test-data/consignment-data';
import { immiStandaloneRejectedByCds } from '../../../src/test-data/rejection-lever-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { locationOfGoodsOfOther, inwardProcessingLocationOfGoods } from '../../../src/helper/location-of-goods-helper';
import { PORT_OF_ARRIVAL } from '../../../src/constant/port-of-arrival-constant';
import { WAREHOUSE_TYPE } from '../../../src/constant/warehouse-type-constant';

const IMMI_PRELODGED = '4442';
const IMMI_ARRIVED = '4443';
const IMMI_ARRIVED_4051_1EN ='4913'
const IMMI_ARRIVED_4071_1LG ='4914'
const IMMI_PRELODGED_4000_1SG ='4916'
const IMMI_PRELODGED_TGP_4000_1SG ='4917'
const IMMI_ARRIVED_0771_1EL ='4918'
const IMMI_ARRIVED_TGP_4000_1SG ='4919'
const IMMI_NIRMS = '4912'
const IMMI_STANDALONE_CANCELLED = '3039';
const IMMI_STANDALONE_RESUBMIT = '3027';
const IMMI_STANDALONE_CANCEL_NEEDS_REASON = '7105';

test.describe('GB to NI RoRo IMMI Standalone Declaration Process - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI IMMI Standalone Declaration Process');
    // The agent represents the importer, which is why the journey shows the
    // "Representation information" screen.
    await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct without TGP is created and submitted successfully (0700-1EL)', { tag: ['@smoke' , '@regression' , '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Direct without TGP');
    reportTestCaseLink(IMMI_PRELODGED);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: REPRESENTATION_TYPE.DIRECT,
          holdersOfAuthorisation: [
              holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW })
          ],
        },
        goodsItemOverrides: immiStandaloneGoodsItem(
          {
            procedureCode: PROCEDURE_CODES.FREE_CIRC_WITH_EXCISE_WAREHOUSE_0700,
            additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
            commodityCode: IMMI_STANDALONE_COMMODITY_CODE.EIGHT_DIGIT,
            documentReferences: [
              documentReference({ documentCode: DOCUMENT_CODE.C676, documentStatus: undefined,          documentReference: IMPORTER_EXW}),
              documentReference({ documentCode: DOCUMENT_CODE.N730, documentStatus: DOCUMENT_STATUS.AE, documentReference: '0054047' }),
            ],
            additionalInformations: [
              additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.ECONR, description: 'Reg No. 1234567890' }),
            ],
            additionalProcedureCodes: [
              ADDITIONAL_PROCEDURE_CODES.EXCISE_MOVEMENT_DUTY_SUSPENSION_F06,
            ],
          }
        ),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Unaccompanied) - Indirect is created and submitted successfully (4000-1EN)', { tag: ['@smoke', '@regression', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Unaccompanied) - Indirect');
    reportTestCaseLink(IMMI_PRELODGED);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
          representationType: REPRESENTATION_TYPE.INDIRECT,
        },
        goodsItemOverrides: immiStandaloneGoodsItem({
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
          commodityCode: IMMI_STANDALONE_COMMODITY_CODE.EIGHT_DIGIT,
        }),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Arrived - RoRo (Accompanied) - Direct is created and submitted successfully (4000-1LG)', { tag: ['@regression', '@happyPath', '@smoke'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Accompanied) - Direct - 4000 - 1LG');
    reportTestCaseLink(IMMI_ARRIVED);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          isPreLodged: false,
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_GVMS_PORT,
          representationType: REPRESENTATION_TYPE.DIRECT,
        },
        goodsItemOverrides: immiStandaloneGoodsItem({
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_NON_EXCISE_1LG,
          commodityCode: IMMI_STANDALONE_COMMODITY_CODE.EIGHT_DIGIT,
          additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN45, description: '12345' }),
          ],
        })
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Arrived - RoRo (Unaccompanied) - Indirect is created and submitted successfully (0751-1EL)', { tag: ['@smoke', '@regression', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Unaccompanied) - Indirect - 0751 - 1EL');
    reportTestCaseLink(IMMI_ARRIVED);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
         consignmentOverrides: {
          isPreLodged: false,
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
          representationType: REPRESENTATION_TYPE.INDIRECT,
          locationOfGoods: locationOfGoodsOfOther(IMPORTER_IPO),
          holdersOfAuthorisation: [
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.INWARD_PROCESSING_IPO }),
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW }),
          ],
        },
  
        goodsItemOverrides: immiStandaloneGoodsItem({
          procedureCode: PROCEDURE_CODES.FREE_CIRC_EXCISE_AFTER_IP_0751,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
          commodityCode: IMMI_STANDALONE_COMMODITY_CODE.EIGHT_DIGIT,
          supplementaryUnits: '12',
          documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE.N760, documentStatus: DOCUMENT_STATUS.AC,   documentReference: '0054039' }),
            documentReference({ documentCode: DOCUMENT_CODE.C601, documentStatus: undefined,            documentReference: IMPORTER_IPO }),
            documentReference({ documentCode: DOCUMENT_CODE.C676, documentStatus: undefined,            documentReference: IMPORTER_EXW}),
          ],
          additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.ECONR, description: 'Reg No. 1234567890' }),
            // 10200 restates the IP authorisation the C601 above cites, without the
            // country the document keeps - see inwardProcessingAuthorisationNumber.
            additionalInformation({
              code: ADDITIONAL_INFORMATION_CODE.INWARD_PROCESSING_AUTHORISATION_10200,
              description: inwardProcessingAuthorisationNumber(IMPORTER_IPO),
            }),
          ],
  
          // Declared on the "Additional procedure codes" tab, on TOP of the 1EN chosen
          // during the goods declaration above.
          additionalProcedureCodes: [
            ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1SP,
            ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1NR,
          ],
        })
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
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

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (4000-1SG)', { tag: ['@regression' , '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself');
    reportTestCaseLink(IMMI_PRELODGED_4000_1SG);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
        },
  
        goodsItemOverrides: immiStandaloneGoodsItem({
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
        }),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself with TGP is created and submitted successfully (4000-1SG)', { tag: ['@regression' , '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself with TGP');
    reportTestCaseLink(IMMI_PRELODGED_TGP_4000_1SG);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
        },
        goodsItemOverrides: immiStandaloneGoodsItem({
          useTGP: true,
          tgpRecord: TGP_RECORD.MACHINERY_TGP456,
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
        }),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

   test('Verify IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself is created and submitted successfully (0771-1EL)', { tag: ['@regression' , '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself');
    reportTestCaseLink(IMMI_ARRIVED_0771_1EL);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
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
          commodityCode: IMMI_STANDALONE_COMMODITY_CODE.EIGHT_DIGIT,
          supplementaryUnits: '2',
          documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE.N760, documentStatus: DOCUMENT_STATUS.AC,   documentReference: '0054039' }),
            documentReference({ documentCode: DOCUMENT_CODE.C517, documentStatus: undefined,   documentReference: IMPORTER_CWP }),
            documentReference({ documentCode: DOCUMENT_CODE.C676, documentStatus: undefined,   documentReference: IMPORTER_EXW}),
            documentReference({ documentCode: DOCUMENT_CODE.Y923, documentStatus: undefined,   documentReference: 'Excluded product', documentReason: 'Excluded product' }),
          ],
  
          additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.ECONR, description: 'Reg No. 1234567890' })
          ],
          additionalProcedureCodes: [
            ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1SP,
            ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1NR,
          ],
        })
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself with TGP is created and submitted successfully (4000-1SG)', { tag: ['@regression' , '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself with TGP');
    reportTestCaseLink(IMMI_ARRIVED_TGP_4000_1SG);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          isPreLodged: false,
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_GVMS_PORT,
        },
        goodsItemOverrides: immiStandaloneGoodsItem({
          useTGP: true,
          tgpRecord: TGP_RECORD.MACHINERY_TGP456,
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
        }),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself with TGP is created and submitted successfully (4000-1LG)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself with TGP - 4000 - 1LG');
    reportTestCaseLink(IMMI_PRELODGED);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
        },
        goodsItemOverrides: immiStandaloneGoodsItem({
          useTGP: true,
          tgpRecord: TGP_RECORD.TEXTILES_TGP123,
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_NON_EXCISE_1LG,
        }),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Unaccompanied) - Importer Declare by themself with TGP and excise warehouse is created and submitted successfully (0700-1EL)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Unaccompanied) - Importer Declare by themself with TGP and excise warehouse - 0700 - 1EL');
    reportTestCaseLink(IMMI_PRELODGED);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
          representationType: undefined,
          holdersOfAuthorisation: [
              holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW })
          ],
        },

        goodsItemOverrides: immiStandaloneGoodsItem({
          useTGP: true,
          tgpRecord: TGP_RECORD.MACHINERY_TGP456,
          procedureCode: PROCEDURE_CODES.FREE_CIRC_WITH_EXCISE_WAREHOUSE_0700,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
          documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE['1UKI'], documentStatus: DOCUMENT_STATUS.AC, documentReference: IMPORTER_UKIMS }),
            documentReference({ documentCode: DOCUMENT_CODE.C676, documentStatus: undefined,            documentReference: IMPORTER_EXW }),
            documentReference({ documentCode: DOCUMENT_CODE.N730, documentStatus: DOCUMENT_STATUS.AE, documentReference: '0054047' }),
          ],
           additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.ECONR, description: 'Reg No. 1234567890' })
          ],
          additionalProcedureCodes: [
            ADDITIONAL_PROCEDURE_CODES.EXCISE_MOVEMENT_DUTY_SUSPENSION_F06,
          ],
        }),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

    test('Verify IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself with Inward Processing is created and submitted successfully (4051-1EN)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself with Inward Processing - 4051 - 1EN');
    reportTestCaseLink(IMMI_ARRIVED_4051_1EN);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          isPreLodged: false,
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
          locationOfGoods: inwardProcessingLocationOfGoods(IMPORTER_IPO),
          holdersOfAuthorisation: [
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.INWARD_PROCESSING_IPO }),
          ],
        },
  
        goodsItemOverrides: immiStandaloneGoodsItem({
          procedureCode: PROCEDURE_CODES.FREE_CIRC_AFTER_IP_4051,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
          commodityCode: IMMI_STANDALONE_COMMODITY_CODE.EIGHT_DIGIT,
  
          documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE.N730, documentStatus: DOCUMENT_STATUS.AC,   documentReference: '0054039' }),
            documentReference({ documentCode: DOCUMENT_CODE.C601, documentStatus: undefined,            documentReference: IMPORTER_IPO }),
            documentReference({ documentCode: DOCUMENT_CODE.C669, documentStatus: DOCUMENT_STATUS.AC,   documentReference: '0054037' }),
            documentReference({ documentCode: DOCUMENT_CODE.C670, documentStatus: DOCUMENT_STATUS.AC,   documentReference: 'GBIWP12345' }),
          ],
  
          additionalInformations: [
            // 10200 restates the IP authorisation from the C601 above, prefixed with "IP".
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.INWARD_PROCESSING_AUTHORISATION_10200, description: `IP${IMPORTER_IPO}` }),
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.GEN45, description: '12345' }),
          ],
  
          // Declared on the "Additional procedure codes" tab, on TOP of the 1EN chosen
          // during the goods declaration above.
          additionalProcedureCodes: [
            ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1SP,
            ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1NR,
          ],
        })
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself with TGP is created and submitted successfully (4071-1LG)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself with TGP - 4071 - 1LG');
    reportTestCaseLink(IMMI_ARRIVED_4071_1LG);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          isPreLodged: false,
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
          locationOfGoods: locationOfGoodsOfOther(IMPORTER_CWP),
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
          warehouseType: WAREHOUSE_TYPE.PRIVATE_CUSTOMS_WAREHOUSE,
          documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE.N760, documentStatus: DOCUMENT_STATUS.AC,   documentReference: '0054039' }),
            //documentReference({ documentCode: DOCUMENT_CODE.C601, documentStatus: undefined,            documentReference: IMPORTER_IPO }),
            documentReference({ documentCode: DOCUMENT_CODE.C517, documentStatus: undefined,            documentReference: IMPORTER_CWP }),
          ],
  
          additionalProcedureCodes: [
            ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1SP,
            ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1NR,
          ],
        }),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself with TGP is created and submitted successfully (4000-1EN)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Accompanied) - Importer Declare by themself with TGP - 4000 - 1EN');
    reportTestCaseLink(IMMI_ARRIVED);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          isPreLodged: false,
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_GVMS_PORT,
        },
  
        goodsItemOverrides: immiStandaloneGoodsItem({
          useTGP: true,
          tgpRecord: TGP_RECORD.MACHINERY_TGP456,
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
        }),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Arrived - RoRo (Unaccompanied) - Importer Declare by themself with supplementary units is created and submitted successfully (4000-1LG)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Arrived - RoRo (Unaccompanied) - Importer Declare by themself with supplementary units - 4000 - 1LG');
    reportTestCaseLink(IMMI_ARRIVED);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          isPreLodged: false,
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
          representationType: undefined,
          portOfArrival: PORT_OF_ARRIVAL.WARRENPOINT_GVMS_PORT,
        },
  
        goodsItemOverrides: immiStandaloneGoodsItem({
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_NON_EXCISE_1LG,
          commodityCode: IMMI_STANDALONE_COMMODITY_CODE.EIGHT_DIGIT,
          // The answer under test, not incidental data.
          supplementaryUnits: '12',
        }),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

  test('Verify IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself using NIRMS is created and submitted successfully (4000-1SG)', { tag: ['@regression', '@happyPath', '@nirms'] }, async ({ createAndSubmitImmiStandaloneFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - Prelodged - RoRo (Accompanied) - Importer Declare by themself - NIRMS');
    reportTestCaseLink(IMMI_NIRMS);
    const immi = await ReportLog.step('Create and submit the IMMI standalone declaration', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
        },

        goodsItemOverrides: immiStandaloneGoodsItem({
          useNirms: true,
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
        }),
      })
    );

    await ReportLog.step('Close the standalone IMMI through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeStandaloneImmi(immi)
    );
  });

});

test.describe('GB to NI RoRo IMMI Standalone Declaration Process - Cancellation', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI IMMI Standalone Declaration Process');
  });

  test('Verify a "Draft" IMMI standalone consignment can be cancelled', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftImmiStandaloneFlow, cancelConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - cancel the consignment while it is still a draft');
    reportTestCaseLink(IMMI_STANDALONE_CANCELLED);

    await createDraftImmiStandaloneFlow.createDraftImmiStandalone({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
      },
      goodsItemOverrides: immiStandaloneGoodsItem(),
    });

    await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
  });

  test('Verify an IMMI standalone consignment cannot be cancelled without a reason', { tag: ['@regression', '@cancellation'] }, async ({
    createDraftImmiStandaloneFlow, cancelConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - the service refuses a cancellation with no reason');
    reportTestCaseLink(IMMI_STANDALONE_CANCEL_NEEDS_REASON);

    await createDraftImmiStandaloneFlow.createDraftImmiStandalone({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
      },
      goodsItemOverrides: immiStandaloneGoodsItem(),
    });

    await cancelConsignmentFlow.verifyCancellationNeedsAReason();
  });

  test('Verify an IMMI standalone consignment in "Trader Input Required" can be cancelled instead of corrected', { tag: ['@regression', '@cancellation'] }, async ({
    createAndSubmitImmiStandaloneFlow, cancelConsignmentFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - CDS hands it back, and the trader cancels rather than correcting');
    reportTestCaseLink(IMMI_STANDALONE_CANCELLED);

    await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
      testInfo,
      url: BASE_URL,
      consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: undefined,
      },
      goodsItemOverrides: immiStandaloneGoodsItem(immiStandaloneRejectedByCds()),
      expectedStatusKey: 'status.traderInputRequired',
    });

    await cancelConsignmentFlow.cancelConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
  });
});


test.describe('GB to NI RoRo IMMI Standalone Declaration Process - Resubmission after CDS refuses it', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI IMMI Standalone Declaration Process');
  });

  test('Verify an IMMI standalone consignment in "Trader Input Required" by CDS can be corrected and resubmitted', { tag: ['@regression', '@resubmission'] }, async ({ createAndSubmitImmiStandaloneFlow, resubmitDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('IMMI Standalone - CDS refuses a declaration missing its transport document, and the trader declares it and resubmits');
    reportTestCaseLink(IMMI_STANDALONE_RESUBMIT);

    // The lever leaves the goods item with no document references at all, so the
    // correction declares the one CDS went looking for rather than editing a value.
    await ReportLog.step('Declare a standalone IMMI CDS will refuse', () =>
      createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
        testInfo,
        url: BASE_URL,
        consignmentOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
          representationType: undefined,
        },
        goodsItemOverrides: immiStandaloneGoodsItem(immiStandaloneRejectedByCds()),
        expectedStatusKey: 'status.traderInputRequired',
      })
    );

    await resubmitDeclarationFlow.declareDocumentAndResubmitStandaloneImmi(
      immiStandaloneTransportDocument()
    );
  });
});
