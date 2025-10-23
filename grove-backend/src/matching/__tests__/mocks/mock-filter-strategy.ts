import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';

/**
 * Mock filter strategy for testing.
 * Returns all candidates unfiltered (no-op filter).
 */
export class MockFilterStrategy implements IFilterStrategy {
  async filter(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<string[]> {
    // No filtering - return all candidates
    return candidateUserIds;
  }

  getName(): string {
    return 'MockFilterStrategy';
  }
}
