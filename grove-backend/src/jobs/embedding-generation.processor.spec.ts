import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import {
  EmbeddingGenerationProcessor,
  EmbeddingJobPayload,
} from './embedding-generation.processor';
import { OpenaiService } from '../openai/openai.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EmbeddingGenerationProcessor', () => {
  let processor: EmbeddingGenerationProcessor;
  let openaiService: OpenaiService;
  let embeddingsService: EmbeddingsService;
  let prisma: PrismaService;

  const mockOpenaiService = {
    preprocessProfileText: jest.fn(),
    generateEmbedding: jest.fn(),
  };

  const mockEmbeddingsService = {
    createEmbedding: jest.fn(),
  };

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingGenerationProcessor,
        { provide: OpenaiService, useValue: mockOpenaiService },
        { provide: EmbeddingsService, useValue: mockEmbeddingsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    processor = module.get<EmbeddingGenerationProcessor>(
      EmbeddingGenerationProcessor,
    );
    openaiService = module.get<OpenaiService>(OpenaiService);
    embeddingsService = module.get<EmbeddingsService>(EmbeddingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleEmbeddingGeneration', () => {
    it('should successfully process embedding generation job', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const profileId = '987e6543-e21b-12d3-a456-426614174000';

      const mockProfile = {
        id: profileId,
        userId,
        nicheInterest: 'AI and machine learning',
        project: 'Building a recommendation system',
        rabbitHole: 'Graph neural networks',
        connectionType: 'collaboration',
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockVector = new Array(1536).fill(0.1);

      const mockJob: Partial<Job<EmbeddingJobPayload>> = {
        data: { userId, profileId },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);
      mockOpenaiService.preprocessProfileText.mockReturnValue(
        'Interest: AI and machine learning. Project: Building a recommendation system. Exploring: Graph neural networks',
      );
      mockOpenaiService.generateEmbedding.mockResolvedValue(mockVector);
      mockEmbeddingsService.createEmbedding.mockResolvedValue({
        id: 'embedding-id',
        userId,
      });

      const result = await processor.handleEmbeddingGeneration(
        mockJob as Job<EmbeddingJobPayload>,
      );

      expect(result.success).toBe(true);
      expect(result.userId).toBe(userId);
      expect(result.profileId).toBe(profileId);
      expect(result.dimensions).toBe(1536);

      expect(mockPrismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { id: profileId },
      });
      expect(mockOpenaiService.preprocessProfileText).toHaveBeenCalledWith(
        mockProfile.nicheInterest,
        mockProfile.project,
        mockProfile.rabbitHole,
      );
      expect(mockOpenaiService.generateEmbedding).toHaveBeenCalled();
      expect(mockEmbeddingsService.createEmbedding).toHaveBeenCalledWith(
        userId,
        mockVector,
      );
    });

    it('should throw error if profile not found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const profileId = '987e6543-e21b-12d3-a456-426614174000';

      const mockJob: Partial<Job<EmbeddingJobPayload>> = {
        data: { userId, profileId },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(
        processor.handleEmbeddingGeneration(
          mockJob as Job<EmbeddingJobPayload>,
        ),
      ).rejects.toThrow(`Profile ${profileId} not found`);
    });

    it('should throw error if OpenAI fails', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const profileId = '987e6543-e21b-12d3-a456-426614174000';

      const mockProfile = {
        id: profileId,
        userId,
        nicheInterest: 'AI and machine learning',
        project: 'Building a recommendation system',
        rabbitHole: null,
        connectionType: 'collaboration',
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockJob: Partial<Job<EmbeddingJobPayload>> = {
        data: { userId, profileId },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);
      mockOpenaiService.preprocessProfileText.mockReturnValue(
        'Interest: AI and machine learning. Project: Building a recommendation system',
      );
      mockOpenaiService.generateEmbedding.mockRejectedValue(
        new Error('OpenAI API error'),
      );

      await expect(
        processor.handleEmbeddingGeneration(
          mockJob as Job<EmbeddingJobPayload>,
        ),
      ).rejects.toThrow('OpenAI API error');
    });
  });
});
