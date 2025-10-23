import { Injectable } from '@nestjs/common';
import { BaseMatchingEngine } from './base-matching.engine';
import { MockMatchingStrategy } from '../__tests__/mocks/mock-matching-strategy';
import { MockFilterStrategy } from '../__tests__/mocks/mock-filter-strategy';
import { MockRankingStrategy } from '../__tests__/mocks/mock-ranking-strategy';

/**
 * Mock matching engine for testing and development.
 * Returns fake matches without requiring database or real embeddings.
 * Useful for API development while algorithm team builds real engine.
 */
@Injectable()
export class MockMatchingEngine extends BaseMatchingEngine {
  constructor() {
    super(
      new MockMatchingStrategy(),
      new MockFilterStrategy(),
      new MockRankingStrategy(),
    );
  }

  /**
   * Returns a fixed set of mock candidate user IDs.
   * In production, this would query the database for users with embeddings.
   */
  protected async getCandidatePool(sourceUserId: string): Promise<string[]> {
    // Return 5 fake candidate IDs (excluding source user)
    const mockCandidates = [
      'mock-user-1',
      'mock-user-2',
      'mock-user-3',
      'mock-user-4',
      'mock-user-5',
    ];

    // Filter out source user if it happens to be in the list
    return mockCandidates.filter((id) => id !== sourceUserId);
  }

  /**
   * Generates fake explainability reasons.
   * In production, this would analyze profile data to explain the match.
   */
  protected async generateReasons(
    sourceUserId: string,
    candidateUserId: string,
  ): Promise<string[]> {
    // Return deterministic fake reasons
    return [
      'Similar values and goals',
      'Complementary skill sets',
      'Different professional backgrounds for diversity',
    ];
  }
}
