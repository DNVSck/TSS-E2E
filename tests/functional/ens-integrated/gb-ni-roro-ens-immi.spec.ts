import { ADDITIONAL_INFORMATION_CODE } from '../../../src/constant/additional-information-constant';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { DOCUMENT_CODE } from '../../../src/constant/document-code-constant';
import { documentReference, importerUkimsDocument } from '../../../src/test-data/document-reference-data';
import { holderOfAuthorisation } from '../../../src/test-data/holder-of-authorisation-data';
import { previousDocument } from '../../../src/test-data/previous-document-data';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';
import { DOCUMENT_STATUS } from '../../../src/constant/document-status-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { IMPORTER_UKIMS, IMPORTER_EXW, BASE_URL } from '../../../config/environment';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';
import { PROCEDURE_CODES } from '../../../src/constant/procedure-codes-constant';
import { TGP_RECORD } from '../../../src/test-data/tgp-record-data';
import { additionalInformation } from '../../../src/test-data/additional-information-data';
import { immiRejectedByCds } from '../../../src/test-data/rejection-lever-data';
import { ensImmiDeclaration } from '../../../src/test-data/ens-declaration-data';
import { CANCELLATION_REASON } from '../../../src/test-data/consignment-data';

const ENS_IMMI_NO_TGP = '2809';
const ENS_IMMI_TGP = '2793';
const IMMI_NIRMS = '4912';
const IMMI_EXCISE = '6660';
const ENS_IMMI_RESUBMIT_AFTER_CDS = '2814';
const ENS_IMMI_CANCEL_AFTER_CDS = '2827';

test.describe('GB to NI RoRo IMMI Pre-movement - Agent Represents Trader', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo IMMI - Pre-movement');
  });

  test('Verify ENS-IMMI - RoRo (Accompanied) with TGP is created and submitted successfully (4000-1EN)', { tag: ['@smoke', '@happyPath', '@regression'] }, async ({
    createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Accompanied with TGP');
    reportTestCaseLink(ENS_IMMI_TGP);
    const { generatedConsignment: immi } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: BASE_URL,
        movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED },
        consignmentOverrides: {
          useIMMI: true,
          headerPreviousDocuments: [
              previousDocument({ documentReference: '4GBXI553202734852-20240501' })
          ],
          holdersOfAuthorisation: [
              holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME_UKIM })
          ],
        },
        goodsItemOverrides: {
          useTGP: true,
          tgpRecord: TGP_RECORD.TEXTILES_TGP123,
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EN,
        },
        
      })
    );

    await ReportLog.step('Close the IMMI consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeImmiConsignment(immi)
    );
  });

  test('Verify ENS-IMMI - RoRo (Unaccompanied) without TGP is created and submitted successfully (0700-1EL)', { tag: ['@smoke', '@happyPath', '@regression'] }, async ({
    createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Unaccompanied without TGP');
    reportTestCaseLink(IMMI_EXCISE);
    const { generatedConsignment: immi } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: BASE_URL,
        movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED },
        consignmentOverrides: {
          useIMMI: true,
          headerPreviousDocuments: [
              previousDocument({ documentReference: '4GBXI553202734852-20240501' })
          ],
          holdersOfAuthorisation: [
              holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME_UKIM }),
              holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW })
          ],
        },
        goodsItemOverrides: {
          useTGP: false,
          procedureCode: PROCEDURE_CODES.FREE_CIRC_WITH_EXCISE_WAREHOUSE_0700,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_EXCISE_1EL,
          commodityCode: '63062900',
          // "1UKI" is inputted by user, checking the code list and input manually step.
          documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE['1UKI'], documentStatus: DOCUMENT_STATUS.AC, documentReference: IMPORTER_UKIMS }),
            documentReference({ documentCode: DOCUMENT_CODE.C676, documentStatus: undefined,            documentReference: IMPORTER_EXW}),
          ],
          supplementaryUnits: '1',
          additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.ECONR, description: 'Reg No. 1234567890' }),
          ],
          additionalProcedureCodes: [
            ADDITIONAL_PROCEDURE_CODES.EXCISE_MOVEMENT_DUTY_SUSPENSION_F06,
          ],
        },
      })
    );

    await ReportLog.step('Close the IMMI consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeImmiConsignment(immi)
    );
  });

  test('Verify ENS-IMMI - RoRo (Accompanied) without TGP is created and submitted successfully (4000-1SG)', { tag: ['@regression', '@happyPath'] }, async ({
    createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Accompanied without TGP');
    reportTestCaseLink(ENS_IMMI_NO_TGP);
    const { generatedConsignment: immi } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: BASE_URL,
        movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED },
        consignmentOverrides: {
          useIMMI: true,
          headerPreviousDocuments: [
              previousDocument({ documentReference: '4GBXI553202734852-20240501' })
          ],
          holdersOfAuthorisation: [
              holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME_UKIM })
          ],
        },
        goodsItemOverrides: {
          useTGP: false,
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
          commodityCode: '630629',
          // Without TGP the trader quotes their own UKIMS authorisation - the TGP tests
          // never declare it because the service copies it into the generated IMMI.
          documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE['1UKI'], documentStatus: DOCUMENT_STATUS.AC, documentReference: IMPORTER_UKIMS }),
          ]
        },
      })
    );

    await ReportLog.step('Close the IMMI consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeImmiConsignment(immi)
    );
  });

  test('Verify ENS-IMMI - RoRo (Accompanied) without TGP using NIRMS is created and submitted successfully (4000-1SG)', { tag: ['@regression', '@happyPath', '@nirms'] }, async ({
    createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Accompanied without TGP using NIRMS');
    reportTestCaseLink(IMMI_NIRMS);
    const { generatedConsignment: immi } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: BASE_URL,
        movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED },
        consignmentOverrides: {
          useIMMI: true,
          headerPreviousDocuments: [
              previousDocument({ documentReference: '4GBXI553202734852-20240501' })
          ],
          holdersOfAuthorisation: [
              holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME_UKIM })
          ],
        },
        goodsItemOverrides: {
          useTGP: false,
          useNirms: true,
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
          commodityCode: '630629',
          documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE['1UKI'], documentStatus: DOCUMENT_STATUS.AC, documentReference: IMPORTER_UKIMS }),
          ]
        },
      })
    );

    await ReportLog.step('Close the IMMI consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeImmiConsignment(immi)
    );
  });


  test('Verify ENS-IMMI - RoRo (Unaccompanied) with TGP is created and submitted successfully (4000-1LG)', { tag: ['@regression', '@happyPath'] }, async ({
    createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Unaccompanied with TGP');
    reportTestCaseLink(ENS_IMMI_NO_TGP);
    const { generatedConsignment: immi } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: BASE_URL,
        movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED },
        consignmentOverrides: {
          useIMMI: true,
          headerPreviousDocuments: [
              previousDocument({ documentReference: '4GBXI553202734852-20240501' })
          ],
          holdersOfAuthorisation: [
              holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME_UKIM })
          ],
        },
        goodsItemOverrides: {
          useTGP: true,
          tgpRecord: TGP_RECORD.MACHINERY_TGP456,
          procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_CATEGORY_2_NON_EXCISE_1LG,
        },
      })
    );

    await ReportLog.step('Close the IMMI consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.closeImmiConsignment(immi)
    );
  });

});


test.describe('GB to NI RoRo IMMI Pre-movement - Resubmission after CDS refuses the IMMI', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo IMMI Pre-movement');
  });

  test('Verify an IMMI consignment in "Trader Input Required" by CDS can be corrected and resubmitted', { tag: ['@regression', '@resubmission'] }, async ({
    createAndSubmitEnsDeclarationFlow, resubmitDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-IMMI - CDS refuses the UKIMS number, and the trader corrects it and resubmits');
    reportTestCaseLink(ENS_IMMI_RESUBMIT_AFTER_CDS);

    // The lever rides on the GOODS ITEM, which is where the UKIMS number lives and
    // where the correction below puts the importer's own number back.
    await createAndSubmitEnsDeclarationFlow.submitEnsDeclarationExpectingRejection(
      ensImmiDeclaration(testInfo, immiRejectedByCds()), 'IMMI'
    );
    await resubmitDeclarationFlow.correctUkimsDocumentAndResubmitImmi(importerUkimsDocument());
  });
});


test.describe('GB to NI RoRo IMMI Pre-movement - Cancellation after CDS refuses the IMMI', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo IMMI Pre-movement');
  });

  test('Verify an IMMI consignment in "Trader Input Required" by CDS can be cancelled instead of corrected', { tag: ['@regression', '@cancellation'] }, async ({
    createAndSubmitEnsDeclarationFlow, cancelEnsDeclarationFlow
  }, testInfo) => {
    await ReportLog.setStory('ENS-IMMI - CDS refuses the UKIMS number, and the trader cancels rather than correcting');
    reportTestCaseLink(ENS_IMMI_CANCEL_AFTER_CDS);

    await createAndSubmitEnsDeclarationFlow.submitEnsDeclarationExpectingRejection(
      ensImmiDeclaration(testInfo, immiRejectedByCds()), 'IMMI'
    );
    await cancelEnsDeclarationFlow.cancelRefusedImmiConsignmentAndVerifyItIsCancelled(CANCELLATION_REASON);
  });
});
