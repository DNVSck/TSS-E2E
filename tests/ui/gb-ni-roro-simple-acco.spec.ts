import { ENVIRONMENT_INFO } from '../../config/environment';
import { ReportLog } from '../../core/report/ReportLog';
import { GB_TO_NI_RORO_SIMPLE_ACCO } from '../../test-data/gb-ni-roro-simple-acco';
import { getBaseUrl, test } from '../test-hooks';
import { expect } from '@playwright/test';

// Set viewport for all tests
test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(ENVIRONMENT_INFO.viewport.width, ENVIRONMENT_INFO.viewport.height);
});


test('Navigation from Front Page to Sign In @smoke @ui', async ({ t, portalPage, basePage, signInPage, routeDeclarePage }, testInfo) => {
  ReportLog.info(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);

  // Step 1: Universal portal navigation (goto + clear storage + language switch)
  await basePage.navigateToPortal(getBaseUrl(), testInfo);

  // Step 2: Verify homepage content using localized text via t function
  await ReportLog.step('Verify Portal Page Title', async () => {
    const expectedTitle = t('portal.title');
    await expect(portalPage.portalTitleLocator).toHaveText(expectedTitle);
  });

  // Step 3: Click Sign In button using localized text via t function
  await ReportLog.step('Click Sign In Button', async () => {
    const signInButtonText = t('portal.button');
    await portalPage.clickSignIn();
    ReportLog.info(`Clicked button with text: "${signInButtonText}"`);
  });

  // Step 4: Navigate to Sign In page - will be handled by SignInPage in future
  await ReportLog.step('Navigate to Sign In Page', async () => {
    // TODO: Add SignInPage class to handle sign-in page verifications
    ReportLog.info('Successfully navigated to Sign In page - ready for SignInPage implementation');
  });

  // Step 5: Sign In as Admin using SignInPage
  await ReportLog.step('Sign In as Admin', async () => {
    await signInPage.signInAsAdmin();
    ReportLog.info('Admin sign-in successful');
  });

  // Step 6: Click on "Start Now" button after sign-in
  await ReportLog.step('Click on "Start Now"', async () => {
    await portalPage.clickOnStartNow();
    ReportLog.info('Clicked on "Start Now" button');
  });

  await ReportLog.step('Route declaration', async () => {
    // Complete route declaration using test data
    const route = GB_TO_NI_RORO_SIMPLE_ACCO.route;
    const goodsMovementProcess = GB_TO_NI_RORO_SIMPLE_ACCO.goodMovementProcess;
    const process = GB_TO_NI_RORO_SIMPLE_ACCO.process;

    // Use RouteDeclarePage to complete the declaration
    await routeDeclarePage.completeRouteDeclaration(route, goodsMovementProcess, process);
    ReportLog.info(`Route "${route}" selected and continued successfully`);
  });

  console.log('Navigation test completed successfully');
});