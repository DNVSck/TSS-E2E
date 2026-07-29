import { reportTestCaseLink } from '../../src/helper/report-helper';
import { COMPANY_PROFILE } from '../../src/auth/credentials';
import { ReportLog } from '../../src/core/report/report-log';
import { ensOnlyConsignment } from '../../src/test-data/consignment-data';
import { documentReference } from '../../src/test-data/document-reference-data';
import { holderOfAuthorisation } from '../../src/test-data/holder-of-authorisation-data';
import { previousDocument } from '../../src/test-data/previous-document-data';
import { getBaseUrl, test } from '../test-hooks';
import { DOCUMENT_STATUS } from '../../src/constant/document-status-constant';
import { gmrData } from '../../src/test-data/gmr-data';
import { DOCUMENT_CODE } from '../../src/constant/document-code-constant';
import { PREVIOUS_DOCUMENT_TYPE } from '../../src/constant/previous-document-type-constant';
import { AUTHORISATION_TYPE_CODE } from '../../src/constant/authorisation-type-code-constant';
import { HAULIER_COMPANY_NAME} from '../../config/environment';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../src/constant/type-of-movement-code-constant';


const ENS_ONLY = '4439';
const ENS_SFD_GMR = '4436';
const ENS_IMMI_GMR_NO_TGP = '4437';
const ENS_EIDR_GMR = '4438';


test.describe('GB to NI ENS Declaration Process', () => {
  // Runs as AGENT: this worker replays its own AGENT account's cached session
  // (chosen from the pool), signed in once by globalSetup. No sign-in per test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI ENS Declaration Process');
    // Agent represents the Haulier company before declaring on the Importer's
    // behalf — a server-side session state the journeys below then run under.
    await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
  });

  test('UI-SMOKE-TC03-TSS-Portal-ENS-ONLY: Verify ENS Only flow', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('UI-SMOKE-TC03-TSS-Portal-ENS-ONLY: Verify ENS Only flow (controlled goods = No)');
    reportTestCaseLink(ENS_ONLY);
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      movementOverrides: { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED },
      consignmentOverrides: ensOnlyConsignment({ isControlledGoods: false }),
    });
  });

  test('UI-SMOKE-TC03-TSS-Portal-ENS-SFD-GMR: Verify ENS triggers SFD with GMR', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow }, testInfo) => {
    await ReportLog.setStory('UI-SMOKE-TC03-TSS-Portal-ENS-SFD-GMR: Verify ENS triggers SFD with GMR');
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

  test('UI-SMOKE-TC03-TSS-Portal-ENS-IMMI-GMR: Verify ENS triggers IMMI with GMR', { tag: ['@smoke'] }, async ({
    createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow
  }, testInfo) => {
    await ReportLog.setStory('IMMI Pre-movement - GB to NI RoRo IMMI Unaccompanied without TGP');
    reportTestCaseLink(ENS_IMMI_GMR_NO_TGP);
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
        additionalProcedureCode: '1SG',
        // "1UKI" is inputted by user, checking the code list and input manually step.
        documentReferences: [
          documentReference({ documentCode: DOCUMENT_CODE['1UKI'], documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XIUKIM89645889502320240124160138' }),
          documentReference({ documentCode: DOCUMENT_CODE.C672, documentStatus: DOCUMENT_STATUS.AC, documentReference: 'XI896458895023' }),
          documentReference({ documentCode: DOCUMENT_CODE.N705, documentStatus: DOCUMENT_STATUS.AE, documentReference: '0054047' }),
        ],
        previousDocuments: [
          previousDocument({ documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355, documentReference: '24GB34F7Y1O2CX8PT4' }),
        ],
      },
    });

    await createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData());
  });

  test('UI-SMOKE-TC03-TSS-Portal-ENS-EIDR-GMR: Verify ENS triggers EIDR with GMR', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow, ics2NotificationFlow, createAndSubmitGmrFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - GB to NI RoRo Accompanied (controlled goods = No)');
    reportTestCaseLink(ENS_EIDR_GMR);
    const { transportDocumentNumber, ensMrn } = await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
      },
      consignmentOverrides: { isControlledGoods: false },
    });

    await ics2NotificationFlow.authoriseForMovementIfMocked(ensMrn, transportDocumentNumber);

    await createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData());
  });
});
