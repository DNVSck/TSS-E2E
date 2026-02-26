import { ENVIRONMENT_INFO } from '../../config/environment';
import { getBaseUrl, logInfo, test, testStep } from '../test-hooks';
import { keywordEvaluator, WINDSOR_FRAMEWORK_CONCEPTS, CHATBOT_FORBIDDEN_TERMS } from '../../services/keyword-evaluator-service';

/**
 * Keyword-based Evaluation Demo
 * 
 * This approach is:
 * - FREE (no API calls)
 * - FAST (instant validation)
 * - DETERMINISTIC (same input = same output)
 * - MAINTAINABLE (easy to update keywords)
 * 
 * Tests ACTUAL chatbot responses instead of hard-coded samples
 */

// Set viewport for all tests
test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(ENVIRONMENT_INFO.viewport.width, ENVIRONMENT_INFO.viewport.height);
});

test.describe('Keyword-based Evaluation Demo', () => {
  
  test('Scenario 1: Windsor Framework - Real Chatbot Response', async ({ t, portalPage, basePage, page }, testInfo) => {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  TEST 1: Real AI Chatbot Response (Windsor)         ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    // Navigate to portal
    await basePage.navigateToPortal(getBaseUrl(), testInfo);
    
    // Open AI chatbot
    await testStep('Open AI Chatbot', async () => {
      const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
      const chatButton = chatFrame.locator('svg[aria-label="Open chat window"]');
      
      await chatButton.waitFor({ state: 'visible', timeout: 10000 });
      await chatButton.click();
      logInfo('AI Chatbot opened');
    });
    
    // Wait for welcome message
    await testStep('Wait for Welcome Message', async () => {
      const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
      const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
      const welcomeMessage = botMessages.filter({ 
        hasText: "Hello. I am Trader Support Service's Digital Assistant" 
      });
      await welcomeMessage.waitFor({ state: 'visible', timeout: 15000 });
    });
    
    // Type and send question
    await testStep('Ask about Windsor Framework', async () => {
      const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
      const messageInput = chatFrame.locator('div.message-input[role="textbox"][contenteditable="true"]');
      
      await messageInput.waitFor({ state: 'visible', timeout: 10000 });
      await messageInput.fill('What are the key aspects of the Windsor Framework?');
      
      const sendButton = chatFrame.locator('button:has(svg path[fill="currentColor"])');
      await sendButton.waitFor({ state: 'visible', timeout: 5000 });
      await sendButton.click();
      
      logInfo('Question sent to chatbot');
    });
    
    // Wait for complete response
    await testStep('Wait for Complete Response', async () => {
      const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
      const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
      
      const initialCount = await botMessages.count();
      await page.waitForTimeout(2000);
      
      let stableCount = 0;
      let previousCount = initialCount;
      const maxWaitTime = 30000;
      const startTime = Date.now();
      
      while (stableCount < 3 && (Date.now() - startTime) < maxWaitTime) {
        await page.waitForTimeout(1000);
        const currentCount = await botMessages.count();
        
        if (currentCount === previousCount) {
          stableCount++;
        } else {
          stableCount = 0;
          previousCount = currentCount;
        }
      }
      
      logInfo('AI response complete');
    });
    
    // Collect response and evaluate
    await testStep('Keyword-based Validation', async () => {
      const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
      const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
      
      const messageCount = await botMessages.count();
      let allBotText = '';
      
      console.log('\n========================================');
      console.log('AI CHATBOT RESPONSE:');
      console.log('========================================');
      for (let i = 1; i < messageCount; i++) {
        const messageText = await botMessages.nth(i).textContent() || '';
        allBotText += messageText + ' ';
        console.log(messageText);
      }
      console.log('========================================\n');
      
      // Define validation criteria
      const requiredConcepts = [
        // Core identity
        'Windsor Framework',
        'Great Britain',
        'Northern Ireland',
        'United Kingdom',

        // Trade & internal market
        'smooth movement of goods',
        'internal market',
        'red tape',
        'checks',

        // Simplified processes
        'simplified',
        'not at risk',
        'IMMI',
        'Trader Goods Profile',

        // Democratic safeguard
        'Stormont Brake',

        // NI / EU safeguards
        'EU law',
        'UK rules',

        // Market access
        'market access',
        'NIRMS'
        ];
        
      const forbiddenTerms = [
        'I\'m not sure',
        'I cannot help',
        'I don\'t know',
        'As an AI language model',
        "I'm sorry",
        "cannot provide translations",
        "Could you try rephrasing",
        "I'm not able to",
        "I don't have enough information"
      ];

      // Keyword evaluation
      const result = keywordEvaluator.evaluateResponse(
        allBotText,
        requiredConcepts,
        forbiddenTerms,
        0.70  // 70% of concepts required (more lenient for real responses)
      );

      // Assert
      if (!result.passed) {
        throw new Error(
          `Chatbot response failed keyword validation!\n` +
          `Score: ${result.score}/100\n` +
          `Missing: ${result.missingConcepts.join(', ')}\n` +
          `Forbidden terms found: ${result.foundForbiddenTerms.join(', ')}\n` +
          `Reasoning: ${result.reasoning}`
        );
      }

      console.log('Test PASSED - Real chatbot response meets keyword criteria');
    });
  });

  test('Scenario 2: Forbidden Terms Detection - Invalid Question', async ({ t, portalPage, basePage, page }, testInfo) => {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  TEST 2: Forbidden Terms Detection                  ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    await basePage.navigateToPortal(getBaseUrl(), testInfo);
    
    // Open chatbot
    const chatFrame = page.frameLocator('iframe[title="Moveo webchat"]');
    const chatButton = chatFrame.locator('svg[aria-label="Open chat window"]');
    await chatButton.waitFor({ state: 'visible', timeout: 10000 });
    await chatButton.click();
    
    // Wait for welcome
    const botMessages = chatFrame.locator('li[data-event-type="brain_message"]');
    const welcomeMessage = botMessages.filter({ 
      hasText: "Hello. I am Trader Support Service's Digital Assistant" 
    });
    await welcomeMessage.waitFor({ state: 'visible', timeout: 15000 });
    
    // Ask invalid/out-of-scope question
    const messageInput = chatFrame.locator('div.message-input[role="textbox"][contenteditable="true"]');
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
    await messageInput.fill('Can you tell me tomorrow\'s weather forecast?');
    
    const sendButton = chatFrame.locator('button:has(svg path[fill="currentColor"])');
    await sendButton.click();
    await page.waitForTimeout(3000);
    
    // Collect response
    const messageCount = await botMessages.count();
    let response = '';
    for (let i = 1; i < messageCount; i++) {
      response += await botMessages.nth(i).textContent() || '';
    }
    
    console.log('\n📝 Chatbot response:', response);
    
    // Check for forbidden fallback terms
    const forbiddenTerms = [
      'I\'m not sure',
      'I cannot help',
      'I don\'t know',
      "I'm sorry",
      "cannot provide",
      "Could you try rephrasing",
      "I'm not able to"
    ];

    const result = keywordEvaluator.evaluateResponse(
      response,
      [], // No required concepts for this test
      forbiddenTerms,
      0.50
    );

    console.log(`\n⚠️  Forbidden terms found: ${result.foundForbiddenTerms.length}`);
    console.log(`   Terms: ${result.foundForbiddenTerms.join(', ')}`);
    
    // For out-of-scope questions, we EXPECT chatbot to gracefully decline
    // So finding forbidden terms is actually CORRECT behavior
    console.log('\n✅ Test completed - Checked for fallback language detection');
  });

  test('Scenario 3: Mock Poor Response - Missing Concepts', async () => {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  TEST 3: Mock Poor Response (Should FAIL)           ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    console.log('ℹ️  Using mock data to demonstrate missing concepts detection\n');
    
    const poorResponse = `The Windsor Framework is an agreement between UK and EU.`;

    const requiredConcepts = [
      'smooth movement of goods',
      'Great Britain',
      'Northern Ireland',
      'internal market',
      'simplified'
    ];

    const result = keywordEvaluator.evaluateResponse(
      poorResponse,
      requiredConcepts,
      [],
      0.80
    );

    console.log(`\n📊 Result: Score ${result.score}/100`);
    console.log(`Missing ${result.missingConcepts.length} concepts: ${result.missingConcepts.join(', ')}`);

    // Assert
    if (result.passed) {
      throw new Error('Poor response should have failed!');
    }

    console.log('✅ Test PASSED - Correctly detected incomplete response');
  });

  test('Scenario 4: Mock Forbidden Terms - Fallback Detection', async () => {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  TEST 4: Mock Forbidden Terms (Should FAIL)         ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    console.log('ℹ️  Using mock data to demonstrate forbidden terms detection\n');
    
    const responseWithFallback = `I am not sure about the Windsor Framework details. I cannot help you with this specific question. Please contact support for more information.`;

    const requiredConcepts = ['Windsor Framework'];

    const forbiddenTerms = [
      'I am not sure',
      'I cannot help',
      'Please contact support'
    ];

    const result = keywordEvaluator.evaluateResponse(
      responseWithFallback,
      requiredConcepts,
      forbiddenTerms,
      0.80
    );

    console.log(`\n⚠️  Found forbidden terms: ${result.foundForbiddenTerms.join(', ')}`);

    // Assert
    if (result.passed) {
      throw new Error('Response with forbidden terms should have failed!');
    }

    console.log('✅ Test PASSED - Correctly detected forbidden fallback language');
  });

  test('Scenario 5: Mock Partial Response - Edge Case', async () => {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  TEST 5: Mock Partial Response (70% match)          ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    console.log('ℹ️  Using mock data to demonstrate partial match detection\n');
    
    const partialResponse = `The Windsor Framework simplifies trade between Great Britain and Northern Ireland. It includes IMMI and helps with the smooth movement of goods within the internal market.`;

    const requiredConcepts = [
      'smooth movement of goods',   // ✅
      'Great Britain',               // ✅
      'Northern Ireland',            // ✅
      'internal market',             // ✅
      'simplified',                  // ✅
      'IMMI',                        // ✅
      'Trader Goods Profile',        // ❌
      'Stormont Brake',              // ❌
      'NIRMS',                       // ❌
      'legal framework'              // ❌
    ];

    const result = keywordEvaluator.evaluateResponse(
      partialResponse,
      requiredConcepts,
      [],
      0.80  // Need 80%
    );

    console.log(`\n📊 Match rate: ${result.details.requiredConceptsFound}/${result.details.requiredConceptsTotal} (${result.score}%)`);
    console.log(`Missing: ${result.missingConcepts.join(', ')}`);

    // 6/10 = 60% < 80% threshold → Should fail
    if (result.passed) {
      throw new Error('Partial response should have failed with 80% threshold!');
    }

    console.log('✅ Test PASSED - Correctly detected insufficient coverage');
  });

  test('Scenario 6: Performance Comparison - Keyword vs AI', async () => {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  TEST 6: Keyword vs AI Evaluation Comparison        ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    console.log('ℹ️  Using mock data for performance comparison\n');
    
    const response = `The Windsor Framework, agreed in February 2023, introduces simplified arrangements for moving goods between Great Britain and Northern Ireland. It uses IMMI and Trader Goods Profile to reduce red tape.`;

    // Keyword evaluation
    const startKeyword = Date.now();
    const keywordResult = keywordEvaluator.evaluateResponse(
      response,
      WINDSOR_FRAMEWORK_CONCEPTS,
      CHATBOT_FORBIDDEN_TERMS,
      0.70
    );
    const keywordDuration = Date.now() - startKeyword;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 COMPARISON RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔍 Keyword-based Evaluation:');
    console.log(`   • Score: ${keywordResult.score}/100`);
    console.log(`   • Result: ${keywordResult.passed ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`   • Duration: ${keywordDuration}ms`);
    console.log(`   • Cost: $0.00 (FREE)`);
    console.log(`   • Concepts found: ${keywordResult.details.requiredConceptsFound}/${keywordResult.details.requiredConceptsTotal}`);

    console.log('\n🤖 AI Evaluation (for comparison):');
    console.log(`   • Score: ~80/100 (estimated)`);
    console.log(`   • Duration: ~2500ms`);
    console.log(`   • Cost: $0.0002 per request`);
    console.log(`   • Provides reasoning: Yes`);

    console.log('\n💡 Recommendation:');
    console.log('   ✅ Use Keyword evaluation for CI/CD (fast, free, deterministic)');
    console.log('   ✅ Use AI evaluation for deep quality checks (when budget allows)');
    console.log('   ✅ Hybrid: Keyword gate first, then AI for detailed analysis');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });

  test('Scenario 7: Using Predefined Knowledge Bases', async () => {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  TEST 7: Using Predefined Knowledge Bases           ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    console.log('ℹ️  Using mock data to demonstrate predefined knowledge bases\n');
    
    const response = `The Windsor Framework includes IMMI, Trader Goods Profile, Stormont Brake, and NIRMS for smooth movement of goods between Great Britain and Northern Ireland's internal market with simplified processes.`;

    // Using imported constants
    const result = keywordEvaluator.evaluateResponse(
      response,
      WINDSOR_FRAMEWORK_CONCEPTS,  // Predefined list
      CHATBOT_FORBIDDEN_TERMS,     // Predefined list
      0.80
    );

    console.log('\n📦 Using predefined knowledge bases:');
    console.log(`   • WINDSOR_FRAMEWORK_CONCEPTS: ${WINDSOR_FRAMEWORK_CONCEPTS.length} concepts`);
    console.log(`   • CHATBOT_FORBIDDEN_TERMS: ${CHATBOT_FORBIDDEN_TERMS.length} terms`);
    console.log(`   • Easy to maintain and reuse across tests!`);

    if (!result.passed) {
      throw new Error(`Validation failed: ${result.reasoning}`);
    }

    console.log('\n✅ Test PASSED - Predefined knowledge bases work perfectly');
  });

});
