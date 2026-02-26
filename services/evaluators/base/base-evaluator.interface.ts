/**
 * Base interface that all evaluators must implement
 * Ensures consistent API across different evaluation strategies
 */

import {
  DetailedEvaluationResult,
  BatchEvaluationResult,
  TestCase,
  EvaluatorConfig,
  EvaluatorMetadata,
} from './evaluation-result.types';

export interface IEvaluator {
  /**
   * Evaluate a single response
   */
  evaluateResponse(
    expectedAnswer: string,
    actualAnswer: string,
    context?: string
  ): Promise<DetailedEvaluationResult>;

  /**
   * Evaluate multiple responses in batch
   */
  batchEvaluate(testCases: TestCase[]): Promise<BatchEvaluationResult>;

  /**
   * Update evaluator configuration
   */
  updateConfig(config: Partial<EvaluatorConfig>): void;

  /**
   * Get current configuration
   */
  getConfig(): EvaluatorConfig;

  /**
   * Get evaluator metadata (type, cost, speed, etc.)
   */
  getMetadata(): EvaluatorMetadata;
}
