import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from '../matching.service';
import { MockMatchingEngine } from '../engines/mock-matching.engine';
import { PrismaService } from '../../prisma/prisma.service';
import { IntrosService } from '../../intros/intros.service';
import { EmailService } from '../../email/email.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let prisma: PrismaService;
  let mockEngine: MockMatchingEngine;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    match: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    intro: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    event: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
  };

  const mockIntrosService = {
    createIntroduction: jest.fn(),
  };

  const mockEmailService = {
    sendMatchNotification: jest.fn(),
    sendMutualIntroduction: jest.fn(),
  };

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
          useValue: mockPrismaService,
        },
        {
          provide: IntrosService,
          useValue: mockIntrosService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMatchesForUser', () => {
    it('should return existing matches from database', async () => {
      const mockMatches = [
        {
          id: 'match-1',
          userAId: 'test-user',
          userBId: 'user-b',
          similarityScore: 0.85,
          sharedInterest: 'urban agriculture',
          context: 'Both interested in sustainable food',
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userA: { id: 'test-user', name: 'Alice' },
          userB: { id: 'user-b', name: 'Bob' },
        },
      ];

      mockPrismaService.match.findMany.mockResolvedValue(mockMatches);

      const result = await service.getMatchesForUser('test-user', {
        limit: 3,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Bob');
      expect(mockPrismaService.match.findMany).toHaveBeenCalled();
    });

    it('should generate new matches if none exist', async () => {
      // No existing matches
      mockPrismaService.match.findMany.mockResolvedValue([]);

      // Mock user data for email notifications
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({
          id: 'test-user',
          name: 'Alice',
          email: 'alice@example.com',
          orgId: 'org-1',
          status: 'active',
          lastActive: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValue({
          id: 'mock-user-1',
          name: 'Bob',
          email: 'bob@example.com',
          orgId: 'org-2',
          status: 'active',
          lastActive: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockPrismaService.match.create.mockResolvedValue({
        id: 'match-1',
        status: 'pending',
        expiresAt: new Date(),
      });

      const result = await service.getMatchesForUser('test-user', {
        limit: 3,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(mockPrismaService.match.create).toHaveBeenCalled();

      // Verify DTO structure
      const match = result[0];
      expect(match).toHaveProperty('id');
      expect(match).toHaveProperty('candidateId');
      expect(match).toHaveProperty('name');
      expect(match).toHaveProperty('score');
      expect(match).toHaveProperty('reason');
      expect(match).toHaveProperty('sharedInterests');
      expect(match).toHaveProperty('confidence');
    });
  });
});
