import { Test, TestingModule } from '@nestjs/testing';
import { MatchingController } from '../matching.controller';
import { MatchingService } from '../matching.service';
import { MatchCandidateDto } from '../dto/match-candidate.dto';

describe('MatchingController', () => {
  let controller: MatchingController;
  let service: MatchingService;

  const mockMatchingService = {
    getMatchesForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchingController],
      providers: [
        {
          provide: MatchingService,
          useValue: mockMatchingService,
        },
      ],
    }).compile();

    controller = module.get<MatchingController>(MatchingController);
    service = module.get<MatchingService>(MatchingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /matches', () => {
    it('should return matches for authenticated user', async () => {
      const mockMatches: MatchCandidateDto[] = [
        {
          candidate: 'user-1',
          name: 'Alice Johnson',
          score: 0.92,
          reason: 'Similar values and goals. Complementary skill sets.',
          sharedInterests: ['AI', 'Sustainability'],
          confidence: 0.87,
        },
        {
          candidate: 'user-2',
          name: 'Bob Smith',
          score: 0.88,
          reason: 'Different backgrounds for diversity.',
          sharedInterests: ['Web3', 'Community building'],
          confidence: 0.85,
        },
      ];

      mockMatchingService.getMatchesForUser.mockResolvedValue(mockMatches);

      const user = { id: 'test-user', email: 'test@example.com' };
      const query = { limit: 5 };

      const result = await controller.getMatches(user, query);

      expect(result).toEqual(mockMatches);
      expect(service.getMatchesForUser).toHaveBeenCalledWith('test-user', query);
    });

    it('should pass query parameters to service', async () => {
      mockMatchingService.getMatchesForUser.mockResolvedValue([]);

      const user = { id: 'test-user', email: 'test@example.com' };
      const query = {
        limit: 10,
        minSimilarityScore: 0.8,
        diversityWeight: 0.4,
      };

      await controller.getMatches(user, query);

      expect(service.getMatchesForUser).toHaveBeenCalledWith('test-user', query);
    });

    it('should handle empty matches', async () => {
      mockMatchingService.getMatchesForUser.mockResolvedValue([]);

      const user = { id: 'test-user', email: 'test@example.com' };
      const query = {};

      const result = await controller.getMatches(user, query);

      expect(result).toEqual([]);
    });
  });
});
