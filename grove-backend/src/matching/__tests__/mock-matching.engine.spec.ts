import { MockMatchingEngine } from '../engines/mock-matching.engine';

describe('MockMatchingEngine', () => {
  let engine: MockMatchingEngine;

  beforeEach(() => {
    engine = new MockMatchingEngine();
  });

  describe('generateMatches', () => {
    it('should generate matches for a user', async () => {
      const result = await engine.generateMatches({
        userId: 'test-user',
        limit: 3,
      });

      expect(result.userId).toBe('test-user');
      expect(result.matches.length).toBeLessThanOrEqual(3);
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('should return matches with required fields', async () => {
      const result = await engine.generateMatches({
        userId: 'test-user',
        limit: 5,
      });

      const match = result.matches[0];
      expect(match).toHaveProperty('candidateUserId');
      expect(match).toHaveProperty('similarityScore');
      expect(match).toHaveProperty('diversityScore');
      expect(match).toHaveProperty('finalScore');
      expect(match).toHaveProperty('reasons');
      expect(Array.isArray(match.reasons)).toBe(true);
    });

    it('should filter by minimum similarity score', async () => {
      const result = await engine.generateMatches({
        userId: 'test-user',
        minSimilarityScore: 0.9,
        limit: 10,
      });

      // All matches should have similarity score >= 0.9
      result.matches.forEach((match) => {
        expect(match.similarityScore).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should respect limit parameter', async () => {
      const result = await engine.generateMatches({
        userId: 'test-user',
        limit: 2,
      });

      expect(result.matches.length).toBeLessThanOrEqual(2);
    });

    it('should include metadata in response', async () => {
      const result = await engine.generateMatches({
        userId: 'test-user',
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalCandidatesConsidered).toBeGreaterThan(0);
      expect(result.metadata.totalFiltered).toBeGreaterThanOrEqual(0);
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateBatchMatches', () => {
    it('should process multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const result = await engine.generateBatchMatches(userIds);

      expect(result.totalUsersProcessed).toBe(3);
      expect(result.failures.length).toBe(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should generate multiple matches per user', async () => {
      const userIds = ['user-1', 'user-2'];
      const result = await engine.generateBatchMatches(userIds);

      // Default is 5 matches per user
      expect(result.totalMatchesGenerated).toBeGreaterThan(0);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const result = await engine.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.details.vectorIndexReady).toBe(true);
      expect(result.details.databaseConnected).toBe(true);
    });
  });
});
