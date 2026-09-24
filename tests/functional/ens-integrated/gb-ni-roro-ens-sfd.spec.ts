import { ADDITIONAL_INFORMATION_CODE } from '../../../src/constant/additional-information-constant';
import { ReportLog } from '../../../src/core/report/report-log';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { getBaseUrl, test } from '../../test-hooks';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import {
    documentReference, ensSfdGoodsDocuments,
} from '../../../src/test-data/document-reference-data';
import { DOCUMENT_CODE } from '../../../src/constant/document-code-constant';
import { IMPORTER_EXW } from '../../../config/environment';
import { PROCEDURE_CODES } from '../../../src/constant/procedure-codes-constant';
import { holderOfAuthorisation } from '../../../src/test-data/holder-of-authorisation-data';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';
import { additionalInformation } from '../../../src/test-data/additional-information-data';
import { NIRMS_COMMODITY, nirmsGoodsItem } from '../../../src/test-data/nirms-data';

const ENS_SFD_ACCO = '2253';
const ENS_SFD_UNACCO = '2254';
const ENS_SFD_EXCISE = '6661';
const ENS_SFD_NIRMS = '4638';

test.describe('GB to NI RoRo Simplified Customs Declaration Process - Agent Represents Trader', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo Simplified Customs Declaration Process');
  });

  test('Verify ENS-SFD - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@happyPath', '@regression'] }, async ({ createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration Accompanied');
    reportTestCaseLink(ENS_SFD_ACCO);
    const { generatedConsignment: sfd } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: getBaseUrl(),
        movementOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        },
        consignmentOverrides: {
        },
        goodsItemOverrides: {
          documentReferences: ensSfdGoodsDocuments(),
        },
      })
    );

    await ReportLog.step('Arrive the SFD consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveSfdConsignment(sfd)
    );
  });

  test('Verify ENS-SFD - RoRo (Unaccompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@happyPath', '@regression'] }, async ({ createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration UnAccompanied');
    reportTestCaseLink(ENS_SFD_UNACCO);
    const { generatedConsignment: sfd } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: getBaseUrl(),
        movementOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED,
        },
        consignmentOverrides: {
        },
        goodsItemOverrides: {
          documentReferences: ensSfdGoodsDocuments(),
        },
      })
    );

    await ReportLog.step('Arrive the SFD consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveSfdConsignment(sfd)
    );
  });

  test('Verify ENS-SFD - RoRo (Accompanied) is created and submitted successfully (0700-F06)', { tag: ['@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration Accompanied - excise warehousing');
    reportTestCaseLink(ENS_SFD_EXCISE);
    const { generatedConsignment: sfd } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: getBaseUrl(),
        movementOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        },
        consignmentOverrides: {
          holdersOfAuthorisation: [
            holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW })
          ],
        },
        goodsItemOverrides: {
          procedureCode: PROCEDURE_CODES.FREE_CIRC_WITH_EXCISE_WAREHOUSE_0700,
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.EXCISE_MOVEMENT_DUTY_SUSPENSION_F06,
          documentReferences: [
            ...ensSfdGoodsDocuments(),
            documentReference({ documentCode: DOCUMENT_CODE.C676, documentStatus: undefined, documentReference: IMPORTER_EXW }),
          ],
          additionalInformations: [
            additionalInformation({ code: ADDITIONAL_INFORMATION_CODE.ECONR, description: 'Reg No. 1234567890' }),
          ],
        },
      })
    );

    await ReportLog.step('Arrive the SFD consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveSfdConsignment(sfd)
    );
  });

  test(`Verify ENS-SFD - RoRo (Accompanied) using NIRMS is created and submitted successfully (4000-1CG)`, { tag: ['@regression', '@happyPath', '@nirms'] }, async ({ createAndSubmitEnsDeclarationFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory(`ENS SFD - GB to NI RoRo Simplified Customs Declaration Accompanied - NIRMS`);
    reportTestCaseLink(ENS_SFD_NIRMS);
    const { generatedConsignment: sfd } = await ReportLog.step('Create and submit the ENS declaration', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
        testInfo,
        url: getBaseUrl(),
        movementOverrides: {
          typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        },
        consignmentOverrides: {
        },
        goodsItemOverrides: {
          ...nirmsGoodsItem(NIRMS_COMMODITY.FRESH_CARROTS),
          additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.CONTROLLED_GOODS_SIMPLIFIED_1CG,
          documentReferences: [
            ...ensSfdGoodsDocuments(),
            ...NIRMS_COMMODITY.FRESH_CARROTS.supportingDocuments,
          ],
        },
      })
    );

    await ReportLog.step('Arrive the SFD consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveSfdConsignment(sfd)
    );
  });

});
