import { Test, TestingModule } from '@nestjs/testing';
import { DiversityRankingStrategy } from '../../../strategies/ranking/diversity-ranking.strategy';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RankingCandidate } from '../../../interfaces/ranking-strategy.interface';

describe('DiversityRankingStrategy', () => {
  let strategy: DiversityRankingStrategy;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiversityRankingStrategy,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    strategy = module.get<DiversityRankingStrategy>(DiversityRankingStrategy);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should boost candidates with different org and connection type', async () => {
    const sourceUserId = 'source-user-id';
    const candidates: RankingCandidate[] = [
      { userId: 'candidate-1', similarityScore: 0.8 },
      { userId: 'candidate-2', similarityScore: 0.85 },
    ];

    // Mock source user
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: sourceUserId,
      orgId: 'org-1',
      profile: {
        connectionType: 'mentorship',
      },
      org: {
        domain: 'company1.com',
      },
    });

    // Mock candidates
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'candidate-1',
        orgId: 'org-1', // Same org
        profile: {
          connectionType: 'mentorship', // Same connection type
        },
        org: {
          domain: 'company1.com', // Same domain
        },
      },
      {
        id: 'candidate-2',
        orgId: 'org-2', // Different org (+0.4)
        profile: {
          connectionType: 'collaboration', // Different connection type (+0.3)
        },
        org: {
          domain: 'company2.com', // Different domain (+0.3)
        },
      },
    ]);

    const result = await strategy.rerank(sourceUserId, candidates);

    expect(result.length).toBe(2);

    // Candidate 2 should have higher diversity score
    const candidate2Result = result.find((c) => c.userId === 'candidate-2');
    expect(candidate2Result?.diversityScore).toBe(1.0); // 0.4 + 0.3 + 0.3
    expect(candidate2Result?.finalScore).toBeGreaterThan(
      candidate2Result?.similarityScore!,
    );

    // Candidate 1 should have low diversity score (all same)
    const candidate1Result = result.find((c) => c.userId === 'candidate-1');
    expect(candidate1Result?.diversityScore).toBe(0);

    // Results should be sorted by final score
    expect(result[0].finalScore).toBeGreaterThanOrEqual(result[1].finalScore);
  });

  it('should return empty array for empty candidates', async () => {
    const result = await strategy.rerank('source-user-id', []);
    expect(result).toEqual([]);
  });

  it('should throw error if source user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      strategy.rerank('nonexistent-user', [
        { userId: 'candidate-1', similarityScore: 0.8 },
      ]),
    ).rejects.toThrow('Source user nonexistent-user not found');
  });

  it('should return strategy name', () => {
    expect(strategy.getName()).toBe('DiversityRankingStrategy');
  });
});
