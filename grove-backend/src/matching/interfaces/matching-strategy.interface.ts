/**
 * Strategy for computing similarity between two users.
 * Implementations: vector similarity, collaborative filtering, hybrid.
 */
export interface IMatchingStrategy {
  /**
   * Compute similarity score between source user and candidate users.
   * @param sourceUserId - The user to generate matches for
   * @param candidateUserIds - Pool of potential matches
   * @returns Map of candidateUserId -> similarity score (0-1)
   */
  computeSimilarity(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<Map<string, number>>;

  /**
   * Strategy name for logging/debugging.
   */
  getName(): string;
}
