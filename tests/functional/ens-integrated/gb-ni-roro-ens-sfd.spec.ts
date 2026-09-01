import { ReportLog } from '../../../src/core/report/report-log';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { getBaseUrl, test } from '../../test-hooks';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { previousDocument } from '../../../src/test-data/previous-document-data';
import { documentReference } from '../../../src/test-data/document-reference-data';
import { DOCUMENT_CODE } from '../../../src/constant/document-code-constant';
import { IMPORTER_EXW } from '../../../config/environment';
import { DOCUMENT_STATUS } from '../../../src/constant/document-status-constant';
import { gmrData } from '../../../src/test-data/gmr-data';
import { ROUTE_ID_CONSTANT } from '../../../src/constant/routeId-constant';
import { PROCEDURE_CODES } from '../../../src/constant/procedure-codes-constant';
import { holderOfAuthorisation } from '../../../src/test-data/holder-of-authorisation-data';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../../../src/constant/additional-procedure-codes-constant';
import { additionalInformation } from '../../../src/test-data/additional-information-data';

const ENS_SFD_GMR = '4436';

test.describe('GB to NI RoRo Simplified Customs Declaration Process - Agent Represents Trader', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo Simplified Customs Declaration Process');
  });

  test('Verify ENS-SFD - RoRo (Accompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration Accompanied');
    reportTestCaseLink(ENS_SFD_GMR);
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
          documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: '0054037-0054047' }),
          ],
        },
      })
    );

    await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData(
          {
            route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES,
            external_contacts_list: ['adam1.taylor@nifreight.co.uk', 'ledt1@nifreight.co.uk'],
          }
      ))
    );

    await ReportLog.step('Arrive the SFD consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveSfdConsignment(sfd)
    );
  });

  test('Verify ENS-SFD - RoRo (Unaccompanied) is created and submitted successfully (4000-000)', { tag: ['@smoke', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration UnAccompanied');
    reportTestCaseLink(ENS_SFD_GMR);
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
          documentReferences: [
            documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: '0054037-0054047' }),
          ],
        },
      })
    );

    await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData())
    );

    await ReportLog.step('Arrive the SFD consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveSfdConsignment(sfd)
    );
  });

  test('Verify ENS-SFD - RoRo (Accompanied) is created and submitted successfully (0700-F06)', { tag: ['@regression', '@e2e', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow, triggerFinalStatusThroughCdsFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - GB to NI RoRo Simplified Customs Declaration Accompanied - excise warehousing');
    reportTestCaseLink(ENS_SFD_GMR);
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
            documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: '0054037-0054047' }),
            documentReference({ documentCode: DOCUMENT_CODE.C676, documentStatus: undefined,            documentReference: IMPORTER_EXW}),
          ],
          additionalInformations: [
            additionalInformation({ code: 'ECONR', description: 'Reg No. 1234567890' }),
          ],
        },
      })
    );

    await ReportLog.step('Create and submit the GMR', () =>
      createAndSubmitGmrFlow.addNewGmrAndSubmit(
        gmrData({
          route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES,
        })
      )
    );

    await ReportLog.step('Arrive the SFD consignment through CDS', () =>
      triggerFinalStatusThroughCdsFlow.arriveSfdConsignment(sfd)
    );
  });

});
