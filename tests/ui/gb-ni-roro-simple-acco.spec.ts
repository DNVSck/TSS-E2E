import { ENVIRONMENT_INFO } from '../../config/environment';
import { GB_TO_NI_RORO_SIMPLE_ACCO } from '../../test-data/gb-ni-roro-simple-acco';
import { getBaseUrl, logInfo, test, testStep } from '../test-hooks';

// Set viewport for all tests
test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(ENVIRONMENT_INFO.viewport.width, ENVIRONMENT_INFO.viewport.height);
});


test('Navigation from Front Page to Sign In @smoke @ui', async ({ t, portalPage, basePage, signInPage, routeDeclarePage }, testInfo) => {
  logInfo(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);
  
  // Step 1: Universal portal navigation (goto + clear storage + language switch)
  await basePage.navigateToPortal(getBaseUrl(), testInfo);
  
  // Step 2: Verify homepage content using localized text via t function
  await testStep('Verify Portal Page Title', async () => {
    const expectedTitle = t('portal.title');
    await portalPage.verifyPortalTitle(expectedTitle);
  });
  
  // Step 3: Click Sign In button using localized text via t function
  await testStep('Click Sign In Button', async () => {
    const signInButtonText = t('portal.button');
    await portalPage.clickSignIn();
    logInfo(`Clicked button with text: "${signInButtonText}"`);
  });
  
  // Step 4: Navigate to Sign In page - will be handled by SignInPage in future
  await testStep('Navigate to Sign In Page', async () => {
    // TODO: Add SignInPage class to handle sign-in page verifications
    logInfo('Successfully navigated to Sign In page - ready for SignInPage implementation');
  });
  
  // Step 5: Sign In as Admin using SignInPage
  await testStep('Sign In as Admin', async () => {
    await signInPage.signInAsAdmin();
    logInfo('Admin sign-in successful');
  });

  // Step 6: Click on "Start Now" button after sign-in
  await testStep('Click on "Start Now"', async () => {
    await portalPage.clickOnStartNow();
    logInfo('Clicked on "Start Now" button');
  });

  await testStep('Route declaration', async () => {
    // Complete route declaration using test data
    const route = GB_TO_NI_RORO_SIMPLE_ACCO.route;
    const goodsMovementProcess = GB_TO_NI_RORO_SIMPLE_ACCO.goodMovementProcess;
    const process = GB_TO_NI_RORO_SIMPLE_ACCO.process;

    // Use RouteDeclarePage to complete the declaration
    await routeDeclarePage.completeRouteDeclaration(route, goodsMovementProcess, process);
    logInfo(`Route "${route}" selected and continued successfully`);
  });
  
  console.log('Navigation test completed successfully');
});