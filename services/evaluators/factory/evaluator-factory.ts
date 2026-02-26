/**
 * Evaluator Factory
 * Creates evaluator instances based on type or requirements
 * Supports strategy pattern for flexible evaluator selection
 */

import { IEvaluator } from '../base/base-evaluator.interface';
import { EvaluatorType, EvaluatorConfig } from '../base/evaluation-result.types';
import { AIEvaluator } from '../implementations/ai-evaluator.service';
import { HuggingFaceEvaluator } from '../implementations/huggingface-evaluator.service';
import { KeywordEvaluator } from '../implementations/keyword-evaluator.service';

// ==================== FACTORY ====================
export class EvaluatorFactory {
  /**
   * Create evaluator by type
   */
  static create(type: EvaluatorType, config?: EvaluatorConfig): IEvaluator {
    switch (type) {
      case EvaluatorType.AI:
        return new AIEvaluator(config);
      
      case EvaluatorType.EMBEDDING:
        return new HuggingFaceEvaluator(config);
      
      case EvaluatorType.KEYWORD:
        return new KeywordEvaluator(config);
      
      default:
        throw new Error(`Unknown evaluator type: ${type}`);
    }
  }

  /**
   * Get the best evaluator based on requirements
   */
  static getBest(requirements: {
    cost?: 'free' | 'paid' | 'any';
    speed?: 'fast' | 'medium' | 'slow' | 'any';
    accuracy?: 'high' | 'medium' | 'low';
  }): EvaluatorType {
    const { cost = 'any', speed = 'any', accuracy = 'high' } = requirements;

    // Priority: Accuracy > Cost > Speed

    // High accuracy required
    if (accuracy === 'high') {
      if (cost === 'free') {
        return EvaluatorType.EMBEDDING; // Best free option
      }
      return EvaluatorType.AI; // Best paid option
    }

    // Medium accuracy acceptable
    if (accuracy === 'medium') {
      if (speed === 'fast') {
        return EvaluatorType.KEYWORD;
      }
      return EvaluatorType.EMBEDDING;
    }

    // Low accuracy acceptable (guardrails only)
    if (accuracy === 'low') {
      return EvaluatorType.KEYWORD;
    }

    // Default: Free and decent accuracy
    return EvaluatorType.EMBEDDING;
  }

  /**
   * Create recommended evaluator based on requirements
   */
  static createRecommended(
    requirements: {
      cost?: 'free' | 'paid' | 'any';
      speed?: 'fast' | 'medium' | 'slow' | 'any';
      accuracy?: 'high' | 'medium' | 'low';
    },
    config?: EvaluatorConfig
  ): IEvaluator {
    const type = this.getBest(requirements);
    return this.create(type, config);
  }

  /**
   * Get all available evaluators with metadata
   */
  static listAvailable(): Array<{
    type: EvaluatorType;
    name: string;
    cost: string;
    speed: string;
    description: string;
  }> {
    const evaluators = [
      new AIEvaluator(),
      new HuggingFaceEvaluator(),
      new KeywordEvaluator(),
    ];

    return evaluators.map((evaluator) => {
      const metadata = evaluator.getMetadata();
      return {
        type: metadata.type,
        name: metadata.name,
        cost: metadata.cost,
        speed: metadata.speed,
        description: metadata.description,
      };
    });
  }

  /**
   * Create multi-evaluator strategy (run multiple evaluators and combine results)
   */
  static createMultiEvaluator(
    types: EvaluatorType[],
    combineStrategy: 'all-pass' | 'any-pass' | 'majority' = 'majority'
  ): IEvaluator {
    const evaluators = types.map((type) => this.create(type));
    return new MultiEvaluator(evaluators, combineStrategy);
  }
}

// ==================== MULTI-EVALUATOR ====================
/**
 * Runs multiple evaluators and combines results
 * Useful for comprehensive evaluation with consensus
 */
class MultiEvaluator implements IEvaluator {
  constructor(
    private evaluators: IEvaluator[],
    private combineStrategy: 'all-pass' | 'any-pass' | 'majority' = 'majority'
  ) {
    if (evaluators.length === 0) {
      throw new Error('MultiEvaluator requires at least one evaluator');
    }
  }

  async evaluateResponse(
    expectedAnswer: string,
    actualAnswer: string,
    context?: string
  ) {
    console.log(`\nRunning ${this.evaluators.length} evaluators...`);

    const results = await Promise.all(
      this.evaluators.map((evaluator) =>
        evaluator.evaluateResponse(expectedAnswer, actualAnswer, context)
      )
    );

    const passedCount = results.filter((r) => r.passed).length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    // Determine overall pass/fail based on strategy
    let overallPassed = false;
    switch (this.combineStrategy) {
      case 'all-pass':
        overallPassed = passedCount === results.length;
        break;
      case 'any-pass':
        overallPassed = passedCount > 0;
        break;
      case 'majority':
        overallPassed = passedCount > results.length / 2;
        break;
    }

    // Combine criteria from all evaluators
    const combinedCriteria: Record<string, number> = {};
    results.forEach((result, index) => {
      const evaluatorName = this.evaluators[index].getMetadata().type;
      Object.entries(result.criteria).forEach(([key, value]) => {
        combinedCriteria[`${evaluatorName}_${key}`] = value;
      });
    });

    return {
      passed: overallPassed,
      score: averageScore,
      explanation: this.generateCombinedExplanation(results, overallPassed),
      processingTimeMs: Math.max(...results.map((r) => r.processingTimeMs)),
      criteria: combinedCriteria,
      metadata: {
        strategy: this.combineStrategy,
        evaluatorCount: this.evaluators.length,
        passedCount,
        individualResults: results,
      },
    };
  }

  async batchEvaluate(testCases: any[]) {
    const results = await Promise.all(
      testCases.map((testCase) =>
        this.evaluateResponse(testCase.expectedAnswer, testCase.actualAnswer, testCase.context)
      )
    );

    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    return {
      totalTests: testCases.length,
      passed,
      failed,
      averageScore,
      results,
      processingTimeMs: results.reduce((sum, r) => sum + r.processingTimeMs, 0),
      summary: `Multi-evaluator (${this.combineStrategy}): ${passed}/${testCases.length} passed`,
    };
  }

  updateConfig(config: any) {
    this.evaluators.forEach((evaluator) => evaluator.updateConfig(config));
  }

  getConfig() {
    return {
      strategy: this.combineStrategy,
      evaluatorCount: this.evaluators.length,
      evaluators: this.evaluators.map((e) => e.getConfig()),
    };
  }

  getMetadata() {
    return {
      type: 'multi' as EvaluatorType,
      name: 'Multi-Evaluator',
      version: '1.0.0',
      cost: 'mixed' as const,
      speed: 'slow' as const,
      description: `Combines ${this.evaluators.length} evaluators using ${this.combineStrategy} strategy`,
    };
  }

  private generateCombinedExplanation(results: any[], overallPassed: boolean): string {
    const status = overallPassed ? 'PASSED' : 'FAILED';
    const passedCount = results.filter((r) => r.passed).length;

    let explanation = `${status} - Multi-Evaluator (${this.combineStrategy})\n\n`;
    explanation += `Results: ${passedCount}/${results.length} evaluators passed\n\n`;

    results.forEach((result, index) => {
      const evaluatorType = this.evaluators[index].getMetadata().type;
      const resultStatus = result.passed ? '[PASS]' : '[FAIL]';
      const score = (result.score * 100).toFixed(1);
      explanation += `${resultStatus} ${evaluatorType}: ${score}%\n`;
    });

    return explanation.trim();
  }
}
