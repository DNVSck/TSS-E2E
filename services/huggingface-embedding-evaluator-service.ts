/**
 * HuggingFace Embedding Evaluator Service
 * 
 * Free alternative to OpenAI embeddings using Hugging Face models.
 * Supports both Inference API and local model execution.
 * 
 * Popular Models:
 * - sentence-transformers/all-MiniLM-L6-v2 (fast, 384 dims)
 * - sentence-transformers/all-mpnet-base-v2 (quality, 768 dims)
 * - BAAI/bge-small-en-v1.5 (efficient, 384 dims)
 * - intfloat/multilingual-e5-small (multilingual)
 */

import { HfInference } from '@huggingface/inference';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== CONSTANTS ====================
// Using sentence-transformers - available on Inference API
const DEFAULT_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const DEFAULT_SIMILARITY_THRESHOLD = 0.7;
const DEFAULT_BATCH_DELAY_MS = 100; // Much lower than OpenAI since it's free
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

// Score thresholds
const SCORE_THRESHOLDS = {
  excellent: 0.9,
  good: 0.8,
  acceptable: 0.7,
  poor: 0.6,
};

// ==================== TYPES ====================
interface EvaluationCriteria {
  semanticSimilarity: number; // 0-1, the only metric embeddings can truly measure
}

interface EvaluationResult {
  passed: boolean;
  score: number; // Same as semanticSimilarity in criteria
  criteria: EvaluationCriteria;
  explanation: string;
  metadata?: {
    model: string;
    expectedAnswer: string;
    actualAnswer: string;
    processingTimeMs: number;
  };
}

interface BatchEvaluationResult {
  totalTests: number;
  passed: number;
  failed: number;
  averageScore: number;
  results: EvaluationResult[];
  processingTimeMs: number;
}

// ==================== HUGGING FACE EMBEDDING EVALUATOR ====================
export class HuggingFaceEmbeddingEvaluator {
  private hf: HfInference;
  private model: string;
  private similarityThreshold: number;
  private batchDelayMs: number;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(
    model: string = DEFAULT_MODEL,
    similarityThreshold: number = DEFAULT_SIMILARITY_THRESHOLD,
    apiKey?: string // Optional: for higher rate limits on Inference API
  ) {
    this.model = model;
    this.similarityThreshold = similarityThreshold;
    this.batchDelayMs = DEFAULT_BATCH_DELAY_MS;
    this.maxRetries = DEFAULT_MAX_RETRIES;
    this.retryDelayMs = DEFAULT_RETRY_DELAY_MS;

    // Initialize Hugging Face client
    // Version 4.13.10+ automatically uses router.huggingface.co
    // API key is optional - works without it for public models
    const hfApiKey = apiKey || process.env.HUGGINGFACE_API_KEY;
    this.hf = new HfInference(hfApiKey);

    this.logInitialization();
  }

  // ==================== INITIALIZATION ====================
  private logInitialization(): void {
    console.log('\n========================================');
    console.log('Hugging Face Embedding Evaluator');
    console.log('========================================');
    console.log(`Model: ${this.model}`);
    console.log(`Similarity Threshold: ${this.similarityThreshold}`);
    console.log(`Batch Delay: ${this.batchDelayMs}ms`);
    console.log(`Endpoint: https://router.huggingface.co`);
    console.log(`Cost: FREE (No API charges)`);
    console.log(`Rate Limits: ${process.env.HUGGINGFACE_API_KEY ? '1000 req/day' : 'Generous free tier'}`);
    console.log('========================================\n');
  }

  // ==================== EMBEDDING GENERATION ====================
  /**
   * Get embedding vector for a text using Hugging Face Inference API
   */
  private async getEmbedding(text: string, retryCount = 0): Promise<number[]> {
    try {
      const startTime = Date.now();
      
      // Wait a bit if this is a retry (cold start issue)
      if (retryCount > 0) {
        console.log(`Waiting for model to warm up...`);
        await this.sleep(3000); // 3 second delay for cold start
      }
      
      const response = await this.hf.featureExtraction({
        model: this.model,
        inputs: text,
      });

      const processingTime = Date.now() - startTime;
      
      // Handle response format
      let embedding: number[];
      if (Array.isArray(response)) {
        if (Array.isArray(response[0])) {
          // 2D array - take first row
          embedding = response[0] as number[];
        } else {
          // 1D array
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
      
      console.error(`Error generating embedding (attempt ${retryCount + 1}/${this.maxRetries}):`, errorMsg);
      if (statusCode) {
        console.error(`   HTTP Status: ${statusCode}`);
      }

      // Retry logic for transient errors
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
                const delay = this.retryDelayMs * Math.pow(2, retryCount);
                        console.log(`Retrying in ${delay}ms... (Model may be loading)`);
                                await this.sleep(delay);
                                        return this.getEmbedding(text, retryCount + 1);      
                                    }
                                    throw new Error(`Failed to generate embedding after ${retryCount + 1} attempts: ${errorMsg}`);
    }
  }

  /**
   * Check if error is retryable
   */
  private shouldRetry(error: any): boolean {
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'rate limit', 'timeout', 'overloaded', 'HTTP error', 'loading'];
    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.statusCode || error.response?.status;
    
    // Retry on 503 (service unavailable - model loading) or 429 (rate limit)
    if (statusCode === 503 || statusCode === 429) {
      return true;
    }
    
    return retryableErrors.some(msg => errorMessage.includes(msg));
  }

  // ==================== SIMILARITY CALCULATION ====================
  /**
   * Calculate cosine similarity between two vectors
   */
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

  // ==================== EVALUATION ====================
  /**
   * Evaluate a single response using embedding similarity
   */
  async evaluateResponse(
    expectedAnswer: string,
    actualAnswer: string,
    context?: string
  ): Promise<EvaluationResult> {
    const startTime = Date.now();

    try {
      console.log('\n========================================');
      console.log('Starting Hugging Face Evaluation');
      console.log('========================================');
      console.log('Expected:', expectedAnswer.substring(0, 100) + '...');
      console.log('Actual:', actualAnswer.substring(0, 100) + '...');

      // Generate embeddings
      const [expectedEmbedding, actualEmbedding] = await Promise.all([
        this.getEmbedding(expectedAnswer),
        this.getEmbedding(actualAnswer),
      ]);

      // Calculate similarity
      const similarityScore = this.cosineSimilarity(expectedEmbedding, actualEmbedding);
      console.log(`Similarity Score: ${(similarityScore * 100).toFixed(2)}%`);

      // Determine pass/fail based on similarity threshold
      const passed = similarityScore >= this.similarityThreshold;

      // Build criteria (honest: only semantic similarity)
      const criteria: EvaluationCriteria = {
        semanticSimilarity: similarityScore
      };

      // Generate explanation
      const explanation = this.generateExplanation(
        similarityScore,
        passed,
        criteria
      );

      const processingTime = Date.now() - startTime;

      const result: EvaluationResult = {
        passed,
        score: similarityScore, // Honest: this IS the semantic similarity
        criteria,
        explanation,
        metadata: {
          model: this.model,
          expectedAnswer,
          actualAnswer,
          processingTimeMs: processingTime,
        },
      };

      this.logEvaluationResult(result);
      return result;

    } catch (error: any) {
      console.error('Evaluation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate human-readable explanation
   * HONEST: Only semantic similarity is measured, not accuracy/completeness
   */

  private generateExplanation(
    similarity: number,
    passed: boolean,
    criteria: EvaluationCriteria
  ): string {
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

⚠️  Note: This metric measures semantic similarity only.
It does NOT directly measure:
- Factual accuracy (could be semantically similar but factually wrong)
- Completeness (missing information)
- Hallucinations (made-up facts)

The response ${passed ? 'meets' : 'does not meet'} the similarity threshold of ${(this.similarityThreshold * 100).toFixed(0)}%.`;
  }

  // ==================== BATCH EVALUATION ====================
  /**
   * Evaluate multiple responses in batch with rate limiting
   */
  async batchEvaluate(
    testCases: Array<{
      expectedAnswer: string;
      actualAnswer: string;
      context?: string;
    }>
  ): Promise<BatchEvaluationResult> {
    const startTime = Date.now();
    const results: EvaluationResult[] = [];

    console.log(`\nStarting batch evaluation of ${testCases.length} test cases...`);

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\nEvaluating test case ${i + 1}/${testCases.length}...`);

      try {
        const result = await this.evaluateResponse(
          testCase.expectedAnswer,
          testCase.actualAnswer,
          testCase.context
        );
        results.push(result);

        // Add delay between requests (even with free tier, be respectful)
        if (i < testCases.length - 1) {
          await this.sleep(this.batchDelayMs);
        }

      } catch (error: any) {
        console.error(`Failed to evaluate test case ${i + 1}:`, error.message);
        // Add failed result
        results.push({
          passed: false,
          score: 0,
          criteria: { semanticSimilarity: 0 },
          explanation: `Evaluation failed: ${error.message}`,
        });
      }
    }

    const processingTime = Date.now() - startTime;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    const batchResult: BatchEvaluationResult = {
      totalTests: testCases.length,
      passed,
      failed,
      averageScore,
      results,
      processingTimeMs: processingTime,
    };

    this.logBatchResults(batchResult);
    return batchResult;
  }

  // ==================== LOGGING ====================
  private logEvaluationResult(result: EvaluationResult): void {
    console.log('\n========================================')
    console.log(`Evaluation Result: ${result.passed ? 'PASSED' : 'FAILED'}`);
    console.log('========================================');
    console.log(`Semantic Similarity: ${(result.score * 100).toFixed(1)}%`);
    if (result.metadata) {
      console.log(`Processing Time: ${result.metadata.processingTimeMs}ms`);
    }
    console.log('========================================\n');
  }

  private logBatchResults(result: BatchEvaluationResult): void {
    console.log('\n========================================');
    console.log('Batch Evaluation Complete');
    console.log('========================================');
    console.log(`Total Tests: ${result.totalTests}`);
    console.log(`Passed: ${result.passed}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Average Score: ${(result.averageScore * 100).toFixed(1)}%`);
    console.log(`Total Time: ${result.processingTimeMs}ms`);
    console.log(`Total Cost: $0.00 (FREE)`);
    console.log('========================================\n');
  }

  // ==================== UTILITIES ====================
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update similarity threshold
   */
  setSimilarityThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Similarity threshold must be between 0 and 1');
    }
    this.similarityThreshold = threshold;
    console.log(`Similarity threshold updated to: ${threshold}`);
  }

  /**
   * Update batch delay
   */
  setBatchDelay(delayMs: number): void {
    if (delayMs < 0) {
      throw new Error('Batch delay must be non-negative');
    }
    this.batchDelayMs = delayMs;
    console.log(`Batch delay updated to: ${delayMs}ms`);
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      model: this.model,
      similarityThreshold: this.similarityThreshold,
      batchDelayMs: this.batchDelayMs,
      maxRetries: this.maxRetries,
      retryDelayMs: this.retryDelayMs,
      cost: 'FREE',
      rateLimit: process.env.HUGGINGFACE_API_KEY ? '1000 req/day' : 'Generous free tier',
    };
  }
}

// ==================== SINGLETON EXPORT ====================
export const huggingFaceEvaluator = new HuggingFaceEmbeddingEvaluator();
