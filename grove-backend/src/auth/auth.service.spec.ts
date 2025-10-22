import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let emailService: EmailService;
  let jwtService: JwtService;

  const mockPrismaService = {
    org: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    authToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    event: {
      create: jest.fn(),
    },
  };

  const mockEmailService = {
    sendMagicLink: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        FRONTEND_URL: 'http://localhost:5173',
        JWT_SECRET: 'test-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestMagicLink', () => {
    it('should generate and send magic link for valid domain', async () => {
      const email = 'test@example.com';
      const mockOrg = { id: 'org-1', domain: 'example.com' };

      mockPrismaService.org.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.authToken.create.mockResolvedValue({
        id: 'token-1',
        email,
        token: 'generated-token',
        expiresAt: new Date(),
        used: false,
      });
      mockEmailService.sendMagicLink.mockResolvedValue(undefined);

      const result = await service.requestMagicLink(email);

      expect(result).toEqual({
        message: 'Magic link sent to test@example.com',
        expiresIn: '15 minutes',
      });
      expect(mockPrismaService.org.findUnique).toHaveBeenCalledWith({
        where: { domain: 'example.com' },
      });
      expect(mockPrismaService.authToken.create).toHaveBeenCalled();
      expect(mockEmailService.sendMagicLink).toHaveBeenCalled();
    });

    it('should not send email for invalid domain but return success', async () => {
      const email = 'test@invalid.com';

      mockPrismaService.org.findUnique.mockResolvedValue(null);

      const result = await service.requestMagicLink(email);

      expect(result).toEqual({
        message: 'Magic link sent to test@invalid.com',
        expiresIn: '15 minutes',
      });
      expect(mockPrismaService.authToken.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendMagicLink).not.toHaveBeenCalled();
    });
  });

  describe('verifyMagicLink', () => {
    it('should verify valid token and return user data', async () => {
      const token = 'valid-token';
      const mockAuthToken = {
        id: 'token-1',
        email: 'test@example.com',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
      };
      const mockOrg = { id: 'org-1', domain: 'example.com' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        orgId: 'org-1',
        status: 'active',
        profile: { id: 'profile-1' },
      };

      mockPrismaService.authToken.findFirst.mockResolvedValue(mockAuthToken);
      mockPrismaService.authToken.update.mockResolvedValue(mockAuthToken);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.event.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.verifyMagicLink(token);

      expect(result).toEqual({
        accessToken: 'jwt-token',
        refreshToken: 'jwt-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          hasCompletedOnboarding: true,
        },
      });
      expect(mockPrismaService.authToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { used: true },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockPrismaService.authToken.findFirst.mockResolvedValue(null);

      await expect(service.verifyMagicLink('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should create new user for first-time login', async () => {
      const token = 'valid-token';
      const mockAuthToken = {
        id: 'token-1',
        email: 'newuser@example.com',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
      };
      const mockOrg = { id: 'org-1', domain: 'example.com' };
      const mockNewUser = {
        id: 'user-new',
        email: 'newuser@example.com',
        name: '',
        orgId: 'org-1',
        status: 'active',
        profile: null,
      };

      mockPrismaService.authToken.findFirst.mockResolvedValue(mockAuthToken);
      mockPrismaService.authToken.update.mockResolvedValue(mockAuthToken);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.org.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.user.create.mockResolvedValue(mockNewUser);
      mockPrismaService.user.update.mockResolvedValue(mockNewUser);
      mockPrismaService.event.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.verifyMagicLink(token);

      expect(result.user.hasCompletedOnboarding).toBe(false);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token for valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = { sub: 'user-1', email: 'test@example.com' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        status: 'active',
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshAccessToken(refreshToken);

      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.refreshAccessToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is deleted', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = { sub: 'user-1', email: 'test@example.com' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        status: 'deleted',
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should create logout event', async () => {
      const userId = 'user-1';
      mockPrismaService.event.create.mockResolvedValue({
        id: 'event-1',
        userId,
        eventType: 'logout',
        metadata: {},
      });

      const result = await service.logout(userId);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: {
          userId,
          eventType: 'logout',
          metadata: {},
        },
      });
    });
  });
});
