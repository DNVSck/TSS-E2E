import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { BASE_URL } from '../../../config/environment';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { ERROR_MESSAGE } from '../../../src/constant/error-message-constant';
import { ensOnlyConsignment } from '../../../src/test-data/consignment-data';
import { ensImmiDeclaration } from '../../../src/test-data/ens-declaration-data';
import { GOODS_CSV } from '../../../src/test-data/goods-csv-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';

const CSV_ENS_ONLY = '6220';
const CSV_ENS_SFD = '6236';
const CSV_ENS_SFD_99_GOODS = '4841';
const CSV_ENS_IMMI = '6238';
const CSV_NO_GOODS_RECORD = '4844';
const CSV_INVALID_COLUMN_NAME = '4843';

const roroAccompanied = { typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED };

test.describe('GB to NI RoRo ENS Goods CSV Upload - Agent Represents Trader', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI RoRo ENS Goods CSV Upload');
  });

  test('Verify ENS Only - RoRo (Accompanied) with goods uploaded by CSV is created and submitted successfully', { tag: ['@csvUpload', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS-only - goods records uploaded by CSV');
    reportTestCaseLink(CSV_ENS_ONLY);
    await ReportLog.step('Create and submit the ENS declaration with goods from CSV', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationWithGoodsCsv({
        testInfo,
        url: BASE_URL,
        movementOverrides: roroAccompanied,
        consignmentOverrides: ensOnlyConsignment(),
      }, GOODS_CSV.ENS_ONLY)
    );
  });

  test('Verify ENS-SFD - RoRo (Accompanied) with goods uploaded by CSV is created and submitted successfully (4000-000)', { tag: ['@csvUpload', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - goods records uploaded by CSV');
    reportTestCaseLink(CSV_ENS_SFD);
    await ReportLog.step('Create and submit the ENS declaration with goods from CSV', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationWithGoodsCsv({
        testInfo,
        url: BASE_URL,
        movementOverrides: roroAccompanied,
      }, GOODS_CSV.ENS_SFD)
    );
  });

  test('Verify ENS-SFD - RoRo (Accompanied) with the maximum 99 goods records uploaded by CSV is created and submitted successfully (4000-000)', { tag: ['@csvUpload', '@regression'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS SFD - goods records uploaded by CSV');
    reportTestCaseLink(CSV_ENS_SFD_99_GOODS);
    await ReportLog.step('Create and submit the ENS declaration with 99 goods from CSV', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationWithGoodsCsv({
        testInfo,
        url: BASE_URL,
        movementOverrides: roroAccompanied,
      }, GOODS_CSV.ENS_SFD_99_GOODS)
    );
  });

  test('Verify ENS-IMMI - RoRo (Accompanied) with goods uploaded by CSV is created and submitted successfully (4000-1SG)', { tag: ['@csvUpload', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS IMMI - goods records uploaded by CSV');
    reportTestCaseLink(CSV_ENS_IMMI);
    await ReportLog.step('Create and submit the ENS declaration with goods from CSV', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationWithGoodsCsv(
        ensImmiDeclaration(testInfo), GOODS_CSV.ENS_IMMI
      )
    );
  });

  test('Verify ENS-EIDR - RoRo (Accompanied) with goods uploaded by CSV is created and submitted successfully (4000-000)', { tag: ['@csvUpload', '@regression', '@happyPath'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('EIDR - goods records uploaded by CSV');
    await ReportLog.step('Create and submit the ENS declaration with goods from CSV', () =>
      createAndSubmitEnsDeclarationFlow.completeEnsDeclarationWithGoodsCsv({
        testInfo,
        url: BASE_URL,
        movementOverrides: roroAccompanied,
        consignmentOverrides: { isControlledGoods: false },
      }, GOODS_CSV.ENS_EIDR)
    );
  });

  test('Verify a goods CSV holding headers but no rows is refused', { tag: ['@csvUpload', '@regression'] }, async ({ createDraftEnsDeclarationFlow, uploadGoodsCsvFlow }, testInfo) => {
    await ReportLog.setStory('Goods CSV upload - refused files');
    reportTestCaseLink(CSV_NO_GOODS_RECORD);
    await createDraftEnsDeclarationFlow.createDraftEnsConsignmentWithoutGoods({
      testInfo, url: BASE_URL, movementOverrides: roroAccompanied, consignmentOverrides: ensOnlyConsignment(),
    });
    await uploadGoodsCsvFlow.verifyGoodsCsvRefused(GOODS_CSV.HEADERS_ONLY, ERROR_MESSAGE.GOODS_CSV_NO_DATA_ROWS);
  });

  test('Verify a goods CSV with headers the service no longer accepts is refused', { tag: ['@csvUpload', '@regression'] }, async ({ createDraftEnsDeclarationFlow, uploadGoodsCsvFlow }, testInfo) => {
    await ReportLog.setStory('Goods CSV upload - refused files');
    reportTestCaseLink(CSV_INVALID_COLUMN_NAME);
    await createDraftEnsDeclarationFlow.createDraftEnsConsignmentWithoutGoods({
      testInfo, url: BASE_URL, movementOverrides: roroAccompanied, consignmentOverrides: ensOnlyConsignment(),
    });
    await uploadGoodsCsvFlow.verifyGoodsCsvRefused(GOODS_CSV.LEGACY_HEADERS, ERROR_MESSAGE.GOODS_CSV_HEADERS_REJECTED);
  });
});
