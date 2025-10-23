import {
  IRankingStrategy,
  RankingCandidate,
} from '../../interfaces/ranking-strategy.interface';

/**
 * Mock ranking strategy for testing.
 * Adds a simple diversity score and computes final score.
 */
export class MockRankingStrategy implements IRankingStrategy {
  async rerank(
    sourceUserId: string,
    candidates: RankingCandidate[],
  ): Promise<RankingCandidate[]> {
    // Add diversity scores and compute final scores
    const rankedCandidates = candidates.map((candidate) => ({
      ...candidate,
      diversityScore: 0.75, // Fixed diversity score for testing
      finalScore: 0.7 * candidate.similarityScore + 0.3 * 0.75, // 70/30 weighted
    }));

    // Sort by final score descending
    return rankedCandidates.sort((a, b) => b.finalScore - a.finalScore);
  }

  getName(): string {
    return 'MockRankingStrategy';
  }
}
