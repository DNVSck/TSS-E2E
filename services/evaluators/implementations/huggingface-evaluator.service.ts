/**
 * HuggingFace Embedding Evaluator Service
 * 
 * Free alternative using Hugging Face sentence-transformers
 * Evaluates semantic similarity using cosine similarity on embeddings
 * 
 * Popular Models:
 * - sentence-transformers/all-MiniLM-L6-v2 (fast, 384 dims)
 * - sentence-transformers/all-mpnet-base-v2 (quality, 768 dims)
 * - BAAI/bge-small-en-v1.5 (efficient, 384 dims)
 */

import { HfInference } from '@huggingface/inference';
import { BaseEvaluator } from '../base/base-evaluator.abstract';
import {
  DetailedEvaluationResult,
  EvaluatorConfig,
  EvaluatorMetadata,
  EvaluatorType,
} from '../base/evaluation-result.types';

// ==================== CONSTANTS ====================
const DEFAULT_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const DEFAULT_SIMILARITY_THRESHOLD = 0.8;
const DEFAULT_RETRY_DELAY_MS = 1000;

// Score quality labels
const SCORE_THRESHOLDS = {
  excellent: 0.9,
  good: 0.8,
  acceptable: 0.7,
  poor: 0.6,
};

// ==================== TYPES ====================
interface HuggingFaceEvaluatorConfig extends EvaluatorConfig {
  model?: string;
  apiKey?: string;
  retryDelayMs?: number;
}

// ==================== HUGGING FACE EVALUATOR ====================
export class HuggingFaceEvaluator extends BaseEvaluator {
  private hf: HfInference;
  private model: string;
  private retryDelayMs: number;

  constructor(config: HuggingFaceEvaluatorConfig = {}) {
    super({
      threshold: DEFAULT_SIMILARITY_THRESHOLD,
      batchDelayMs: 100, // Low since it's free
      maxRetries: 3,
      ...config,
    });

    const apiKey = config.apiKey || process.env.HUGGINGFACE_API_KEY;
    this.hf = new HfInference(apiKey); // Works without key for public models
    this.model = config.model || DEFAULT_MODEL;
    this.retryDelayMs = config.retryDelayMs || DEFAULT_RETRY_DELAY_MS;

    this.logInitialization();
  }

  // ==================== METADATA ====================
  getMetadata(): EvaluatorMetadata {
    return {
      type: EvaluatorType.EMBEDDING,
      name: 'HuggingFace Embedding Similarity',
      version: '1.0.0',
      cost: 'free',
      speed: 'fast',
      description: 'Measures semantic similarity using sentence-transformers embeddings',
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
      console.log('\n========================================');
      console.log('Starting Hugging Face Evaluation');
      console.log('========================================');
      console.log('Expected:', expectedAnswer.substring(0, 100) + '...');
      console.log('Actual:', actualAnswer.substring(0, 100) + '...');

      // Generate embeddings in parallel
      const [expectedEmbedding, actualEmbedding] = await Promise.all([
        this.getEmbedding(expectedAnswer),
        this.getEmbedding(actualAnswer),
      ]);

      // Calculate similarity
      const similarityScore = this.cosineSimilarity(expectedEmbedding, actualEmbedding);
      console.log(`Similarity Score: ${(similarityScore * 100).toFixed(2)}%`);

      const passed = this.isPassing(similarityScore);

      const result: DetailedEvaluationResult = {
        passed,
        score: similarityScore,
        explanation: this.generateExplanation(similarityScore, passed),
        processingTimeMs: Date.now() - startTime,
        criteria: {
          semanticSimilarity: similarityScore,
        },
        metadata: {
          model: this.model,
          expectedAnswer,
          actualAnswer,
          embeddingDimensions: expectedEmbedding.length,
        },
      };

      this.logEvaluationResult(result);
      return result;
    } catch (error: any) {
      console.error('HuggingFace evaluation failed:', error.message);
      throw error;
    }
  }

  // ==================== EMBEDDING GENERATION ====================
  private async getEmbedding(text: string, retryCount = 0): Promise<number[]> {
    try {
      const startTime = Date.now();

      // Wait on retry (cold start)
      if (retryCount > 0) {
        console.log(`Waiting for model to warm up...`);
        await this.sleep(3000);
      }

      const response = await this.hf.featureExtraction({
        model: this.model,
        inputs: text,
      });

      const processingTime = Date.now() - startTime;

      // Handle response format (1D or 2D array)
      let embedding: number[];
      if (Array.isArray(response)) {
        if (Array.isArray(response[0])) {
          embedding = response[0] as number[];
        } else {
          embedding = response as number[];
        }
      } else {
        throw new Error('Unexpected response format from Hugging Face API');
      }

      console.log(`Generated embedding (${embedding.length} dims) in ${processingTime}ms`);
      return embedding;
    } catch (error: any) {
      const errorMsg = error.message || error.toString();
      const statusCode = error.statusCode || error.response?.status;

      console.error(
        `Error generating embedding (attempt ${retryCount + 1}/${this.config.maxRetries}):`,
        errorMsg
      );
      if (statusCode) {
        console.error(`   HTTP Status: ${statusCode}`);
      }

      // Retry logic for transient errors
      if (retryCount < this.config.maxRetries! && this.shouldRetry(error)) {
        const delay = this.retryDelayMs * Math.pow(2, retryCount);
        console.log(`Retrying in ${delay}ms... (Model may be loading)`);
        await this.sleep(delay);
        return this.getEmbedding(text, retryCount + 1);
      }

      throw new Error(
        `Failed to generate embedding after ${retryCount + 1} attempts: ${errorMsg}`
      );
    }
  }

  private shouldRetry(error: any): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'rate limit',
      'timeout',
      'overloaded',
      'HTTP error',
      'loading',
    ];
    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.statusCode || error.response?.status;

    // Retry on 503 (service unavailable) or 429 (rate limit)
    if (statusCode === 503 || statusCode === 429) {
      return true;
    }

    return retryableErrors.some((msg) => errorMessage.includes(msg));
  }

  // ==================== SIMILARITY CALCULATION ====================
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error(`Vector dimensions mismatch: ${vecA.length} vs ${vecB.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
  }

  // ==================== EXPLANATION ====================
  private generateExplanation(similarity: number, passed: boolean): string {
    const percentage = (similarity * 100).toFixed(1);

    let quality: string;
    if (similarity >= SCORE_THRESHOLDS.excellent) {
      quality = 'Excellent';
    } else if (similarity >= SCORE_THRESHOLDS.good) {
      quality = 'Good';
    } else if (similarity >= SCORE_THRESHOLDS.acceptable) {
      quality = 'Acceptable';
    } else {
      quality = 'Needs Improvement';
    }

    const status = passed ? 'PASSED' : 'FAILED';

    return `${status} - ${quality} (${percentage}%)

Semantic Similarity: ${percentage}%

Important Limitations:
This metric measures SEMANTIC SIMILARITY only.
It does NOT directly measure:
- Factual accuracy (could be similar but factually wrong)
- Completeness (missing information)
- Hallucinations (made-up facts)

The response ${passed ? 'meets' : 'does not meet'} the similarity threshold of ${(this.config.threshold! * 100).toFixed(0)}%.`;
  }

  // ==================== INITIALIZATION ====================
  private logInitialization(): void {
    console.log('\n========================================');
    console.log('HuggingFace Embedding Evaluator');
    console.log('========================================');
    console.log(`Model: ${this.model}`);
    console.log(`Similarity Threshold: ${this.config.threshold}`);
    console.log(`Batch Delay: ${this.config.batchDelayMs}ms`);
    console.log(`Endpoint: https://router.huggingface.co`);
    console.log(`Cost: FREE`);
    console.log(
      `Rate Limits: ${process.env.HUGGINGFACE_API_KEY ? '1000 req/day' : 'Generous free tier'}`
    );
    console.log('========================================\n');
  }
}

// ==================== SINGLETON EXPORT ====================
export const huggingFaceEvaluator = new HuggingFaceEvaluator();
