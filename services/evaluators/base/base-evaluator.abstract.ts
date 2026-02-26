/**
 * Abstract base class for all evaluators
 * Provides common functionality: logging, batch processing, configuration
 */

import { IEvaluator } from './base-evaluator.interface';
import {
  DetailedEvaluationResult,
  BatchEvaluationResult,
  TestCase,
  EvaluatorConfig,
  EvaluatorMetadata,
} from './evaluation-result.types';

export abstract class BaseEvaluator implements IEvaluator {
  protected config: EvaluatorConfig;

  constructor(config: EvaluatorConfig = {}) {
    this.config = {
      threshold: 0.8,
      batchDelayMs: 100,
      maxRetries: 3,
      ...config,
    };
  }

  // ==================== ABSTRACT METHODS ====================
  // Subclasses MUST implement these

  /**
   * Evaluate a single response - implementation specific
   */
  abstract evaluateResponse(
    expectedAnswer: string,
    actualAnswer: string,
    context?: string
  ): Promise<DetailedEvaluationResult>;

  /**
   * Get evaluator metadata - implementation specific
   */
  abstract getMetadata(): EvaluatorMetadata;

  // ==================== COMMON IMPLEMENTATIONS ====================
  // Shared logic for all evaluators

  /**
   * Batch evaluation with error handling and rate limiting
   */
  async batchEvaluate(testCases: TestCase[]): Promise<BatchEvaluationResult> {
    const startTime = Date.now();
    const results: DetailedEvaluationResult[] = [];

    this.logBatchStart(testCases.length);

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

        // Rate limiting
        if (i < testCases.length - 1 && this.config.batchDelayMs) {
          await this.sleep(this.config.batchDelayMs);
        }
      } catch (error: any) {
        this.logTestCaseError(i + 1, error);
        results.push(this.createFailedResult(error.message));
      }
    }

    const processingTime = Date.now() - startTime;
    const batchResult = this.calculateBatchStatistics(results, processingTime);
    
    this.logBatchComplete(batchResult);
    return batchResult;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EvaluatorConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): EvaluatorConfig {
    return { ...this.config };
  }

  // ==================== PROTECTED UTILITIES ====================
  // Helper methods for subclasses

  /**
   * Sleep utility for rate limiting
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Normalize score to 0-1 range
   */
  protected normalizeScore(score: number, maxScore: number): number {
    return Math.max(0, Math.min(1, score / maxScore));
  }

  /**
   * Check if score passes threshold
   */
  protected isPassing(score: number): boolean {
    return score >= (this.config.threshold || 0.8);
  }

  /**
   * Create a failed evaluation result
   */
  protected createFailedResult(errorMessage: string): DetailedEvaluationResult {
    return {
      passed: false,
      score: 0,
      explanation: `Evaluation failed: ${errorMessage}`,
      processingTimeMs: 0,
      criteria: {},
    };
  }

  /**
   * Calculate batch statistics
   */
  private calculateBatchStatistics(
    results: DetailedEvaluationResult[],
    processingTime: number
  ): BatchEvaluationResult {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const passRate = (passed / results.length) * 100;

    const summary = this.generateBatchSummary(passed, failed, averageScore, passRate);

    return {
      totalTests: results.length,
      passed,
      failed,
      averageScore,
      results,
      processingTimeMs: processingTime,
      summary,
    };
  }

  /**
   * Generate batch summary text
   */
  private generateBatchSummary(
    passed: number,
    failed: number,
    averageScore: number,
    passRate: number
  ): string {
    const metadata = this.getMetadata();
    return `
Evaluator: ${metadata.name} (${metadata.type})
Results: ${passed} passed, ${failed} failed
Pass Rate: ${passRate.toFixed(1)}%
Average Score: ${(averageScore * 100).toFixed(1)}%
Cost: ${metadata.cost.toUpperCase()}
Speed: ${metadata.speed.toUpperCase()}
    `.trim();
  }

  // ==================== LOGGING ====================

  protected logBatchStart(totalTests: number): void {
    const metadata = this.getMetadata();
    console.log('\n========================================');
    console.log(`Starting Batch Evaluation - ${metadata.name}`);
    console.log('========================================');
    console.log(`Total Test Cases: ${totalTests}`);
    console.log(`Evaluator Type: ${metadata.type}`);
    console.log(`Threshold: ${((this.config.threshold || 0.8) * 100).toFixed(0)}%`);
    console.log('========================================\n');
  }

  protected logTestCaseProgress(current: number, total: number): void {
    console.log(`\n[${current}/${total}] Evaluating test case...`);
  }

  protected logTestCaseError(testCase: number, error: any): void {
    console.error(`\n[ERROR] Test case ${testCase} failed:`, error.message);
  }

  protected logBatchComplete(result: BatchEvaluationResult): void {
    console.log('\n========================================');
    console.log('Batch Evaluation Complete');
    console.log('========================================');
    console.log(result.summary);
    console.log(`Total Time: ${result.processingTimeMs}ms`);
    console.log('========================================\n');
  }

  protected logEvaluationResult(result: DetailedEvaluationResult): void {
    console.log('\n----------------------------------------');
    console.log(`Result: ${result.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`Score: ${(result.score * 100).toFixed(1)}%`);
    console.log(`Time: ${result.processingTimeMs}ms`);
    console.log('----------------------------------------\n');
  }
}
