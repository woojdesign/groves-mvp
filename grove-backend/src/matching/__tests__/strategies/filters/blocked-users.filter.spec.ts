import { Test, TestingModule } from '@nestjs/testing';
import { BlockedUsersFilter } from '../../../strategies/filters/blocked-users.filter';
import { PrismaService } from '../../../../prisma/prisma.service';

describe('BlockedUsersFilter', () => {
  let filter: BlockedUsersFilter;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockedUsersFilter,
        {
          provide: PrismaService,
          useValue: {
            safetyFlag: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    filter = module.get<BlockedUsersFilter>(BlockedUsersFilter);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should filter out reported users', async () => {
    const sourceUserId = 'source-user-id';
    const candidateUserIds = ['candidate-1', 'candidate-2', 'candidate-3'];

    // Mock safety flags (source reported candidate-1, candidate-2 reported source)
    (prisma.safetyFlag.findMany as jest.Mock).mockResolvedValue([
      { reporterId: sourceUserId, reportedId: 'candidate-1' },
      { reporterId: 'candidate-2', reportedId: sourceUserId },
    ]);

    const result = await filter.filter(sourceUserId, candidateUserIds);

    // Only candidate-3 should remain
    expect(result).toEqual(['candidate-3']);
  });

  it('should return all candidates if no safety flags', async () => {
    const sourceUserId = 'source-user-id';
    const candidateUserIds = ['candidate-1', 'candidate-2'];

    (prisma.safetyFlag.findMany as jest.Mock).mockResolvedValue([]);

    const result = await filter.filter(sourceUserId, candidateUserIds);

    expect(result).toEqual(candidateUserIds);
  });

  it('should return strategy name', () => {
    expect(filter.getName()).toBe('BlockedUsersFilter');
  });
});
