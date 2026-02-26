/**
 * AI Evaluator Service (OpenAI LLM-as-a-Judge)
 * Uses OpenAI GPT models to evaluate chatbot responses
 * Criteria: accuracy, completeness, relevance
 */

import OpenAI from 'openai';
import { BaseEvaluator } from '../base/base-evaluator.abstract';
import {
  DetailedEvaluationResult,
  EvaluatorConfig,
  EvaluatorMetadata,
  EvaluatorType,
} from '../base/evaluation-result.types';

// ==================== CONSTANTS ====================
const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_SCORE = 10;
const EVALUATION_TEMPERATURE = 0.1;
const MAX_RESPONSE_TOKENS = 300;
const CRITERIA_COUNT = 3;

// ==================== TYPES ====================
interface CriteriaScores {
  accuracy: number;
  completeness: number;
  relevance: number;
}

interface OpenAIEvaluationResponse {
  accuracy: number;
  completeness: number;
  relevance: number;
  reasoning: string;
}

interface AIEvaluatorConfig extends EvaluatorConfig {
  model?: string;
  apiKey?: string;
}

// ==================== AI EVALUATOR ====================
export class AIEvaluator extends BaseEvaluator {
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(config: AIEvaluatorConfig = {}) {
    super({
      threshold: 0.7, // 7/10 score to pass
      ...config,
    });

    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.validateApiKey(apiKey);

    this.openai = new OpenAI({ apiKey });
    this.model = config.model || DEFAULT_MODEL;

    console.log(`AI Evaluator initialized with model: ${this.model}`);
  }

  // ==================== METADATA ====================
  getMetadata(): EvaluatorMetadata {
    return {
      type: EvaluatorType.AI,
      name: 'OpenAI LLM-as-a-Judge',
      version: '1.0.0',
      cost: 'paid',
      speed: 'medium',
      description: 'Uses GPT models to evaluate responses based on accuracy, completeness, and relevance',
    };
  }

  // ==================== EVALUATION ====================
  async evaluateResponse(
    expectedAnswer: string,
    actualAnswer: string,
    context?: string
  ): Promise<DetailedEvaluationResult> {
    const startTime = Date.now();

    try {
      console.log('\nCalling OpenAI API for LLM-as-a-judge evaluation...');

      const evaluation = await this.callOpenAIEvaluation(
        expectedAnswer,
        actualAnswer,
        context
      );

      const overallScore = this.calculateOverallScore(evaluation);
      const normalizedScore = this.normalizeScore(overallScore, MAX_SCORE);
      const passed = this.isPassing(normalizedScore);

      const result: DetailedEvaluationResult = {
        passed,
        score: normalizedScore,
        explanation: this.generateExplanation(evaluation, normalizedScore, passed),
        processingTimeMs: Date.now() - startTime,
        criteria: {
          accuracy: evaluation.accuracy / MAX_SCORE,
          completeness: evaluation.completeness / MAX_SCORE,
          relevance: evaluation.relevance / MAX_SCORE,
        },
        metadata: {
          model: this.model,
          rawScores: evaluation,
          overallScore,
          maxScore: MAX_SCORE,
        },
      };

      this.logEvaluationResult(result);
      return result;
    } catch (error: any) {
      console.error('OpenAI evaluation failed:', error.message);
      throw error;
    }
  }

  // ==================== OPENAI INTERACTION ====================
  private async callOpenAIEvaluation(
    expectedAnswer: string,
    actualAnswer: string,
    context?: string
  ): Promise<OpenAIEvaluationResponse> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(expectedAnswer, actualAnswer, context);

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: EVALUATION_TEMPERATURE,
      max_tokens: MAX_RESPONSE_TOKENS,
    });

    return this.parseEvaluationResponse(completion);
  }

  private buildSystemPrompt(): string {
    return `Evaluate chatbot responses. Compare actual response against expected answer.

Return JSON:
{"accuracy": 0-10, "completeness": 0-10, "relevance": 0-10, "reasoning": "brief explanation"}

Criteria:
- Accuracy: Factually correct vs Expected Answer? (0-10)
- Completeness: Covers ALL key points in Expected Answer? (0-10)
- Relevance: Directly addresses the topic? (0-10)

Be STRICT on missing information or inaccuracies.`;
  }

  private buildUserPrompt(
    expectedAnswer: string,
    actualAnswer: string,
    context?: string
  ): string {
    const contextPart = context ? `Context: ${context}\n` : '';

    return `${contextPart}Expected Answer: ${expectedAnswer}

Actual Response: ${actualAnswer}

Evaluate the Actual Response against the Expected Answer.`;
  }

  private parseEvaluationResponse(completion: any): OpenAIEvaluationResponse {
    const responseText = completion.choices[0]?.message?.content || '{}';

    try {
      const parsed = JSON.parse(responseText);

      if (
        typeof parsed.accuracy !== 'number' ||
        typeof parsed.completeness !== 'number' ||
        typeof parsed.relevance !== 'number' ||
        typeof parsed.reasoning !== 'string'
      ) {
        throw new Error('Invalid evaluation response structure');
      }

      return parsed as OpenAIEvaluationResponse;
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${responseText}`);
    }
  }

  // ==================== UTILITIES ====================
  private calculateOverallScore(evaluation: OpenAIEvaluationResponse): number {
    return (
      evaluation.accuracy + evaluation.completeness + evaluation.relevance
    ) / CRITERIA_COUNT;
  }

  private generateExplanation(
    evaluation: OpenAIEvaluationResponse,
    normalizedScore: number,
    passed: boolean
  ): string {
    const status = passed ? 'PASSED' : 'FAILED';
    const percentage = (normalizedScore * 100).toFixed(1);

    return `${status} - Score: ${percentage}%

Criteria Breakdown:
- Accuracy: ${evaluation.accuracy}/${MAX_SCORE}
- Completeness: ${evaluation.completeness}/${MAX_SCORE}
- Relevance: ${evaluation.relevance}/${MAX_SCORE}

AI Reasoning: ${evaluation.reasoning}

The response ${passed ? 'meets' : 'does not meet'} the threshold of ${(this.config.threshold! * 100).toFixed(0)}%.`;
  }

  private validateApiKey(apiKey: string | undefined): void {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error(
        'OpenAI API key is required. Set OPENAI_API_KEY in .env or pass in config.'
      );
    }
  }
}

// ==================== SINGLETON EXPORT ====================
export const aiEvaluator = new AIEvaluator();
