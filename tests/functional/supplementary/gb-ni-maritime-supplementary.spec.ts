import { ReportLog } from '../../../src/core/report/report-log';
import { test } from '../../base-test';
import { BASE_URL } from '../../../config/environment';
import { COMPANY_PROFILE } from '../../../src/auth/credentials';
import { byMaritime } from '../../../src/test-data/ens-declaration-data';
import { supplementaryDeclarationMovement } from '../../../src/test-data/supplementary-declaration-movement-data';
import {
  declaredThroughTraderApi, traderDefermentSupplementaryDeclaration,
} from '../../../src/test-data/supplementary-declaration-data';
import { reportTestCaseLink } from '../../../src/helper/report-helper';
import { sfdStandaloneByMaritime } from '../../../src/test-data/sfd-standalone-consignment-data';
import { sfdStandaloneGoodsItem } from '../../../src/test-data/sfd-standalone-goods-item-data';
import { generateRandomTransportDocumentNumber } from '../../../src/helper/data-generate-helper';
import { SfdStandaloneDeclarationOptions } from '../../../src/flows/common-flows/create-draft-sfd-standalone-flow';

const SD_IMPORTER_MARITIME = '6565';
const SD_IMPORTER_MARITIME_SFD_STANDALONE = '6577';

test.describe('GB to NI Maritime Supplementary Declaration - from ENS-SFD', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.describe.configure({ timeout: 1_200_000 });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
  });

  test('Verify the supplementary declaration raised by a Maritime ENS-SFD movement is completed and submitted successfully - Trader DDA - No Payment through TSS', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ generateSdDraftFromEnsSfdFlow, completeAndSubmitSupplementaryDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('Supplementary Declaration - from ENS-SFD - Maritime - Trader DDA');

    const { movementLrn, frontierLrn } = await ReportLog.step('Raise the supplementary declaration from a Maritime ENS-SFD movement', () =>
      generateSdDraftFromEnsSfdFlow.generateSdDraft({
        testInfo,
        url: BASE_URL,
        overrides: byMaritime(supplementaryDeclarationMovement()),
      })
    );

    await ReportLog.step('Complete and submit the supplementary declaration', () =>
      completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
        testInfo,
        url: BASE_URL,
        movementLrn,
        frontierLrn,
        overrides: traderDefermentSupplementaryDeclaration(),
      })
    );
  });
});

test.describe('GB to NI Maritime Supplementary Declaration - completed by the importer itself', () => {
  test.use({ authProfile: COMPANY_PROFILE.IMPORTER });

  test.describe.configure({ timeout: 1_200_000 });

  test.beforeEach(async () => {
    await ReportLog.setFeature('GB to NI Supplementary Declaration Process');
  });

  test('Verify the importer completes and submits its own supplementary declaration raised by a Maritime ENS-SFD movement declared through the Trader API - Trader DDA', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ generateSdDraftThroughApiFlow, completeAndSubmitSupplementaryDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('Supplementary Declaration - from Maritime ENS-SFD declared through the Trader API - completed by the importer - Trader DDA');
    reportTestCaseLink(SD_IMPORTER_MARITIME);

    const source = await generateSdDraftThroughApiFlow.raiseSdDraft({
      declaration: byMaritime({}),
    });

    await ReportLog.step('Complete and submit the supplementary declaration', () =>
      completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
        testInfo,
        url: BASE_URL,
        ...source,
        overrides: declaredThroughTraderApi(traderDefermentSupplementaryDeclaration()),
      })
    );
  });

  test('Verify the importer completes and submits its own supplementary declaration raised by a Maritime SFD Standalone - Trader DDA', { tag: ['@maritime', '@regression', '@happyPath'] }, async ({ generateSdDraftFromSfdStandaloneFlow, completeAndSubmitSupplementaryDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('Supplementary Declaration - from Maritime SFD Standalone - completed by the importer - Trader DDA');
    reportTestCaseLink(SD_IMPORTER_MARITIME_SFD_STANDALONE);

    const source = await ReportLog.step('Raise the supplementary declaration from a Maritime SFD Standalone', () =>
      generateSdDraftFromSfdStandaloneFlow.generateSdDraft(sfdStandaloneByMaritime<SfdStandaloneDeclarationOptions>({
        testInfo,
        url: BASE_URL,
        goodsItemOverrides: sfdStandaloneGoodsItem(),
      }))
    );

    await ReportLog.step('Complete and submit the supplementary declaration', () =>
      completeAndSubmitSupplementaryDeclarationFlow.completeSupplementaryDeclaration({
        testInfo,
        url: BASE_URL,
        ...source,
        overrides: traderDefermentSupplementaryDeclaration({
          transportDocumentNumber: generateRandomTransportDocumentNumber('MARITIME'),
        }),
      })
    );
  });

});
