import { ENVIRONMENT_INFO } from '../../config/environment';
import { getBaseUrl, logInfo, test, testStep } from '../test-hooks';
import { huggingFaceEvaluator } from '../../services/evaluators/implementations/huggingface-evaluator.service';
import { AllureTestManager } from '../../core/report/AllureTestManager';

// Set test timeout to 4 minutes for multi-question AI chatbot tests (3 questions)
// Using dynamic waitFor() instead of fixed waits for better efficiency
test.setTimeout(240000);

// Set viewport for all tests
test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(ENVIRONMENT_INFO.viewport.width, ENVIRONMENT_INFO.viewport.height);
});

test('AI Chatbot - Full Flow Demo @smoke @ui @ai @happy', async ({ t, portalPage, basePage, page }, testInfo) => {
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

  // Step 5: Ask FIRST question about Nationality of Means of Transport
  await testStep('Ask first question: Nationality of Means of Transport', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const messageInput = chatFrame.locator('div.message-input[role="textbox"][contenteditable="true"]');
    
    // Wait for input to be visible
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
    logInfo('Message input is visible');
    
    // Type first question
    const testMessage = 'What is Nationality of Means of Transport?';
    await messageInput.fill(testMessage);
    logInfo(`Typed Q1: ${testMessage}`);
    
    // Log question to Allure report for tracking
    AllureTestManager.addParameter('Q1 Question', testMessage);
    
    // Wait to see the message
    await page.waitForTimeout(2000);
  });

  // Step 6: Send first question and wait for complete response
  await testStep('Send first question and wait for response', async () => {
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
    logInfo('Q1 sent');
    
    // Wait for NEW bot message to appear dynamically (instead of fixed 30s)
    await botMessages.nth(initialCount).waitFor({ state: 'visible', timeout: 60000 });
    logInfo('Q1 first response appeared');
    
    // Wait until message count becomes STABLE (AI finished sending all messages)
    let stableCount = 0;
    let previousCount = initialCount;
    const maxWaitTime = 30000; // 30 seconds max
    const startTime = Date.now();
    
    while (stableCount < 3 && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(1000); // Check every 1 second
      
      const currentCount = await botMessages.count();
      logInfo(`Checking Q1... Current bot messages: ${currentCount}`);
      
      if (currentCount === previousCount) {
        stableCount++; // Count is same, increment stable counter
        logInfo(`Q1 Stable check ${stableCount}/3`);
      } else {
        stableCount = 0; // Count changed, reset
        previousCount = currentCount;
        logInfo(`Q1 Count changed to ${currentCount}`);
      }
    }
    
    const finalCount = await botMessages.count();
    logInfo(`AI finished Q1. Total bot messages: ${finalCount}`);
  });

  // Step 7: Verify FIRST question response with HuggingFace evaluation
  await testStep('Verify Q1 Response (IMO Number)', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
    
    logInfo('Q1 bot response completed');
    
    const messageCount = await botMessages.count();
    logInfo(`Number of bot messages for Q1: ${messageCount}`);
    
    // Collect all bot responses
    let allBotText = '';
    console.log('\n========================================');
    console.log('Q1 - AI CHATBOT RESPONSES:');
    console.log('========================================');
    for (let i = 1; i < messageCount; i++) {
      const messageText = await botMessages.nth(i).textContent() || '';
      allBotText += messageText + ' ';
      console.log(`\n--- Bot Message ${i + 1} ---`);
      console.log(messageText);
      console.log('----------------------------');
    }
    console.log('========================================\n');
    
    // Expected answer for IMO Number
    const expectedAnswer = `The "Nationality of Means of Transport" refers to the nationality of the active means of transport crossing the border. This is the country where the transport vehicle (such as an aircraft, vessel, or truck) is registered.

For example:

For air transport, it would be the country where the aircraft is registered.
For maritime transport, it would be the country where the vessel is registered.
For road transport, it would be the country where the truck is registered.
This information is required in various types of declarations, such as the Entry Summary Declaration, Simplified Frontier Declaration, Full Frontier Declaration, and Supplementary Declaration, depending on the scenario.

`;
    
    // Evaluate using FREE Hugging Face embeddings
    const evaluationResult = await huggingFaceEvaluator.evaluateResponse(
      expectedAnswer,
      allBotText
    );
    
    // Log evaluation metrics to Allure report (Q1)
    AllureTestManager.addParameter('Q1 AI Evaluation Score', `${(evaluationResult.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Q1 Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Q1 Processing Time', `${evaluationResult.processingTimeMs}ms`);
    AllureTestManager.addParameter('Q1 Model', evaluationResult.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Q1 Evaluation Status', evaluationResult.passed ? 'PASSED' : 'FAILED');
    
    // Assert based on evaluation
    if (!evaluationResult.passed) {
      throw new Error(
        `Q1 (IMO Number) failed quality check.\n` +
        `Score: ${(evaluationResult.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult.explanation}\n`
      );
    }
    
    logInfo(`Q1 passed Hugging Face evaluation with score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log('Q1 EVALUATION RESULT (IMO Number):');
    console.log(`Score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  // Step 8: Ask SECOND question about Windsor Framework
  await testStep('Ask second question: Windsor Framework', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const messageInput = chatFrame.locator('div.message-input[role="textbox"][contenteditable="true"]');
    const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
    const sendButton = chatFrame.locator('button:has(svg path[fill="currentColor"])');
    
    // KEY POINT: Count current messages BEFORE asking second question
    const initialCount = await botMessages.count();
    logInfo(`Current bot messages before Q2: ${initialCount}`);
    
    // Type second question
    const secondQuestion = 'For RoRo Unaccompanied flow, Is it need to require Nationality of Means of Transport?';
    await messageInput.fill(secondQuestion);
    logInfo(`Typed Q2: ${secondQuestion}`);
    
    // Log question to Allure report for tracking
    AllureTestManager.addParameter('Q2 Question', secondQuestion);
    
    await page.waitForTimeout(2000);
    
    // Send second question
    await sendButton.click();
    logInfo('Q2 sent');
    
    // Wait for response dynamically (instead of fixed 90s)
    await botMessages.nth(initialCount).waitFor({ state: 'visible', timeout: 90000 });
    logInfo('Q2 first response appeared');
    
    // Wait until message count becomes STABLE
    let stableCount = 0;
    let previousCount = initialCount;
    const maxWaitTime = 30000;
    const startTime = Date.now();
    
    while (stableCount < 3 && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(1000);
      const currentCount = await botMessages.count();
      logInfo(`Checking Q2... Current: ${currentCount}`);
      
      if (currentCount === previousCount) {
        stableCount++;
        logInfo(`Q2 Stable check ${stableCount}/3`);
      } else {
        stableCount = 0;
        previousCount = currentCount;
        logInfo(`Q2 Count changed to ${currentCount}`);
      }
    }
    
    const finalCount = await botMessages.count();
    logInfo(`AI finished Q2. Total messages: ${finalCount}`);
    
    // KEY POINT: Collect only NEW responses (messages from initialCount to finalCount)
    let newBotText = '';
    console.log('\n========================================');
    console.log('Q2 - AI CHATBOT RESPONSES (Windsor Framework):');
    console.log('========================================');
    for (let i = initialCount; i < finalCount; i++) {
      const messageText = await botMessages.nth(i).textContent() || '';
      newBotText += messageText + ' ';
      console.log(`\n--- Bot Message ${i + 1} ---`);
      console.log(messageText);
      console.log('----------------------------');
    }
    console.log('========================================\n');
    
    // Expected answer for Windsor Framework
    const expectedAnswer2 = `Yes, for RoRo (Roll-on Roll-off) Unaccompanied movements, the "Nationality of Means of Transport" is required. This field should indicate the country where the trailer is registered. This information is mandatory for the Entry Summary Declaration and other relevant declarations.`;
    
    // Evaluate second response
    const evaluationResult2 = await huggingFaceEvaluator.evaluateResponse(
      expectedAnswer2,
      newBotText
    );
    
    // Log evaluation metrics for Question 2
    AllureTestManager.addParameter('Q2 AI Evaluation Score', `${(evaluationResult2.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Q2 Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Q2 Processing Time', `${evaluationResult2.processingTimeMs}ms`);
    AllureTestManager.addParameter('Q2 Model', evaluationResult2.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Q2 Evaluation Status', evaluationResult2.passed ? 'PASSED' : 'FAILED');
    
    // Assert based on evaluation
    if (!evaluationResult2.passed) {
      throw new Error(
        `Q2 (Windsor Framework) failed quality check.\n` +
        `Score: ${(evaluationResult2.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult2.explanation}\n`
      );
    }
    
    logInfo(`Q2 passed Hugging Face evaluation with score: ${(evaluationResult2.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log('Q2 EVALUATION RESULT (Windsor Framework):');
    console.log(`Score: ${(evaluationResult2.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult2.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult2.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  // Step 9: Ask THIRD question about how to know Nationality of Means of Transport
  await testStep('Ask third question: How to know Nationality of Means of Transport', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const messageInput = chatFrame.locator('div.message-input[role="textbox"][contenteditable="true"]');
    const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
    const sendButton = chatFrame.locator('button:has(svg path[fill="currentColor"])');
    
    // KEY POINT: Count current messages BEFORE asking third question
    const initialCount = await botMessages.count();
    logInfo(`Current bot messages before Q3: ${initialCount}`);
    
    // Type third question
    const thirdQuestion = 'So how to know Nationality of Means of Transport and choose it correctly?';
    await messageInput.fill(thirdQuestion);
    logInfo(`Typed Q3: ${thirdQuestion}`);
    
    // Log question to Allure report for tracking
    AllureTestManager.addParameter('Q3 Question', thirdQuestion);
    
    await page.waitForTimeout(2000);
    
    // Send third question
    await sendButton.click();
    logInfo('Q3 sent');
    
    // Wait for response dynamically (instead of fixed 30s)
    await botMessages.nth(initialCount).waitFor({ state: 'visible', timeout: 60000 });
    logInfo('Q3 first response appeared');
    
    // Wait until message count becomes STABLE
    let stableCount = 0;
    let previousCount = initialCount;
    const maxWaitTime = 30000;
    const startTime = Date.now();
    
    while (stableCount < 3 && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(1000);
      const currentCount = await botMessages.count();
      logInfo(`Checking Q3... Current: ${currentCount}`);
      
      if (currentCount === previousCount) {
        stableCount++;
        logInfo(`Q3 Stable check ${stableCount}/3`);
      } else {
        stableCount = 0;
        previousCount = currentCount;
        logInfo(`Q3 Count changed to ${currentCount}`);
      }
    }
    
    const finalCount = await botMessages.count();
    logInfo(`AI finished Q3. Total messages: ${finalCount}`);
    
    // KEY POINT: Collect only NEW responses (messages from initialCount to finalCount)
    let newBotText = '';
    console.log('\n========================================');
    console.log('Q3 - AI CHATBOT RESPONSES (How to know Nationality):');
    console.log('========================================');
    for (let i = initialCount; i < finalCount; i++) {
      const messageText = await botMessages.nth(i).textContent() || '';
      newBotText += messageText + ' ';
      console.log(`\n--- Bot Message ${i + 1} ---`);
      console.log(messageText);
      console.log('----------------------------');
    }
    console.log('========================================\n');
    
    // Expected answer for how to determine Nationality of Means of Transport
    const expectedAnswer3 = `To determine Nationality of Means of Transport:

1. Identify the active means of transport (truck, trailer, vessel, aircraft)
2. Check the vehicle registration documents to find the country where it is registered
3. Select that country from the drop-down list in the declaration form

For road vehicles (trucks/trailers): Check vehicle registration documents
For vessels: Check vessel registration details  
For aircraft: Use IATA flight number instead of nationality

Example: If using a UK-registered truck, select "United Kingdom" from the list.
`;
    
    // Evaluate third response
    const evaluationResult3 = await huggingFaceEvaluator.evaluateResponse(
      expectedAnswer3,
      newBotText
    );
    
    // Log evaluation metrics for Question 3
    AllureTestManager.addParameter('Q3 AI Evaluation Score', `${(evaluationResult3.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Q3 Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Q3 Processing Time', `${evaluationResult3.processingTimeMs}ms`);
    AllureTestManager.addParameter('Q3 Model', evaluationResult3.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Q3 Evaluation Status', evaluationResult3.passed ? 'PASSED' : 'FAILED');
    
    // Assert based on evaluation
    if (!evaluationResult3.passed) {
      throw new Error(
        `Q3 (How to know Nationality) failed quality check.\n` +
        `Score: ${(evaluationResult3.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult3.explanation}\n`
      );
    }
    
    logInfo(`Q3 passed Hugging Face evaluation with score: ${(evaluationResult3.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log('Q3 EVALUATION RESULT (How to know Nationality):');
    console.log(`Score: ${(evaluationResult3.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult3.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult3.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  logInfo('AI Chatbot multi-question test completed successfully - All 3 questions passed!');
});


test('AI Chatbot - Full Flow Demo - Separate @smoke @ui @ai @happy', async ({ t, portalPage, basePage, page }, testInfo) => {
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

  // Step 5: Ask FIRST question about Nationality of Means of Transport
  await testStep('Ask first question: Nationality of Means of Transport', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const messageInput = chatFrame.locator('div.message-input[role="textbox"][contenteditable="true"]');
    
    // Wait for input to be visible
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
    logInfo('Message input is visible');
    
    // Type first question
    const testMessage = 'What is vehicle registration number ?';
    await messageInput.fill(testMessage);
    logInfo(`Typed Q1: ${testMessage}`);
    
    // Log question to Allure report for tracking
    AllureTestManager.addParameter('Q1 Question', testMessage);
    
    // Wait to see the message
    await page.waitForTimeout(2000);
  });

  // Step 6: Send first question and wait for complete response
  await testStep('Send first question and wait for response', async () => {
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
    logInfo('Q1 sent');
    
    // Wait for NEW bot message to appear dynamically (instead of fixed 30s)
    await botMessages.nth(initialCount).waitFor({ state: 'visible', timeout: 60000 });
    logInfo('Q1 first response appeared');
    
    // Wait until message count becomes STABLE (AI finished sending all messages)
    let stableCount = 0;
    let previousCount = initialCount;
    const maxWaitTime = 30000; // 30 seconds max
    const startTime = Date.now();
    
    while (stableCount < 3 && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(1000); // Check every 1 second
      
      const currentCount = await botMessages.count();
      logInfo(`Checking Q1... Current bot messages: ${currentCount}`);
      
      if (currentCount === previousCount) {
        stableCount++; // Count is same, increment stable counter
        logInfo(`Q1 Stable check ${stableCount}/3`);
      } else {
        stableCount = 0; // Count changed, reset
        previousCount = currentCount;
        logInfo(`Q1 Count changed to ${currentCount}`);
      }
    }
    
    const finalCount = await botMessages.count();
    logInfo(`AI finished Q1. Total bot messages: ${finalCount}`);
  });

  // Step 7: Verify FIRST question response with HuggingFace evaluation
  await testStep('Verify Q1 Response (IMO Number)', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
    
    logInfo('Q1 bot response completed');
    
    const messageCount = await botMessages.count();
    logInfo(`Number of bot messages for Q1: ${messageCount}`);
    
    // Collect all bot responses
    let allBotText = '';
    console.log('\n========================================');
    console.log('Q1 - AI CHATBOT RESPONSES:');
    console.log('========================================');
    for (let i = 1; i < messageCount; i++) {
      const messageText = await botMessages.nth(i).textContent() || '';
      allBotText += messageText + ' ';
      console.log(`\n--- Bot Message ${i + 1} ---`);
      console.log(messageText);
      console.log('----------------------------');
    }
    console.log('========================================\n');
    
    // Expected answer for IMO Number
    const expectedAnswer = `A vehicle registration number is the unique identifier assigned to a vehicle by the relevant authorities. It is typically displayed on the vehicle's license plate. This number is used to identify the vehicle and is required for various administrative and legal purposes, including customs declarations.
To find the vehicle registration number:
Check the license plate: The registration number is displayed on the front and rear license plates of the vehicle.
Vehicle documents: The registration number can also be found in the vehicle's registration certificate (V5C), insurance documents, and any other official vehicle-related paperwork.
For accompanied RoRo movements, the vehicle registration number is mandatory and should be entered in the relevant data field. For unaccompanied RoRo movements, only the trailer number is required.`;
    
    // Evaluate using FREE Hugging Face embeddings
    const evaluationResult = await huggingFaceEvaluator.evaluateResponse(
      expectedAnswer,
      allBotText
    );
    
    // Log evaluation metrics to Allure report (Q1)
    AllureTestManager.addParameter('Q1 AI Evaluation Score', `${(evaluationResult.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Q1 Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Q1 Processing Time', `${evaluationResult.processingTimeMs}ms`);
    AllureTestManager.addParameter('Q1 Model', evaluationResult.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Q1 Evaluation Status', evaluationResult.passed ? 'PASSED' : 'FAILED');
    
    // Assert based on evaluation
    if (!evaluationResult.passed) {
      throw new Error(
        `Q1 (IMO Number) failed quality check.\n` +
        `Score: ${(evaluationResult.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult.explanation}\n`
      );
    }
    
    logInfo(`Q1 passed Hugging Face evaluation with score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log('Q1 EVALUATION RESULT (IMO Number):');
    console.log(`Score: ${(evaluationResult.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  // Step 8: Ask SECOND question about Windsor Framework
  await testStep('Ask second question: Windsor Framework', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const messageInput = chatFrame.locator('div.message-input[role="textbox"][contenteditable="true"]');
    const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
    const sendButton = chatFrame.locator('button:has(svg path[fill="currentColor"])');
    
    // KEY POINT: Count current messages BEFORE asking second question
    const initialCount = await botMessages.count();
    logInfo(`Current bot messages before Q2: ${initialCount}`);
    
    // Type second question
    const secondQuestion = 'What are the key aspects of the windsor framework?';
    await messageInput.fill(secondQuestion);
    logInfo(`Typed Q2: ${secondQuestion}`);
    
    // Log question to Allure report for tracking
    AllureTestManager.addParameter('Q2 Question', secondQuestion);
    
    await page.waitForTimeout(2000);
    
    // Send second question
    await sendButton.click();
    logInfo('Q2 sent');
    
    // Wait for response dynamically (instead of fixed 90s)
    await botMessages.nth(initialCount).waitFor({ state: 'visible', timeout: 90000 });
    logInfo('Q2 first response appeared');
    
    // Wait until message count becomes STABLE
    let stableCount = 0;
    let previousCount = initialCount;
    const maxWaitTime = 30000;
    const startTime = Date.now();
    
    while (stableCount < 3 && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(1000);
      const currentCount = await botMessages.count();
      logInfo(`Checking Q2... Current: ${currentCount}`);
      
      if (currentCount === previousCount) {
        stableCount++;
        logInfo(`Q2 Stable check ${stableCount}/3`);
      } else {
        stableCount = 0;
        previousCount = currentCount;
        logInfo(`Q2 Count changed to ${currentCount}`);
      }
    }
    
    const finalCount = await botMessages.count();
    logInfo(`AI finished Q2. Total messages: ${finalCount}`);
    
    // KEY POINT: Collect only NEW responses (messages from initialCount to finalCount)
    let newBotText = '';
    console.log('\n========================================');
    console.log('Q2 - AI CHATBOT RESPONSES (Windsor Framework):');
    console.log('========================================');
    for (let i = initialCount; i < finalCount; i++) {
      const messageText = await botMessages.nth(i).textContent() || '';
      newBotText += messageText + ' ';
      console.log(`\n--- Bot Message ${i + 1} ---`);
      console.log(messageText);
      console.log('----------------------------');
    }
    console.log('========================================\n');
    
    // Expected answer for Windsor Framework
    const expectedAnswer2 = `The Windsor Framework, agreed on 27 February 2023, introduces a new set of simplifications to facilitate the smooth movement of goods within the United Kingdom (UK) internal market. Here are some key aspects:
Restoring Trade Flow: The framework aims to restore the smooth flow of trade within the UK internal market by removing unnecessary red tape and checks for goods moving and remaining within the UK market.
Safeguarding Northern Ireland’s Place in the Union: It disapplies many EU laws and restores UK rules to address everyday problems in areas such as food safety, medicines supply, and alcohol duty rules.
Addressing the Democratic Deficit: The framework introduces the Stormont Brake, which allows votes in the Northern Ireland Assembly to lead to a UK veto on new rules, providing democratic oversight and cross-community safeguards.
Simplified Processes for Internal Market Movements: The framework includes simplified processes for moving goods 'not at risk' of entering the European Union (EU) from Great Britain (GB) to Northern Ireland (NI). These processes include:
A simplified dataset known as the Internal Market Movement Information (IMMI).
A Trader Goods Profile (TGP) to support the completion of the IMMI.
A new Entry in Declarant’s Records (EIDR) authorisation available to traders authorised under the UK Internal Market Scheme (UKIMS).
New Legal and Constitutional Framework: The framework changes the text of the treaty and scraps a range of EU rules, providing lasting certainty and stability for citizens and businesses in Northern Ireland.
Market Access: It ensures full access for Northern Ireland businesses to the EU market, alongside their full unfettered access to the whole UK market, providing unique opportunities for businesses and citizens in Northern Ireland.
For further details, you can refer to the Windsor Framework guidance available on the Northern Ireland Customs & Trade Academy (NICTA) website.`;
    
    // Evaluate second response
    const evaluationResult2 = await huggingFaceEvaluator.evaluateResponse(
      expectedAnswer2,
      newBotText
    );
    
    // Log evaluation metrics for Question 2
    AllureTestManager.addParameter('Q2 AI Evaluation Score', `${(evaluationResult2.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Q2 Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Q2 Processing Time', `${evaluationResult2.processingTimeMs}ms`);
    AllureTestManager.addParameter('Q2 Model', evaluationResult2.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Q2 Evaluation Status', evaluationResult2.passed ? 'PASSED' : 'FAILED');
    
    // Assert based on evaluation
    if (!evaluationResult2.passed) {
      throw new Error(
        `Q2 (Windsor Framework) failed quality check.\n` +
        `Score: ${(evaluationResult2.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult2.explanation}\n`
      );
    }
    
    logInfo(`Q2 passed Hugging Face evaluation with score: ${(evaluationResult2.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log('Q2 EVALUATION RESULT (Windsor Framework):');
    console.log(`Score: ${(evaluationResult2.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult2.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult2.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  // Step 9: Ask THIRD question about how to know Nationality of Means of Transport
  await testStep('Ask third question: How to know Nationality of Means of Transport', async () => {
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const messageInput = chatFrame.locator('div.message-input[role="textbox"][contenteditable="true"]');
    const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
    const sendButton = chatFrame.locator('button:has(svg path[fill="currentColor"])');
    
    // KEY POINT: Count current messages BEFORE asking third question
    const initialCount = await botMessages.count();
    logInfo(`Current bot messages before Q3: ${initialCount}`);
    
    // Type third question
    const thirdQuestion = 'What is IMO number?';
    await messageInput.fill(thirdQuestion);
    logInfo(`Typed Q3: ${thirdQuestion}`);
    
    // Log question to Allure report for tracking
    AllureTestManager.addParameter('Q3 Question', thirdQuestion);
    
    await page.waitForTimeout(2000);
    
    // Send third question
    await sendButton.click();
    logInfo('Q3 sent');
    
    // Wait for response dynamically (instead of fixed 30s)
    await botMessages.nth(initialCount).waitFor({ state: 'visible', timeout: 60000 });
    logInfo('Q3 first response appeared');
    
    // Wait until message count becomes STABLE
    let stableCount = 0;
    let previousCount = initialCount;
    const maxWaitTime = 30000;
    const startTime = Date.now();
    
    while (stableCount < 3 && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(1000);
      const currentCount = await botMessages.count();
      logInfo(`Checking Q3... Current: ${currentCount}`);
      
      if (currentCount === previousCount) {
        stableCount++;
        logInfo(`Q3 Stable check ${stableCount}/3`);
      } else {
        stableCount = 0;
        previousCount = currentCount;
        logInfo(`Q3 Count changed to ${currentCount}`);
      }
    }
    
    const finalCount = await botMessages.count();
    logInfo(`AI finished Q3. Total messages: ${finalCount}`);
    
    // KEY POINT: Collect only NEW responses (messages from initialCount to finalCount)
    let newBotText = '';
    console.log('\n========================================');
    console.log('Q3 - AI CHATBOT RESPONSES (How to know Nationality):');
    console.log('========================================');
    for (let i = initialCount; i < finalCount; i++) {
      const messageText = await botMessages.nth(i).textContent() || '';
      newBotText += messageText + ' ';
      console.log(`\n--- Bot Message ${i + 1} ---`);
      console.log(messageText);
      console.log('----------------------------');
    }
    console.log('========================================\n');
    
    // Expected answer for how to determine Nationality of Means of Transport
    const expectedAnswer3 = `The International Maritime Organisation (IMO) number is a unique identifier assigned to ships and vessels. It is used globally to ensure the safety and security of maritime operations. Here are some key points about the IMO number:
Purpose: The IMO number helps in tracking and identifying ships for safety, security, and environmental protection purposes.
Format: It is a seven-digit number assigned to ships and vessels.
Usage: The IMO number is required for various maritime operations, including the submission of Entry Summary Declarations for RoRo (Roll-on/Roll-off) movements.
For example, when submitting an Entry Summary Declaration for RoRo movements, the IMO number of the vessel is required along with the trailer identifier for unaccompanied movements or the vehicle registration number for accompanied movements.
This number ensures that the vessel can be accurately identified and tracked throughout its journey.`;
    
    // Evaluate third response
    const evaluationResult3 = await huggingFaceEvaluator.evaluateResponse(
      expectedAnswer3,
      newBotText
    );
    
    // Log evaluation metrics for Question 3
    AllureTestManager.addParameter('Q3 AI Evaluation Score', `${(evaluationResult3.score * 100).toFixed(1)}%`);
    AllureTestManager.addParameter('Q3 Similarity Threshold', `${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%`);
    AllureTestManager.addParameter('Q3 Processing Time', `${evaluationResult3.processingTimeMs}ms`);
    AllureTestManager.addParameter('Q3 Model', evaluationResult3.metadata?.model || 'N/A');
    AllureTestManager.addParameter('Q3 Evaluation Status', evaluationResult3.passed ? 'PASSED' : 'FAILED');
    
    // Assert based on evaluation
    if (!evaluationResult3.passed) {
      throw new Error(
        `Q3 (How to know Nationality) failed quality check.\n` +
        `Score: ${(evaluationResult3.score * 100).toFixed(1)}%\n` +
        `Threshold: ${(huggingFaceEvaluator.getConfig().threshold! * 100).toFixed(0)}%\n` +
        `Explanation: ${evaluationResult3.explanation}\n`
      );
    }
    
    logInfo(`Q3 passed Hugging Face evaluation with score: ${(evaluationResult3.score * 100).toFixed(1)}%`);
    console.log('\n========================================');
    console.log('Q3 EVALUATION RESULT (How to know Nationality):');
    console.log(`Score: ${(evaluationResult3.score * 100).toFixed(1)}%`);
    console.log(`Model: ${evaluationResult3.metadata?.model}`);
    console.log(`Processing Time: ${evaluationResult3.processingTimeMs}ms`);
    console.log('========================================\n');
  });

  logInfo('AI Chatbot multi-question test completed successfully - All 3 questions passed!');
});

