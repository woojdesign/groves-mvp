import { Test, TestingModule } from '@nestjs/testing';
import { SameOrgFilter } from '../../../strategies/filters/same-org.filter';
import { PrismaService } from '../../../../prisma/prisma.service';

describe('SameOrgFilter', () => {
  let filter: SameOrgFilter;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SameOrgFilter,
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

    filter = module.get<SameOrgFilter>(SameOrgFilter);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should filter out users from same organization', async () => {
    const sourceUserId = 'source-user-id';
    const candidateUserIds = ['candidate-1', 'candidate-2', 'candidate-3'];

    // Mock source user org
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: sourceUserId,
      orgId: 'org-1',
    });

    // Mock candidate users
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'candidate-1', orgId: 'org-1' }, // Same org - should be filtered
      { id: 'candidate-2', orgId: 'org-2' }, // Different org - keep
      { id: 'candidate-3', orgId: 'org-3' }, // Different org - keep
    ]);

    const result = await filter.filter(sourceUserId, candidateUserIds);

    expect(result).toEqual(['candidate-2', 'candidate-3']);
  });

  it('should throw error if source user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      filter.filter('nonexistent-user', ['candidate-1']),
    ).rejects.toThrow('Source user nonexistent-user not found');
  });

  it('should return strategy name', () => {
    expect(filter.getName()).toBe('SameOrgFilter');
  });
});
