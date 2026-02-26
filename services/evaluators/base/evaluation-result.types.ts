/**
 * Shared types for all evaluators
 * Common evaluation result structures and criteria
 */

// ==================== COMMON TYPES ====================

/**
 * Base evaluation result that all evaluators must return
 */
export interface BaseEvaluationResult {
  passed: boolean;
  score: number; // 0-1 scale (normalize all evaluators to this)
  explanation: string;
  processingTimeMs: number;
}

/**
 * Detailed evaluation result with criteria breakdown
 */
export interface DetailedEvaluationResult extends BaseEvaluationResult {
  criteria: Record<string, number>; // Flexible criteria (accuracy, similarity, etc.)
  metadata?: Record<string, any>; // Evaluator-specific metadata
}

/**
 * Batch evaluation result
 */
export interface BatchEvaluationResult {
  totalTests: number;
  passed: number;
  failed: number;
  averageScore: number;
  results: DetailedEvaluationResult[];
  processingTimeMs: number;
  summary: string;
}

/**
 * Single test case for batch evaluation
 */
export interface TestCase {
  expectedAnswer: string;
  actualAnswer: string;
  context?: string;
  metadata?: Record<string, any>;
}

/**
 * Evaluator configuration
 */
export interface EvaluatorConfig {
  threshold?: number; // Pass/fail threshold (0-1)
  batchDelayMs?: number; // Delay between batch requests
  maxRetries?: number; // Max retry attempts
  [key: string]: any; // Allow evaluator-specific config
}

/**
 * Evaluator type enum
 */
export enum EvaluatorType {
  AI = 'ai',
  EMBEDDING = 'embedding',
  KEYWORD = 'keyword',
}

/**
 * Evaluator metadata
 */
export interface EvaluatorMetadata {
  type: EvaluatorType;
  name: string;
  version: string;
  cost: 'free' | 'paid' | 'mixed';
  speed: 'fast' | 'medium' | 'slow';
  description: string;
}
