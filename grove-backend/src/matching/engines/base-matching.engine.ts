import {
  IMatchingEngine,
  GenerateMatchesRequest,
  GenerateMatchesResponse,
  BatchMatchOptions,
  BatchMatchResult,
  MatchingEngineHealthStatus,
  MatchCandidate,
} from '../interfaces';
import { IMatchingStrategy } from '../interfaces/matching-strategy.interface';
import { IFilterStrategy } from '../interfaces/filter-strategy.interface';
import { IRankingStrategy } from '../interfaces/ranking-strategy.interface';

/**
 * Abstract base class for matching engines using the template method pattern.
 * Provides the orchestration logic while delegating specific steps to strategies.
 * Subclasses must implement getCandidatePool() and generateReasons().
 */
export abstract class BaseMatchingEngine implements IMatchingEngine {
  constructor(
    protected readonly matchingStrategy: IMatchingStrategy,
    protected readonly filterStrategy: IFilterStrategy,
    protected readonly rankingStrategy: IRankingStrategy,
  ) {}

  /**
   * Template method for generating matches.
   * Orchestrates the matching pipeline using injected strategies.
   */
  async generateMatches(
    request: GenerateMatchesRequest,
  ): Promise<GenerateMatchesResponse> {
    const startTime = Date.now();

    // Step 1: Get candidate pool (implemented by subclass)
    const allCandidates = await this.getCandidatePool(request.userId);

    // Step 2: Apply filters (prior matches, blocked users, etc.)
    const filteredCandidates = await this.filterStrategy.filter(
      request.userId,
      allCandidates,
    );

    // Step 3: Compute similarity scores
    const similarityScores = await this.matchingStrategy.computeSimilarity(
      request.userId,
      filteredCandidates,
    );

    // Step 4: Filter by minimum similarity threshold
    const candidates = Array.from(similarityScores.entries())
      .filter(([_, score]) => score >= (request.minSimilarityScore ?? 0.7))
      .map(([userId, score]) => ({
        userId,
        similarityScore: score,
      }));

    // Step 5: Re-rank for diversity
    const rankedCandidates = await this.rankingStrategy.rerank(
      request.userId,
      candidates,
    );

    // Step 6: Take top N matches
    const topMatches = rankedCandidates.slice(0, request.limit ?? 5);

    // Step 7: Generate explainability reasons
    const matches: MatchCandidate[] = await Promise.all(
      topMatches.map(async (candidate) => ({
        candidateUserId: candidate.userId,
        similarityScore: candidate.similarityScore,
        diversityScore: candidate.diversityScore ?? 0,
        finalScore: candidate.finalScore ?? candidate.similarityScore,
        reasons: await this.generateReasons(request.userId, candidate.userId),
      })),
    );

    return {
      userId: request.userId,
      matches,
      metadata: {
        totalCandidatesConsidered: allCandidates.length,
        totalFiltered: allCandidates.length - filteredCandidates.length,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Batch generate matches for multiple users.
   * Default implementation processes users sequentially with controlled parallelism.
   */
  async generateBatchMatches(
    userIds: string[],
    options?: BatchMatchOptions,
  ): Promise<BatchMatchResult> {
    const batchSize = options?.batchSize ?? 100;
    const parallelism = options?.parallelism ?? 5;
    const startTime = Date.now();

    const results: BatchMatchResult = {
      totalUsersProcessed: 0,
      totalMatchesGenerated: 0,
      failures: [],
      durationMs: 0,
    };

    // Process in batches with controlled parallelism
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      // Process batch with limited concurrency
      const promises = batch.map((userId) =>
        this.generateMatches({ userId, limit: 5 })
          .then((result) => {
            results.totalUsersProcessed++;
            results.totalMatchesGenerated += result.matches.length;
            return { success: true };
          })
          .catch((error) => {
            results.failures.push({ userId, error: error.message });
            return { success: false };
          }),
      );

      // Wait for batch to complete
      await Promise.all(promises);
    }

    results.durationMs = Date.now() - startTime;
    return results;
  }

  /**
   * Health check for matching engine.
   * Default implementation returns healthy status.
   * Subclasses can override to check database, vector index, etc.
   */
  async healthCheck(): Promise<MatchingEngineHealthStatus> {
    return {
      status: 'healthy',
      details: {
        vectorIndexReady: true,
        databaseConnected: true,
      },
    };
  }

  /**
   * Get the pool of candidate users to consider for matching.
   * Must be implemented by subclass (e.g., query database for users with embeddings).
   * @param sourceUserId - User to generate matches for
   * @returns Array of candidate user IDs
   */
  protected abstract getCandidatePool(sourceUserId: string): Promise<string[]>;

  /**
   * Generate human-readable reasons why two users were matched.
   * Must be implemented by subclass (e.g., extract shared interests from profiles).
   * @param sourceUserId - The user requesting matches
   * @param candidateUserId - The matched candidate
   * @returns Array of reason strings
   */
  protected abstract generateReasons(
    sourceUserId: string,
    candidateUserId: string,
  ): Promise<string[]>;
}
