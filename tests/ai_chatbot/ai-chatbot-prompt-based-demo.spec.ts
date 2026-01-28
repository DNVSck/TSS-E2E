import { ENVIRONMENT_INFO } from '../../config/environment';
import { GB_TO_NI_RORO_SIMPLE_ACCO } from '../../test-data/gb-ni-roro-simple-acco';
import { getBaseUrl, logInfo, test, testStep } from '../test-hooks';
import { aiEvaluator } from '../../services/ai-evaluator-service';

// Set viewport for all tests
test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(ENVIRONMENT_INFO.viewport.width, ENVIRONMENT_INFO.viewport.height);
});


test('Navigation from Front Page to Sign In @smoke @ui', async ({ t, portalPage, basePage, page }, testInfo) => {
  logInfo(`Starting navigation test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);
  
  // Step 1: Universal portal navigation (goto + clear storage + language switch)
  await basePage.navigateToPortal(getBaseUrl(), testInfo);
  
  // Step 2: Verify homepage content using localized text via t function
  await testStep('Verify Portal Page Title', async () => {
    const expectedTitle = t('portal.title');
    await portalPage.verifyPortalTitle(expectedTitle);
  });
  
  // Step 3: Verify AI chatbot is present and open it
  await testStep('Verify and Open AI Chatbot', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const chatButton = chatFrame.locator('svg[aria-label="Open chat window"]');
    
    // Verify chatbot button visible
    await chatButton.waitFor({ state: 'visible', timeout: 10000 });
    logInfo('AI Chatbot button is visible');
    
    // Click to open chat
    await chatButton.click();
    logInfo('AI Chatbot opened successfully');
  });

  // Step 4: Wait for AI welcome message
  await testStep('Wait for AI Welcome Message', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
    
    // Wait for welcome message containing specific text
    const welcomeMessage = botMessages.filter({ 
      hasText: "Hello. I am Trader Support Service's Digital Assistant" 
    });
    
    await welcomeMessage.waitFor({ state: 'visible', timeout: 15000 });
    logInfo('AI welcome message received');
    
    const welcomeText = await welcomeMessage.textContent();
    console.log('\n--- AI Welcome Message ---');
    console.log(welcomeText);
    console.log('---------------------------\n');
  });

  // Step 5: Type message into chatbot
  await testStep('Type message in AI Chatbot', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const messageInput = chatFrame.locator('div.message-input[role="textbox"][contenteditable="true"]');
    
    // Wait for input to be visible
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
    logInfo('Message input is visible');
    
    // Type message
    const testMessage = 'What are the key aspects of the windsor framework?';
    await messageInput.fill(testMessage);
    logInfo(`Typed message: ${testMessage}`);
    
    // Wait to see the message
    await page.waitForTimeout(1000);
  });

  // Step 6: Send message and wait for complete response
  await testStep('Send message in chatbot', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
    
    // Count bot messages before sending
    const initialCount = await botMessages.count();
    logInfo(`Initial bot message count: ${initialCount}`);
    
    const sendButton = chatFrame.locator('button:has(svg path[fill="currentColor"])');
    
    // Wait for send button to be visible
    await sendButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Click send button
    await sendButton.click();
    logInfo('Message sent');
    
    // Wait for NEW bot message to appear (count increases)
    await page.waitForTimeout(2000);
    
    // Wait until message count becomes STABLE (AI finished sending all messages)
    let stableCount = 0;
    let previousCount = initialCount;
    const maxWaitTime = 30000; // 30 seconds max
    const startTime = Date.now();
    
    while (stableCount < 3 && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(1000); // Check every 1 second
      
      const currentCount = await botMessages.count();
      logInfo(`Checking... Current bot messages: ${currentCount}`);
      
      if (currentCount === previousCount) {
        stableCount++; // Count is same, increment stable counter
        logInfo(`Stable check ${stableCount}/3`);
      } else {
        stableCount = 0; // Count changed, reset
        previousCount = currentCount;
        logInfo(`Count changed to ${currentCount}, resetting stability check`);
      }
    }
    
    const finalCount = await botMessages.count();
    logInfo(`AI finished responding. Total bot messages: ${finalCount}`);
  });

  // Step 7: Verify bot response with AI-powered evaluation
  await testStep('Verify AI Chatbot Response with OpenAI Evaluation', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
    
    logInfo('Bot response completed');
    
    const messageCount = await botMessages.count();
    logInfo(`Number of bot messages: ${messageCount}`);
    
    // Collect all bot responses
    let allBotText = '';
    console.log('\n========================================');
    console.log('AI CHATBOT RESPONSES:');
    console.log('========================================');
    for (let i = 1; i < messageCount; i++) {
      const messageText = await botMessages.nth(i).textContent() || '';
      allBotText += messageText + ' ';
      console.log(`\n--- Bot Message ${i + 1} ---`);
      console.log(messageText);
      console.log('----------------------------');
    }
    console.log('========================================\n');
    
    // Use OpenAI to evaluate the response
    const userQuestion = 'What are the key aspects of the windsor framework?';
    
    // Knowledge base: What the correct answer should cover
    const expectedContext = `The Windsor Framework (agreed 27 February 2023) introduces simplifications for smooth movement of goods within the UK internal market.

Key aspects:
1. Restoring Smooth Flow of Trade: Removes unnecessary red tape and checks for goods moving within UK market. Uses simplified processes including IMMI (Internal Market Movement Information) and Trader Goods Profile (TGP).

2. Safeguarding Northern Ireland's Place in the Union: Disapplies swathes of EU law, restores UK rules to fix everyday problems (food safety, medicines, alcohol duty). Ensures NI businesses retain full access to UK market.

3. Addressing the Democratic Deficit: Introduces the Stormont Brake - enabling votes in Stormont to lead to UK veto on new rules, providing democratic oversight and cross-community safeguards.

4. Protecting the EU Market: Goods moving GB to NI can use simplified IMMI dataset. Northern Ireland Retail Movement Scheme (NIRMS) categorizes goods as standard instead of Category 2.

5. New Legal and Constitutional Framework: Changes treaty text, scraps EU rules. Establishes new arrangements on goods movements to protect internal UK trade, removing unnecessary EU oversight.`;
    
    const minScore = 7; // Minimum score of 7/10 to pass
    
    const evaluation = await aiEvaluator.evaluateResponse(
      userQuestion,
      allBotText,
      expectedContext,
      minScore
    );
    
    // Assert based on AI evaluation
    if (!evaluation.passed) {
      throw new Error(
        `AI Chatbot response failed quality check.\n` +
        `Score: ${evaluation.score}/10 (${evaluation.percentage}%)\n` +
        `Required: ${evaluation.threshold}/10\n` +
        `Reasoning: ${evaluation.reasoning}`
      );
    }
    
    logInfo(`AI response passed evaluation with score: ${evaluation.score}/10`);
  });

});