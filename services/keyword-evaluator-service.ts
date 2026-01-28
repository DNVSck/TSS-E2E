/**
 * Keyword-based Evaluator Service
 * Fast, free, deterministic validation using keyword matching
 * 
 * Approaches:
 * 1. Knowledge-based validation: Check required concepts are present
 * 2. Guardrail checks: Ensure forbidden terms are NOT present
 */

interface KeywordEvaluationResult {
  passed: boolean;
  score: number; // 0-100%
  missingConcepts: string[];
  foundForbiddenTerms: string[];
  details: {
    requiredConceptsFound: number;
    requiredConceptsTotal: number;
    forbiddenTermsFound: number;
    forbiddenTermsTotal: number;
  };
  reasoning: string;
}

export class KeywordEvaluatorService {
  
  /**
   * Evaluate response using keyword matching
   * @param response - The chatbot response to evaluate
   * @param requiredConcepts - Array of concepts that MUST appear in response
   * @param forbiddenTerms - Array of terms that MUST NOT appear in response
   * @param minConceptMatch - Minimum % of required concepts to pass (default: 80%)
   * @returns Evaluation result
   */
  evaluateResponse(
    response: string,
    requiredConcepts: string[] = [],
    forbiddenTerms: string[] = [],
    minConceptMatch: number = 0.80
  ): KeywordEvaluationResult {
    
    console.log('\nKeyword-based evaluation starting...');
    
    const responseLower = response.toLowerCase();
    
    // 1. CHECK REQUIRED CONCEPTS
    const missingConcepts: string[] = [];
    let foundCount = 0;
    
    for (const concept of requiredConcepts) {
      const conceptLower = concept.toLowerCase();
      if (responseLower.includes(conceptLower)) {
        foundCount++;
        console.log(`  Found: "${concept}"`);
      } else {
        missingConcepts.push(concept);
        console.log(`  Missing: "${concept}"`);
      }
    }
    
    // 2. CHECK FORBIDDEN TERMS
    const foundForbiddenTerms: string[] = [];
    
    for (const term of forbiddenTerms) {
      const termLower = term.toLowerCase();
      if (responseLower.includes(termLower)) {
        foundForbiddenTerms.push(term);
        console.log(`  Found forbidden: "${term}"`);
      }
    }
    
    // 3. CALCULATE SCORE
    const conceptMatchRate = requiredConcepts.length > 0 
      ? foundCount / requiredConcepts.length 
      : 1;
    
    const hasForbiddenTerms = foundForbiddenTerms.length > 0;
    
    // Score: concept match % - 50% penalty if forbidden terms found
    let score = conceptMatchRate * 100;
    if (hasForbiddenTerms) {
      score = Math.max(0, score - 50); // Heavy penalty for forbidden terms
    }
    
    // 4. DETERMINE PASS/FAIL
    const passed = conceptMatchRate >= minConceptMatch && !hasForbiddenTerms;
    
    // 5. BUILD REASONING
    let reasoning = '';
    
    if (missingConcepts.length > 0) {
      reasoning += `Missing ${missingConcepts.length} required concepts: ${missingConcepts.join(', ')}. `;
    } else {
      reasoning += 'All required concepts found. ';
    }
    
    if (foundForbiddenTerms.length > 0) {
      reasoning += `Contains ${foundForbiddenTerms.length} forbidden terms: ${foundForbiddenTerms.join(', ')}. `;
    } else {
      reasoning += 'No forbidden terms detected.';
    }
    
    const result: KeywordEvaluationResult = {
      passed,
      score: parseFloat(score.toFixed(2)),
      missingConcepts,
      foundForbiddenTerms,
      details: {
        requiredConceptsFound: foundCount,
        requiredConceptsTotal: requiredConcepts.length,
        forbiddenTermsFound: foundForbiddenTerms.length,
        forbiddenTermsTotal: forbiddenTerms.length
      },
      reasoning
    };
    
    this.logEvaluation(result);
    
    return result;
  }
  
  /**
   * Pretty print evaluation results
   */
  private logEvaluation(result: KeywordEvaluationResult): void {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   KEYWORD-BASED RESPONSE EVALUATION     ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`\nScore: ${result.score}/100`);
    console.log(`${result.passed ? 'PASSED' : 'FAILED'}`);
    
    console.log('\nRequired Concepts:');
    console.log(`   Found: ${result.details.requiredConceptsFound}/${result.details.requiredConceptsTotal}`);
    if (result.missingConcepts.length > 0) {
      console.log(`   Missing: ${result.missingConcepts.join(', ')}`);
    }
    
    console.log('\nForbidden Terms:');
    console.log(`   Detected: ${result.details.forbiddenTermsFound}/${result.details.forbiddenTermsTotal}`);
    if (result.foundForbiddenTerms.length > 0) {
      console.log(`   Found: ${result.foundForbiddenTerms.join(', ')}`);
    }
    
    console.log('\nReasoning:');
    console.log(`   ${result.reasoning}`);
    console.log('\n════════════════════════════════════════════\n');
  }
  
  /**
   * Batch evaluation for multiple responses
   */
  evaluateBatch(
    responses: string[],
    requiredConcepts: string[],
    forbiddenTerms: string[],
    minConceptMatch: number = 0.80
  ): KeywordEvaluationResult[] {
    console.log(`\nBatch evaluating ${responses.length} responses...`);
    
    return responses.map((response, index) => {
      console.log(`\n--- Response ${index + 1} ---`);
      return this.evaluateResponse(response, requiredConcepts, forbiddenTerms, minConceptMatch);
    });
  }
}

// Export singleton instance
export const keywordEvaluator = new KeywordEvaluatorService();


// ============================================
// EXAMPLE KNOWLEDGE BASES
// ============================================

/**
 * Windsor Framework Required Concepts
 */
export const WINDSOR_FRAMEWORK_CONCEPTS = [
  'smooth movement of goods',
  'Great Britain',
  'Northern Ireland',
  'internal market',
  'simplified',
  'IMMI',
  'Trader Goods Profile',
  'Stormont Brake',
  'NIRMS'
];

/**
 * Common Chatbot Forbidden Terms (Fallback/Error responses)
 */
export const CHATBOT_FORBIDDEN_TERMS = [
  'I am not sure',
  'I cannot help',
  'I don\'t know',
  'As an AI language model',
  'I apologize, but',
  'Unfortunately, I cannot',
  'This is outside my scope',
  'Please contact support',
  'Error:',
  'Something went wrong'
];

/**
 * TSS-specific Forbidden Terms
 */
export const TSS_FORBIDDEN_TERMS = [
  'Brexit',  // Avoid political terms
  'EU exit', // Avoid political terms
  'personal information',  // Should never ask for PII
  'credit card',
  'password',
  'social security'
];
