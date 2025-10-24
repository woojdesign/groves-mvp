import { Test, TestingModule } from '@nestjs/testing';
import { IntrosService } from './intros.service';
import { PrismaService } from '../prisma/prisma.service';
import { EMAIL_SERVICE } from '../email/email.service.interface';
import { NotFoundException } from '@nestjs/common';

describe('IntrosService', () => {
  let service: IntrosService;
  let prisma: PrismaService;
  let emailService: any;

  const mockPrismaService = {
    intro: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    match: {
      findUnique: jest.fn(),
    },
    event: {
      createMany: jest.fn(),
    },
  };

  const mockEmailService = {
    sendMutualIntroduction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntrosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EMAIL_SERVICE,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<IntrosService>(IntrosService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get(EMAIL_SERVICE);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIntroduction', () => {
    const matchId = 'match-123';
    const mockMatch = {
      id: matchId,
      userAId: 'user-a',
      userBId: 'user-b',
      sharedInterest: 'urban agriculture',
      context: 'Both interested in sustainable food systems',
      userA: {
        id: 'user-a',
        name: 'Alice',
        email: 'alice@example.com',
      },
      userB: {
        id: 'user-b',
        name: 'Bob',
        email: 'bob@example.com',
      },
    };

    it('should create a new introduction and send emails', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.intro.findUnique.mockResolvedValue(null);
      mockPrismaService.intro.create.mockResolvedValue({
        id: 'intro-123',
        matchId,
        status: 'mutual',
        introSentAt: new Date(),
      });
      mockPrismaService.event.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createIntroduction(matchId);

      expect(result).toEqual({
        id: 'intro-123',
        status: 'mutual',
      });

      expect(mockEmailService.sendMutualIntroduction).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.intro.create).toHaveBeenCalled();
      expect(mockPrismaService.event.createMany).toHaveBeenCalled();
    });

    it('should return existing intro if already exists', async () => {
      const existingIntro = {
        id: 'existing-intro',
        matchId,
        status: 'mutual',
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.intro.findUnique.mockResolvedValue(existingIntro);

      const result = await service.createIntroduction(matchId);

      expect(result).toEqual({
        id: 'existing-intro',
        status: 'mutual',
      });

      expect(mockPrismaService.intro.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendMutualIntroduction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if match not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(service.createIntroduction(matchId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getActiveIntros', () => {
    const userId = 'user-a';

    it('should return active introductions for user', async () => {
      const mockIntros = [
        {
          id: 'intro-1',
          status: 'mutual',
          createdAt: new Date(),
          match: {
            id: 'match-1',
            userAId: userId,
            userBId: 'user-b',
            sharedInterest: 'urban agriculture',
            context: 'Both interested in sustainable food',
            userA: {
              id: userId,
              name: 'Alice',
              email: 'alice@example.com',
            },
            userB: {
              id: 'user-b',
              name: 'Bob',
              email: 'bob@example.com',
            },
          },
        },
      ];

      mockPrismaService.intro.findMany.mockResolvedValue(mockIntros);

      const result = await service.getActiveIntros(userId);

      expect(result).toHaveLength(1);
      expect(result[0].match.name).toBe('Bob');
      expect(result[0].match.email).toBe('bob@example.com');
    });
  });
});
