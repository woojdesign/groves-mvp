/**
 * Strategy for re-ranking match candidates.
 * Implementations: diversity re-ranking, recency boosting, etc.
 */
export interface IRankingStrategy {
  /**
   * Re-rank candidates based on additional criteria.
   * @param sourceUserId - The user to generate matches for
   * @param candidates - Initial candidates with similarity scores
   * @returns Re-ranked candidates with updated scores
   */
  rerank(
    sourceUserId: string,
    candidates: RankingCandidate[],
  ): Promise<RankingCandidate[]>;

  /**
   * Strategy name for logging/debugging.
   */
  getName(): string;
}

/**
 * Candidate representation for ranking.
 */
export interface RankingCandidate {
  userId: string;
  similarityScore: number;
  diversityScore?: number;
  finalScore?: number;
  metadata?: Record<string, any>; // For strategy-specific data
}
