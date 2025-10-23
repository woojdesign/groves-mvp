import { Test, TestingModule } from '@nestjs/testing';
import { VectorSimilarityStrategy } from '../../../strategies/matching/vector-similarity.strategy';
import { PrismaService } from '../../../../prisma/prisma.service';

describe('VectorSimilarityStrategy', () => {
  let strategy: VectorSimilarityStrategy;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VectorSimilarityStrategy,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<VectorSimilarityStrategy>(VectorSimilarityStrategy);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should compute cosine similarity for candidates', async () => {
    const sourceUserId = 'source-user-id';
    const candidateUserIds = ['candidate-1', 'candidate-2'];

    // Mock source user embedding
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
      { embedding: '[0.1,0.2,0.3]' },
    ]);

    // Mock similarity query results
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
      { user_id: 'candidate-1', similarity_score: 0.92 },
      { user_id: 'candidate-2', similarity_score: 0.88 },
    ]);

    const result = await strategy.computeSimilarity(
      sourceUserId,
      candidateUserIds,
    );

    expect(result.size).toBe(2);
    expect(result.get('candidate-1')).toBe(0.92);
    expect(result.get('candidate-2')).toBe(0.88);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('should return empty map for empty candidate list', async () => {
    const result = await strategy.computeSimilarity('source-user-id', []);
    expect(result.size).toBe(0);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('should throw error if source user has no embedding', async () => {
    const sourceUserId = 'source-user-id';
    const candidateUserIds = ['candidate-1'];

    // Mock empty result (no embedding)
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);

    await expect(
      strategy.computeSimilarity(sourceUserId, candidateUserIds),
    ).rejects.toThrow('No embedding found for user');
  });

  it('should handle array format embeddings', async () => {
    const sourceUserId = 'source-user-id';
    const candidateUserIds = ['candidate-1'];

    // Mock embedding as array (already parsed)
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
      { embedding: [0.1, 0.2, 0.3] },
    ]);

    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
      { user_id: 'candidate-1', similarity_score: 0.85 },
    ]);

    const result = await strategy.computeSimilarity(
      sourceUserId,
      candidateUserIds,
    );

    expect(result.get('candidate-1')).toBe(0.85);
  });

  it('should return strategy name', () => {
    expect(strategy.getName()).toBe('VectorSimilarityStrategy');
  });
});
