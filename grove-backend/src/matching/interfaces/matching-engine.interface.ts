/**
 * Primary contract for the matching engine.
 * Any implementation (in-process, microservice, third-party) must satisfy this interface.
 */
export interface IMatchingEngine {
  /**
   * Generate matches for a single user.
   * @param request - User ID and matching parameters
   * @returns Ranked list of match candidates with scores
   */
  generateMatches(request: GenerateMatchesRequest): Promise<GenerateMatchesResponse>;

  /**
   * Batch generate matches for multiple users (e.g., nightly job).
   * @param userIds - List of user IDs to generate matches for
   * @param options - Batch processing options
   * @returns Summary of matches generated per user
   */
  generateBatchMatches(
    userIds: string[],
    options?: BatchMatchOptions,
  ): Promise<BatchMatchResult>;

  /**
   * Health check for matching engine (e.g., vector index status).
   */
  healthCheck(): Promise<MatchingEngineHealthStatus>;
}

/**
 * Request payload for single-user match generation.
 */
export interface GenerateMatchesRequest {
  userId: string;
  limit?: number; // Max matches to return (default: 5)
  minSimilarityScore?: number; // Threshold for similarity (default: 0.7)
  diversityWeight?: number; // Weight for diversity vs similarity (default: 0.3)
}

/**
 * Response containing ranked match candidates.
 */
export interface GenerateMatchesResponse {
  userId: string;
  matches: MatchCandidate[];
  metadata: {
    totalCandidatesConsidered: number;
    totalFiltered: number;
    processingTimeMs: number;
  };
}

/**
 * A single match candidate with scoring details.
 */
export interface MatchCandidate {
  candidateUserId: string;
  similarityScore: number; // 0-1, from vector similarity
  diversityScore: number; // 0-1, from re-ranking
  finalScore: number; // Weighted combination
  reasons: string[]; // Explainability: ["Similar values", "Different backgrounds"]
}

/**
 * Options for batch matching.
 */
export interface BatchMatchOptions {
  batchSize?: number; // Process N users at a time (default: 100)
  parallelism?: number; // Number of concurrent workers (default: 5)
}

/**
 * Result summary for batch matching.
 */
export interface BatchMatchResult {
  totalUsersProcessed: number;
  totalMatchesGenerated: number;
  failures: Array<{ userId: string; error: string }>;
  durationMs: number;
}

/**
 * Health status for matching engine.
 */
export interface MatchingEngineHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    vectorIndexReady: boolean;
    databaseConnected: boolean;
    lastSuccessfulMatch?: Date;
  };
}
