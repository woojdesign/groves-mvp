import { Test, TestingModule } from '@nestjs/testing';
import { IntrosController } from './intros.controller';
import { IntrosService } from './intros.service';

describe('IntrosController', () => {
  let controller: IntrosController;
  let service: IntrosService;

  const mockIntrosService = {
    getActiveIntros: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntrosController],
      providers: [
        {
          provide: IntrosService,
          useValue: mockIntrosService,
        },
      ],
    }).compile();

    controller = module.get<IntrosController>(IntrosController);
    service = module.get<IntrosService>(IntrosService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /intros', () => {
    it('should return active intros for user', async () => {
      const mockIntros = [
        {
          id: 'intro-1',
          match: {
            id: 'match-1',
            name: 'Bob',
            email: 'bob@example.com',
            sharedInterest: 'urban agriculture',
            interests: ['sustainable food', 'community gardens'],
          },
          status: 'active',
          createdAt: '2025-10-23T00:00:00.000Z',
        },
      ];

      mockIntrosService.getActiveIntros.mockResolvedValue(mockIntros);

      const result = await controller.getIntros({ id: 'user-a', email: 'alice@example.com' });

      expect(result).toEqual({ intros: mockIntros });
      expect(service.getActiveIntros).toHaveBeenCalledWith('user-a');
    });
  });
});
