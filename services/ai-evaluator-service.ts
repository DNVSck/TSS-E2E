import OpenAI from 'openai';

/**
 * AI Evaluator Service
 * Uses OpenAI API (LLM-as-a-judge) to evaluate chatbot responses
 * based on accuracy, completeness, and relevance criteria.
 */

// ==================== CONSTANTS ====================

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_MIN_SCORE = 7;
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

export interface EvaluationResult {
  score: number;
  maxScore: number;
  percentage: number;
  reasoning: string;
  criteria: CriteriaScores;
  passed: boolean;
  threshold: number;
  duration?: number;
}

interface OpenAIEvaluationResponse {
  accuracy: number;
  completeness: number;
  relevance: number;
  reasoning: string;
}

// ==================== SERVICE CLASS ====================

export class AIEvaluatorService {
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(apiKey?: string, model: string = DEFAULT_MODEL) {
    const key = this.getApiKey(apiKey);
    this.validateApiKey(key);
    
    this.openai = new OpenAI({ apiKey: key });
    this.model = model;
    
    console.log(`✓ AI Evaluator initialized with model: ${this.model}`);
  }

  // ==================== PRIVATE HELPERS ====================

  private getApiKey(providedKey?: string): string {
    return providedKey || process.env.OPENAI_API_KEY || '';
  }

  private validateApiKey(key: string): void {
    if (!key || key.trim().length === 0) {
      throw new Error(
        'OpenAI API key is required. ' +
        'Set OPENAI_API_KEY in .env file or pass it to constructor.'
      );
    }
  }

  // ==================== PUBLIC METHODS ====================

  async evaluateResponse(
    userQuestion: string,
    chatbotResponse: string,
    expectedContext: string = '',
    minScore: number = DEFAULT_MIN_SCORE
  ): Promise<EvaluationResult> {
    this.validateInputs(userQuestion, chatbotResponse);
    
    const startTime = Date.now();
    
    try {
      console.log('\nCalling OpenAI API for LLM-as-a-judge evaluation...');
      
      const evaluation = await this.callOpenAIEvaluation(
        userQuestion,
        chatbotResponse,
        expectedContext
      );
      
      const result = this.buildEvaluationResult(
        evaluation,
        minScore,
        Date.now() - startTime
      );
      
      this.logEvaluation(result);
      
      return result;
      
    } catch (error) {
      this.handleEvaluationError(error);
    }
  }

  async quickEvaluate(
    question: string,
    response: string,
    minScore: number = DEFAULT_MIN_SCORE
  ): Promise<boolean> {
    const result = await this.evaluateResponse(question, response, '', minScore);
    return result.passed;
  }

  // ==================== VALIDATION ====================

  private validateInputs(question: string, response: string): void {
    if (!question || question.trim().length === 0) {
      throw new Error('User question cannot be empty');
    }
    
    if (!response || response.trim().length === 0) {
      throw new Error('Chatbot response cannot be empty');
    }
  }

  // ==================== OPENAI INTERACTION ====================

  private async callOpenAIEvaluation(
    question: string,
    response: string,
    context: string
  ): Promise<OpenAIEvaluationResponse> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(question, response, context);
    
    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: EVALUATION_TEMPERATURE,
      max_tokens: MAX_RESPONSE_TOKENS,
    });
    
    return this.parseEvaluationResponse(completion);
  }

  private buildSystemPrompt(): string {
    return `Evaluate chatbot responses. Compare ONLY against Expected Context provided.

Return JSON:
{"accuracy": 0-10, "completeness": 0-10, "relevance": 0-10, "reasoning": "brief explanation"}

Rules:
- Accuracy: Factually correct vs Expected Context?
- Completeness: Covers ALL key points in Expected Context?
- Relevance: Directly answers question?
- Be STRICT on missing information`;
  }

  private buildUserPrompt(question: string, response: string, context: string): string {
    const contextPart = context ? `Expected: ${context}` : '';
    
    return `Question: ${question}\nResponse: ${response}\n${contextPart}\n\nEvaluate against Expected Context only.`;
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

  // ==================== RESULT PROCESSING ====================

  private buildEvaluationResult(
    evaluation: OpenAIEvaluationResponse,
    threshold: number,
    duration: number
  ): EvaluationResult {
    const overallScore = this.calculateOverallScore(evaluation);
    
    return {
      score: parseFloat(overallScore.toFixed(2)),
      maxScore: MAX_SCORE,
      percentage: parseFloat((overallScore * 10).toFixed(2)),
      reasoning: evaluation.reasoning,
      criteria: {
        accuracy: evaluation.accuracy,
        completeness: evaluation.completeness,
        relevance: evaluation.relevance
      },
      passed: overallScore >= threshold,
      threshold,
      duration
    };
  }

  private calculateOverallScore(evaluation: OpenAIEvaluationResponse): number {
    return (
      evaluation.accuracy +
      evaluation.completeness +
      evaluation.relevance
    ) / CRITERIA_COUNT;
  }

  // ==================== ERROR HANDLING ====================

  private handleEvaluationError(error: unknown): never {
    if (error instanceof Error) {
      console.error('OpenAI API Error:', error.message);
      throw new Error(`Failed to evaluate response: ${error.message}`);
    }
    
    console.error('Unknown evaluation error:', error);
    throw new Error('Failed to evaluate response: Unknown error');
  }

  // ==================== LOGGING ====================

  private logEvaluation(result: EvaluationResult): void {
    const passStatus = result.passed ? 'PASSED' : 'FAILED';
    
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║     AI CHATBOT RESPONSE EVALUATION      ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`\nOverall Score: ${result.score}/${MAX_SCORE} (${result.percentage}%)`);
    console.log(`Pass Threshold: ${result.threshold}/${MAX_SCORE}`);
    console.log(`${passStatus}`);
    
    if (result.duration) {
      console.log(`Duration: ${result.duration}ms`);
    }
    
    console.log('\nCriteria Breakdown:');
    console.log(`   • Accuracy:     ${result.criteria.accuracy}/${MAX_SCORE}`);
    console.log(`   • Completeness: ${result.criteria.completeness}/${MAX_SCORE}`);
    console.log(`   • Relevance:    ${result.criteria.relevance}/${MAX_SCORE}`);
    
    console.log('\nAI Reasoning:');
    console.log(`   ${result.reasoning}`);
    console.log('\n════════════════════════════════════════════\n');
  }
}

// ==================== SINGLETON EXPORT ====================

export const aiEvaluator = new AIEvaluatorService();
