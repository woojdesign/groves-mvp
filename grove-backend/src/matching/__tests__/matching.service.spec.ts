import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from '../matching.service';
import { MockMatchingEngine } from '../engines/mock-matching.engine';
import { PrismaService } from '../../prisma/prisma.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let prisma: PrismaService;
  let mockEngine: MockMatchingEngine;

  beforeEach(async () => {
    mockEngine = new MockMatchingEngine();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        {
          provide: 'MATCHING_ENGINE',
          useValue: mockEngine,
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMatchesForUser', () => {
    it('should return match candidates as DTOs', async () => {
      // Mock user data
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'mock-user-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        orgId: 'org-1',
        status: 'active',
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getMatchesForUser('test-user', {
        limit: 3,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Verify DTO structure
      const match = result[0];
      expect(match).toHaveProperty('candidateId');
      expect(match).toHaveProperty('name');
      expect(match).toHaveProperty('score');
      expect(match).toHaveProperty('reason');
      expect(match).toHaveProperty('sharedInterests');
      expect(match).toHaveProperty('confidence');
    });

    it('should handle missing user data gracefully', async () => {
      // Mock missing user
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.getMatchesForUser('test-user', {
        limit: 2,
      });

      expect(Array.isArray(result)).toBe(true);
      // Should still return matches but with "Unknown User" as name
      if (result.length > 0) {
        expect(result[0].name).toBe('Unknown User');
      }
    });

    it('should pass options to matching engine', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'mock-user-1',
        name: 'Alice',
        email: 'alice@example.com',
        orgId: 'org-1',
        status: 'active',
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const generateSpy = jest.spyOn(mockEngine, 'generateMatches');

      await service.getMatchesForUser('test-user', {
        limit: 5,
        minSimilarityScore: 0.8,
        diversityWeight: 0.4,
      });

      expect(generateSpy).toHaveBeenCalledWith({
        userId: 'test-user',
        limit: 5,
        minSimilarityScore: 0.8,
        diversityWeight: 0.4,
      });
    });
  });
});
