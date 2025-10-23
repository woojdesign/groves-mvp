import { Test, TestingModule } from '@nestjs/testing';
import { PriorMatchesFilter } from '../../../strategies/filters/prior-matches.filter';
import { PrismaService } from '../../../../prisma/prisma.service';

describe('PriorMatchesFilter', () => {
  let filter: PriorMatchesFilter;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriorMatchesFilter,
        {
          provide: PrismaService,
          useValue: {
            match: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    filter = module.get<PriorMatchesFilter>(PriorMatchesFilter);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should filter out prior matches', async () => {
    const sourceUserId = 'source-user-id';
    const candidateUserIds = ['candidate-1', 'candidate-2', 'candidate-3'];

    // Mock prior matches
    (prisma.match.findMany as jest.Mock).mockResolvedValue([
      { userAId: sourceUserId, userBId: 'candidate-1' },
      { userAId: 'candidate-2', userBId: sourceUserId },
    ]);

    const result = await filter.filter(sourceUserId, candidateUserIds);

    // Only candidate-3 should remain
    expect(result).toEqual(['candidate-3']);
    expect(result.length).toBe(1);
  });

  it('should return all candidates if no prior matches', async () => {
    const sourceUserId = 'source-user-id';
    const candidateUserIds = ['candidate-1', 'candidate-2'];

    // Mock no prior matches
    (prisma.match.findMany as jest.Mock).mockResolvedValue([]);

    const result = await filter.filter(sourceUserId, candidateUserIds);

    expect(result).toEqual(candidateUserIds);
  });

  it('should return empty array for empty candidate list', async () => {
    const result = await filter.filter('source-user-id', []);
    expect(result).toEqual([]);
  });

  it('should return strategy name', () => {
    expect(filter.getName()).toBe('PriorMatchesFilter');
  });
});
