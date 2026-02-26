
import { ENVIRONMENT_INFO } from '../../config/environment';
import { getBaseUrl, logInfo, test, testStep } from '../test-hooks';
import { huggingFaceEvaluator } from '../../services/evaluators/implementations/huggingface-evaluator.service';
import { AllureTestManager } from '../../core/report/AllureTestManager';

// Set test timeout to 2 minutes for AI chatbot tests (AI responses can be slow)
test.setTimeout(120000);

// Set viewport for all tests
test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(ENVIRONMENT_INFO.viewport.width, ENVIRONMENT_INFO.viewport.height);
});


test('AI Chatbot - Vehicle Registration Number with Hugging Face Evaluation @smoke @ui @ai @happy', async ({ t, portalPage, basePage, page }, testInfo) => {
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
    const testMessage = 'What is vehicle registration number ?';
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
    const expectedAnswer = `A vehicle registration number is the unique identifier assigned to a vehicle by the relevant authorities. It is typically displayed on the vehicle's license plate. This number is used to identify the vehicle and is required for various administrative and legal purposes, including customs declarations.

To find the vehicle registration number:

Check the license plate: The registration number is displayed on the front and rear license plates of the vehicle.
Vehicle documents: The registration number can also be found in the vehicle's registration certificate (V5C), insurance documents, and any other official vehicle-related paperwork.
For accompanied RoRo movements, the vehicle registration number is mandatory and should be entered in the relevant data field. For unaccompanied RoRo movements, only the trailer number is required.
`;
    
    // Evaluate using FREE Hugging Face embeddings
    const evaluationResult = await huggingFaceEvaluator.evaluateResponse(
      expectedAnswer,
      allBotText
    );
    
    // Log evaluation metrics to Allure report
    AllureTestManager.addParameter('AI Evaluation Score', `${(evaluationResult.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Processing Time', `${evaluationResult.processingTimeMs}ms`);
    AllureTestManager.addParameter('Model', evaluationResult.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Evaluation Status', evaluationResult.passed ? 'PASSED' : 'FAILED');
    
    // Assert based on evaluation
    if (!evaluationResult.passed) {
      throw new Error(
        `AI Chatbot response failed quality check.\n` +
        `Score: ${(evaluationResult.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult.explanation}\n`
      );
    }
    
    logInfo(`AI response passed Hugging Face evaluation with score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log(`Score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  logInfo('AI Chatbot test with Hugging Face evaluation completed successfully');
});


test('AI Chatbot - Vehicle Registration Number with Hugging Face Evaluation - Unhappy Case @smoke @ui @ai @unhappy', async ({ t, portalPage, basePage, page }, testInfo) => {
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
    const testMessage = 'What is vehicle registration number ?';
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
    const expectedAnswer = `The Windsor Framework, agreed on 27 February 2023, introduces a new set of simplifications to facilitate the smooth movement of goods within the United Kingdom (UK) internal market. Here are some key aspects:

Restoring Trade Flow: The framework aims to restore the smooth flow of trade within the UK internal market by removing unnecessary red tape and checks for goods moving and remaining within the UK market.
Safeguarding Northern Ireland’s Place in the Union: It disapplies many EU laws and restores UK rules to address everyday problems in areas such as food safety, medicines supply, and alcohol duty rules.

Addressing the Democratic Deficit: The framework introduces the Stormont Brake, which allows votes in the Northern Ireland Assembly to lead to a UK veto on new rules, providing democratic oversight and cross-community safeguards.

Simplified Processes for Internal Market Movements: The framework includes simplified processes for moving goods 'not at risk' of entering the European Union (EU) from Great Britain (GB) to Northern Ireland (NI). These processes include:
A simplified dataset known as the Internal Market Movement Information (IMMI).
A Trader Goods Profile (TGP) to support the completion of the IMMI.
A new Entry in Declarant’s Records (EIDR) authorisation available to traders authorised under the UK Internal Market Scheme (UKIMS).
New Legal and Constitutional Framework: The framework changes the text of the treaty and scraps a range of EU rules, providing lasting certainty and stability for citizens and businesses in Northern Ireland.

Market Access: It ensures full access for Northern Ireland businesses to the EU market, alongside their full unfettered access to the whole UK market, providing unique opportunities for businesses and citizens in Northern Ireland.

For further details, you can refer to the Windsor Framework guidance available on the Northern Ireland Customs & Trade Academy (NICTA) website.
`;
    
    // Evaluate using FREE Hugging Face embeddings
    const evaluationResult = await huggingFaceEvaluator.evaluateResponse(
      expectedAnswer,
      allBotText
    );
    
    // Log evaluation metrics to Allure report
    AllureTestManager.addParameter('AI Evaluation Score', `${(evaluationResult.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Processing Time', `${evaluationResult.processingTimeMs}ms`);
    AllureTestManager.addParameter('Model', evaluationResult.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Evaluation Status', evaluationResult.passed ? 'PASSED' : 'FAILED');
    
    // UNHAPPY CASE: Assert that evaluation should FAIL (chatbot answer doesn't match expected answer)
    // We asked about "Vehicle Registration Number" but expected answer is about "Windsor Framework" (wrong topic)
    // Evaluation should detect this mismatch and return failed status
    if (evaluationResult.passed) {
      throw new Error(
        `UNHAPPY CASE FAILED: Evaluation should have failed but it passed.\n` +
        `Score: ${(evaluationResult.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Expected: Evaluation to detect mismatch between chatbot answer (Vehicle Registration) and expected answer (Windsor Framework)\n`
      );
    }
    
    logInfo(`UNHAPPY CASE PASSED: Evaluation correctly detected mismatch with score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log('UNHAPPY CASE - Evaluation correctly FAILED');
    console.log(`Score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log(`Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    console.log(`Model: ${evaluationResult.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  logInfo('AI Chatbot unhappy case test completed successfully - mismatch detected as expected');
});



test('AI Chatbot - Windsor Framework with Hugging Face Evaluation @smoke @ui @ai @happy', async ({ t, portalPage, basePage, page }, testInfo) => {
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
    const testMessage = 'What are the key aspects of the windsor framework?';
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
    await page.waitForTimeout(90000);
    
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
    const expectedAnswer = `The Windsor Framework, agreed on 27 February 2023, introduces a new set of simplifications to facilitate the smooth movement of goods within the United Kingdom (UK) internal market. Here are some key aspects:

Restoring Trade Flow: The framework aims to restore the smooth flow of trade within the UK internal market by removing unnecessary red tape and checks for goods moving and remaining within the UK market.
Safeguarding Northern Ireland’s Place in the Union: It disapplies many EU laws and restores UK rules to address everyday problems in areas such as food safety, medicines supply, and alcohol duty rules.

Addressing the Democratic Deficit: The framework introduces the Stormont Brake, which allows votes in the Northern Ireland Assembly to lead to a UK veto on new rules, providing democratic oversight and cross-community safeguards.

Simplified Processes for Internal Market Movements: The framework includes simplified processes for moving goods 'not at risk' of entering the European Union (EU) from Great Britain (GB) to Northern Ireland (NI). These processes include:
A simplified dataset known as the Internal Market Movement Information (IMMI).
A Trader Goods Profile (TGP) to support the completion of the IMMI.
A new Entry in Declarant’s Records (EIDR) authorisation available to traders authorised under the UK Internal Market Scheme (UKIMS).
New Legal and Constitutional Framework: The framework changes the text of the treaty and scraps a range of EU rules, providing lasting certainty and stability for citizens and businesses in Northern Ireland.

Market Access: It ensures full access for Northern Ireland businesses to the EU market, alongside their full unfettered access to the whole UK market, providing unique opportunities for businesses and citizens in Northern Ireland.

For further details, you can refer to the Windsor Framework guidance available on the Northern Ireland Customs & Trade Academy (NICTA) website.

`;
    
    // Evaluate using FREE Hugging Face embeddings
    const evaluationResult = await huggingFaceEvaluator.evaluateResponse(
      expectedAnswer,
      allBotText
    );
    
    // Log evaluation metrics to Allure report
    AllureTestManager.addParameter('AI Evaluation Score', `${(evaluationResult.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Processing Time', `${evaluationResult.processingTimeMs}ms`);
    AllureTestManager.addParameter('Model', evaluationResult.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Evaluation Status', evaluationResult.passed ? 'PASSED' : 'FAILED');
    
    // Assert based on evaluation
    if (!evaluationResult.passed) {
      throw new Error(
        `AI Chatbot response failed quality check.\n` +
        `Score: ${(evaluationResult.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult.explanation}\n`
      );
    }
    
    logInfo(`AI response passed Hugging Face evaluation with score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log(`Score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  logInfo('AI Chatbot test with Hugging Face evaluation completed successfully');
});



test('AI Chatbot - IMO Number with Hugging Face Evaluation @smoke @ui @ai @happy', async ({ t, portalPage, basePage, page }, testInfo) => {
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
    
    // Log evaluation metrics to Allure report
    AllureTestManager.addParameter('AI Evaluation Score', `${(evaluationResult.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Processing Time', `${evaluationResult.processingTimeMs}ms`);
    AllureTestManager.addParameter('Model', evaluationResult.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Evaluation Status', evaluationResult.passed ? 'PASSED' : 'FAILED');
    
    // Assert based on evaluation
    if (!evaluationResult.passed) {
      throw new Error(
        `AI Chatbot response failed quality check.\n` +
        `Score: ${(evaluationResult.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult.explanation}\n`
      );
    }
    
    logInfo(`AI response passed Hugging Face evaluation with score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log(`Score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  logInfo('AI Chatbot test with Hugging Face evaluation completed successfully');
});



test('AI Chatbot - Multiple Questions Flow with Hugging Face Evaluation @smoke @ui @ai @happy', async ({ t, portalPage, basePage, page }, testInfo) => {
  test.setTimeout(180000); // 3 minutes for multiple questions
  logInfo(`Starting AI Chatbot multi-question test from ${getBaseUrl()} with locale: ${ENVIRONMENT_INFO.currentLocale}`);
  
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
    
    // Log evaluation metrics to Allure report
    AllureTestManager.addParameter('AI Evaluation Score', `${(evaluationResult.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Processing Time', `${evaluationResult.processingTimeMs}ms`);
    AllureTestManager.addParameter('Model', evaluationResult.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Evaluation Status', evaluationResult.passed ? 'PASSED' : 'FAILED');
    
    // Assert based on evaluation
    if (!evaluationResult.passed) {
      throw new Error(
        `AI Chatbot response failed quality check.\n` +
        `Score: ${(evaluationResult.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult.explanation}\n`
      );
    }
    
    logInfo(`AI response passed Hugging Face evaluation with score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log(`Score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  logInfo('AI Chatbot test with Hugging Face evaluation completed successfully');
});
