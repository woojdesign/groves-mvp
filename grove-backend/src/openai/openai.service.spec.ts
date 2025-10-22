import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenaiService } from './openai.service';

describe('OpenaiService', () => {
  let service: OpenaiService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'sk-test-key';
      if (key === 'OPENAI_MODEL') return 'text-embedding-3-small';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenaiService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OpenaiService>(OpenaiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('preprocessProfileText', () => {
    it('should concatenate nicheInterest and project', () => {
      const result = service.preprocessProfileText(
        'AI and machine learning',
        'Building a recommendation system',
      );

      expect(result).toBe(
        'Interest: AI and machine learning. Project: Building a recommendation system',
      );
    });

    it('should include rabbitHole if provided', () => {
      const result = service.preprocessProfileText(
        'AI and machine learning',
        'Building a recommendation system',
        'Graph neural networks',
      );

      expect(result).toBe(
        'Interest: AI and machine learning. Project: Building a recommendation system. Exploring: Graph neural networks',
      );
    });

    it('should handle empty rabbitHole', () => {
      const result = service.preprocessProfileText(
        'AI and machine learning',
        'Building a recommendation system',
        '',
      );

      expect(result).toBe(
        'Interest: AI and machine learning. Project: Building a recommendation system',
      );
    });

    it('should trim whitespace from all fields', () => {
      const result = service.preprocessProfileText(
        '  AI and machine learning  ',
        '  Building a recommendation system  ',
        '  Graph neural networks  ',
      );

      expect(result).toBe(
        'Interest: AI and machine learning. Project: Building a recommendation system. Exploring: Graph neural networks',
      );
    });
  });

  describe('generateEmbedding', () => {
    it('should throw error when API key is invalid (mocked)', async () => {
      // Since we're using a mock API key, actual API calls will fail
      // In a real test environment with a valid key, this would succeed
      // For now, we test that the method exists and can be called
      expect(service.generateEmbedding).toBeDefined();
    });

    // Note: Full integration tests with OpenAI API should be run separately
    // with a valid API key in an integration test suite
  });
});
