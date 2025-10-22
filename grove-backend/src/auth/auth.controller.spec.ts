import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MagicLinkRequestDto } from './dto/magic-link-request.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    requestMagicLink: jest.fn(),
    verifyMagicLink: jest.fn(),
    refreshAccessToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestMagicLink', () => {
    it('should call authService.requestMagicLink', async () => {
      const dto: MagicLinkRequestDto = { email: 'test@example.com' };
      const expectedResult = {
        message: 'Magic link sent to test@example.com',
        expiresIn: '15 minutes',
      };

      mockAuthService.requestMagicLink.mockResolvedValue(expectedResult);

      const result = await controller.requestMagicLink(dto);

      expect(result).toEqual(expectedResult);
      expect(authService.requestMagicLink).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('verifyMagicLink', () => {
    it('should call authService.verifyMagicLink', async () => {
      const dto: VerifyTokenDto = { token: 'test-token' };
      const expectedResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          hasCompletedOnboarding: false,
        },
      };

      mockAuthService.verifyMagicLink.mockResolvedValue(expectedResult);

      const result = await controller.verifyMagicLink(dto);

      expect(result).toEqual(expectedResult);
      expect(authService.verifyMagicLink).toHaveBeenCalledWith(dto.token);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshAccessToken', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'refresh-token' };
      const expectedResult = { accessToken: 'new-access-token' };

      mockAuthService.refreshAccessToken.mockResolvedValue(expectedResult);

      const result = await controller.refreshToken(dto);

      expect(result).toEqual(expectedResult);
      expect(authService.refreshAccessToken).toHaveBeenCalledWith(
        dto.refreshToken,
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout with user id', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const expectedResult = { message: 'Logged out successfully' };

      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout(mockUser);

      expect(result).toEqual(expectedResult);
      expect(authService.logout).toHaveBeenCalledWith('user-1');
    });
  });
});
