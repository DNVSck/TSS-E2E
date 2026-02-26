/**
 * Keyword-based Evaluator Service
 * Fast, free, deterministic validation using keyword matching
 * 
 * Approaches:
 * 1. Knowledge-based validation: Check required concepts are present
 * 2. Guardrail checks: Ensure forbidden terms are NOT present
 */

import { BaseEvaluator } from '../base/base-evaluator.abstract';
import {
  DetailedEvaluationResult,
  EvaluatorConfig,
  EvaluatorMetadata,
  EvaluatorType,
  TestCase,
  BatchEvaluationResult,
} from '../base/evaluation-result.types';

// ==================== TYPES ====================
interface KeywordEvaluatorConfig extends EvaluatorConfig {
  requiredConcepts?: string[];
  forbiddenTerms?: string[];
  minConceptMatch?: number; // 0-1 scale
}

interface KeywordCriteria {
  conceptMatch: number; // 0-1
  forbiddenTermsCheck: number; // 0 or 1 (binary)
}

// ==================== KEYWORD EVALUATOR ====================
export class KeywordEvaluator extends BaseEvaluator {
  private requiredConcepts: string[];
  private forbiddenTerms: string[];
  private minConceptMatch: number;

  constructor(config: KeywordEvaluatorConfig = {}) {
    super({
      threshold: 0.8, // 80% concept match to pass
      batchDelayMs: 0, // Instant - no API calls
      maxRetries: 0, // No retries needed
      ...config,
    });

    this.requiredConcepts = config.requiredConcepts || [];
    this.forbiddenTerms = config.forbiddenTerms || [];
    this.minConceptMatch = config.minConceptMatch || this.config.threshold!;
  }

  // ==================== METADATA ====================
  getMetadata(): EvaluatorMetadata {
    return {
      type: EvaluatorType.KEYWORD,
      name: 'Keyword Matcher',
      version: '1.0.0',
      cost: 'free',
      speed: 'fast',
      description: 'Deterministic validation using keyword presence/absence checks',
    };
  }

  // ==================== EVALUATION ====================
  async evaluateResponse(
    expectedAnswer: string,
    actualAnswer: string,
    context?: string
  ): Promise<DetailedEvaluationResult> {
    const startTime = Date.now();

    console.log('\nKeyword-based evaluation starting...');

    const responseLower = actualAnswer.toLowerCase();

    // Use requiredConcepts from config, or extract from expectedAnswer
    const concepts = this.requiredConcepts.length > 0 
      ? this.requiredConcepts 
      : this.extractConceptsFromExpected(expectedAnswer);

    // 1. CHECK REQUIRED CONCEPTS
    const { foundCount, missingConcepts } = this.checkRequiredConcepts(
      responseLower,
      concepts
    );

    // 2. CHECK FORBIDDEN TERMS
    const foundForbiddenTerms = this.checkForbiddenTerms(responseLower);

    // 3. CALCULATE SCORE
    const conceptMatchRate = concepts.length > 0 ? foundCount / concepts.length : 1;
    const hasForbiddenTerms = foundForbiddenTerms.length > 0;

    // Score calculation: concept match - penalty for forbidden terms
    let score = conceptMatchRate;
    if (hasForbiddenTerms) {
      score = Math.max(0, score - 0.5); // 50% penalty
    }

    // 4. DETERMINE PASS/FAIL
    const passed = conceptMatchRate >= this.minConceptMatch && !hasForbiddenTerms;

    const result: DetailedEvaluationResult = {
      passed,
      score,
      explanation: this.generateExplanation(
        concepts.length,
        foundCount,
        missingConcepts,
        foundForbiddenTerms,
        passed
      ),
      processingTimeMs: Date.now() - startTime,
      criteria: {
        conceptMatch: conceptMatchRate,
        forbiddenTermsCheck: hasForbiddenTerms ? 0 : 1,
      },
      metadata: {
        requiredConceptsFound: foundCount,
        requiredConceptsTotal: concepts.length,
        missingConcepts,
        forbiddenTermsFound: foundForbiddenTerms.length,
        foundForbiddenTerms,
      },
    };

    this.logEvaluationResult(result);
    return result;
  }

  // ==================== BATCH EVALUATION ====================
  // Override to use synchronous evaluation (no API calls)
  async batchEvaluate(testCases: TestCase[]): Promise<BatchEvaluationResult> {
    const startTime = Date.now();
    const results: DetailedEvaluationResult[] = [];

    this.logBatchStart(testCases.length);

    // No need for delays - process all at once
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      this.logTestCaseProgress(i + 1, testCases.length);

      try {
        const result = await this.evaluateResponse(
          testCase.expectedAnswer,
          testCase.actualAnswer,
          testCase.context
        );
        results.push(result);
      } catch (error: any) {
        this.logTestCaseError(i + 1, error);
        results.push(this.createFailedResult(error.message));
      }
    }

    const processingTime = Date.now() - startTime;
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    const passRate = (passed / testCases.length) * 100;
    const summary = `Keyword Matcher: ${passed}/${testCases.length} passed (${passRate.toFixed(1)}%), Avg: ${(averageScore * 100).toFixed(1)}%`;

    const batchResult: BatchEvaluationResult = {
      totalTests: testCases.length,
      passed,
      failed,
      averageScore,
      results,
      processingTimeMs: processingTime,
      summary,
    };

    this.logBatchComplete(batchResult);
    return batchResult;
  }

  // ==================== CONCEPT CHECKING ====================
  private checkRequiredConcepts(
    responseLower: string,
    concepts: string[]
  ): { foundCount: number; missingConcepts: string[] } {
    const missingConcepts: string[] = [];
    let foundCount = 0;

    for (const concept of concepts) {
      const conceptLower = concept.toLowerCase();
      if (responseLower.includes(conceptLower)) {
        foundCount++;
        console.log(`  Found: "${concept}"`);
      } else {
        missingConcepts.push(concept);
        console.log(`  Missing: "${concept}"`);
      }
    }

    return { foundCount, missingConcepts };
  }

  private checkForbiddenTerms(responseLower: string): string[] {
    const foundForbiddenTerms: string[] = [];

    for (const term of this.forbiddenTerms) {
      const termLower = term.toLowerCase();
      if (responseLower.includes(termLower)) {
        foundForbiddenTerms.push(term);
        console.log(`  Found forbidden: "${term}"`);
      }
    }

    return foundForbiddenTerms;
  }

  // ==================== UTILITIES ====================
  private extractConceptsFromExpected(expectedAnswer: string): string[] {
    // Simple extraction: split by punctuation and filter short words
    const words = expectedAnswer
      .toLowerCase()
      .split(/[.,;!?\\s]+/)
      .filter((word) => word.length > 3); // Skip short words

    // Return unique words as concepts
    return [...new Set(words)];
  }

  private generateExplanation(
    totalConcepts: number,
    foundCount: number,
    missingConcepts: string[],
    foundForbiddenTerms: string[],
    passed: boolean
  ): string {
    const status = passed ? 'PASSED' : 'FAILED';
    const conceptRate = ((foundCount / totalConcepts) * 100).toFixed(1);

    let explanation = `${status} - Concept Match: ${conceptRate}%\n\n`;

    explanation += `Required Concepts: ${foundCount}/${totalConcepts} found\n`;

    if (missingConcepts.length > 0) {
      explanation += `Missing: ${missingConcepts.join(', ')}\n`;
    } else {
      explanation += 'All required concepts found.\n';
    }

    explanation += `\nForbidden Terms: ${foundForbiddenTerms.length} detected\n`;
    if (foundForbiddenTerms.length > 0) {
      explanation += `Found: ${foundForbiddenTerms.join(', ')}\n`;
    } else {
      explanation += 'No forbidden terms detected.\n';
    }

    return explanation.trim();
  }

  // ==================== CONFIGURATION ====================
  setRequiredConcepts(concepts: string[]): void {
    this.requiredConcepts = concepts;
    console.log(`Required concepts updated (${concepts.length} concepts)`);
  }

  setForbiddenTerms(terms: string[]): void {
    this.forbiddenTerms = terms;
    console.log(`Forbidden terms updated (${terms.length} terms)`);
  }

  setMinConceptMatch(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Minimum concept match must be between 0 and 1');
    }
    this.minConceptMatch = threshold;
    console.log(`Minimum concept match updated to: ${(threshold * 100).toFixed(0)}%`);
  }
}

// ==================== SINGLETON EXPORT ====================
export const keywordEvaluator = new KeywordEvaluator();

// ==================== KNOWLEDGE BASES ====================
/**
 * Pre-defined concept sets for common use cases
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
  'NIRMS',
];

export const CHATBOT_FORBIDDEN_TERMS = [
  'I am not sure',
  'I cannot help',
  "I don't know",
  'As an AI language model',
  'I apologize, but',
  'Unfortunately, I cannot',
  'This is outside my scope',
  'Please contact support',
  'Error:',
  'Something went wrong',
];

export const TSS_FORBIDDEN_TERMS = [
  'Brexit',
  'EU exit',
  'personal information',
  'credit card',
  'password',
  'social security',
];
