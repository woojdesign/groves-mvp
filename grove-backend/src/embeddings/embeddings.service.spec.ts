import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingsService } from './embeddings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EmbeddingsService', () => {
  let service: EmbeddingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $executeRaw: jest.fn(),
    embedding: {
      findUnique: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmbeddingsService>(EmbeddingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEmbedding', () => {
    it('should store an embedding vector for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const vector = new Array(1536).fill(0.1);

      mockPrismaService.$executeRaw.mockResolvedValue(1);
      mockPrismaService.embedding.findUnique.mockResolvedValue({
        id: 'embedding-id',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createEmbedding(userId, vector);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(mockPrismaService.$executeRaw).toHaveBeenCalled();
      expect(mockPrismaService.embedding.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should handle duplicate embeddings (update)', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const vector = new Array(1536).fill(0.2);

      mockPrismaService.$executeRaw.mockResolvedValue(1);
      mockPrismaService.embedding.findUnique.mockResolvedValue({
        id: 'embedding-id',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createEmbedding(userId, vector);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
    });
  });

  describe('getEmbeddingByUserId', () => {
    it('should retrieve an embedding by user ID', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPrismaService.embedding.findUnique.mockResolvedValue({
        id: 'embedding-id',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getEmbeddingByUserId(userId);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(mockPrismaService.embedding.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return null if embedding not found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPrismaService.embedding.findUnique.mockResolvedValue(null);

      const result = await service.getEmbeddingByUserId(userId);

      expect(result).toBeNull();
    });
  });

  describe('hasEmbedding', () => {
    it('should return true if embedding exists', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPrismaService.embedding.count.mockResolvedValue(1);

      const result = await service.hasEmbedding(userId);

      expect(result).toBe(true);
      expect(mockPrismaService.embedding.count).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return false if embedding does not exist', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPrismaService.embedding.count.mockResolvedValue(0);

      const result = await service.hasEmbedding(userId);

      expect(result).toBe(false);
    });
  });

  describe('deleteEmbedding', () => {
    it('should delete an embedding by user ID', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPrismaService.embedding.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteEmbedding(userId);

      expect(mockPrismaService.embedding.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
