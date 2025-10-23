import { IMatchingStrategy } from '../../interfaces/matching-strategy.interface';

/**
 * Mock matching strategy for testing.
 * Returns deterministic similarity scores for predictable testing.
 */
export class MockMatchingStrategy implements IMatchingStrategy {
  async computeSimilarity(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();

    // Return decreasing scores for predictable ordering
    candidateUserIds.forEach((candidateId, index) => {
      // Generate scores from 0.95 down to 0.70 based on index
      const score = 0.95 - index * 0.05;
      scores.set(candidateId, Math.max(0.7, score));
    });

    return scores;
  }

  getName(): string {
    return 'MockMatchingStrategy';
  }
}
