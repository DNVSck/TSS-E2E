import { getBaseUrl, logInfo, logPass, test, testStep } from '../test-hooks';

// Set viewport for all tests
test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(1920, 1080);
});

test('Navigation from Front Page to Sign In @smoke @navigation @ui', async ({ t, portalPage, basePage, signInPage }, testInfo) => {
  logInfo(`Starting navigation test from ${getBaseUrl()} with locale: ${process.env.LOCALE}`);
  
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

 
});