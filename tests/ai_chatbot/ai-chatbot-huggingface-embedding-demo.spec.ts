
import { ENVIRONMENT_INFO } from '../../config/environment';
import { getBaseUrl, logInfo, test, testStep } from '../test-hooks';
import { huggingFaceEvaluator } from '../../services/huggingface-embedding-evaluator-service';

// Set viewport for all tests
test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(ENVIRONMENT_INFO.viewport.width, ENVIRONMENT_INFO.viewport.height);
});


test('AI Chatbot - Windsor Framework with Hugging Face Evaluation @smoke @ui @ai', async ({ t, portalPage, basePage, page }, testInfo) => {
  logInfo(`Starting AI Chatbot test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);
  
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
    const testMessage = 'What is IMO number?';
    await messageInput.fill(testMessage);
    logInfo(`Typed message: ${testMessage}`);
    
    // Wait to see the message
    await page.waitForTimeout(5000);
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
    await page.waitForTimeout(30000);
    
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

  // Step 7: Verify bot response with Hugging Face Embedding Evaluation
  await testStep('Verify AI Chatbot Response with Hugging Face Evaluation (FREE)', async () => {
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
    
    // Expected answer for evaluation
    const expectedAnswer = `The International Maritime Organisation (IMO) number is a unique identifier assigned to ships and vessels. It is used globally to ensure the safety and security of maritime operations. Here are some key points about the IMO number:

Purpose: The IMO number helps in tracking and identifying ships for safety, security, and environmental protection purposes.
Format: It is a seven-digit number assigned to ships and vessels.
Usage: The IMO number is required for various maritime operations, including the submission of Entry Summary Declarations for RoRo (Roll-on/Roll-off) movements.
For example, when submitting an Entry Summary Declaration for RoRo movements, the IMO number of the vessel is required along with the trailer identifier for unaccompanied movements or the vehicle registration number for accompanied movements.

This number ensures that the vessel can be accurately identified and tracked throughout its journey.

`;
    
    // Evaluate using FREE Hugging Face embeddings
    const evaluationResult = await huggingFaceEvaluator.evaluateResponse(
      expectedAnswer,
      allBotText
    );
    
    // Assert based on evaluation
    if (!evaluationResult.passed) {
      throw new Error(
        `AI Chatbot response failed quality check.\n` +
        `Score: ${(evaluationResult.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().similarityThreshold * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult.explanation}\n`
      );
    }
    
    logInfo(`AI response passed Hugging Face evaluation with score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log(`Score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult.metadata?.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  logInfo('AI Chatbot test with Hugging Face evaluation completed successfully');
});
