import {
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async requestMagicLink(email: string): Promise<{
    message: string;
    expiresIn: string;
  }> {
    this.logger.log(`Magic link requested for: ${email}`);

    // Check if email domain is allowed in orgs table
    const domain = email.split('@')[1];
    const org = await this.prisma.org.findUnique({
      where: { domain },
    });

    if (!org) {
      // For security, don't leak whether email domain exists
      // Still return success to prevent enumeration attacks
      this.logger.warn(`Attempt to request magic link for unallowed domain: ${domain}`);
      return {
        message: `Magic link sent to ${email}`,
        expiresIn: '15 minutes',
      };
    }

    // Generate secure random token (64 bytes = 128 hex chars)
    const token = randomBytes(64).toString('hex');

    // Set expiration (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Store token in database
    await this.prisma.authToken.create({
      data: {
        email,
        token,
        expiresAt,
        used: false,
      },
    });

    // Generate magic link URL (frontend URL)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const magicLink = `${frontendUrl}/auth/verify?token=${token}`;

    // Send email
    await this.emailService.sendMagicLink(email, magicLink, '15 minutes');

    return {
      message: `Magic link sent to ${email}`,
      expiresIn: '15 minutes',
    };
  }

  async verifyMagicLink(
    token: string,
    res: Response,
    req: Request,
  ): Promise<{
    user: {
      id: string;
      email: string;
      name: string;
      hasCompletedOnboarding: boolean;
    };
  }> {
    this.logger.log(`Verifying magic link token`);

    // Extract IP and user-agent from request
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Find the token in database
    const authToken = await this.prisma.authToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!authToken) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Mark token as used
    await this.prisma.authToken.update({
      where: { id: authToken.id },
      data: { used: true },
    });

    // Get or create user
    let user = await this.prisma.user.findUnique({
      where: { email: authToken.email },
      include: { profile: true },
    });

    if (!user) {
      // Get org for this email domain
      const domain = authToken.email.split('@')[1];
      const org = await this.prisma.org.findUnique({
        where: { domain },
      });

      if (!org) {
        throw new ForbiddenException('Email domain not allowed');
      }

      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: authToken.email,
          name: '', // Will be filled during onboarding
          orgId: org.id,
          status: 'active',
        },
        include: { profile: true },
      });
    }

    // Update last active
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // Create audit log entry with IP and user-agent
    await this.prisma.event.create({
      data: {
        userId: user.id,
        eventType: 'login',
        metadata: { method: 'magic_link' },
        ipAddress,
        userAgent,
      },
    });

    // Generate JWT tokens
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // Set httpOnly cookies instead of returning tokens
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    this.logger.log(`Successful login: ${user.email}`);

    // Return user data only (NO tokens in response body)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        hasCompletedOnboarding: !!user.profile,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
  }> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      // Verify user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status === 'deleted') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload = { sub: user.id, email: user.email };
      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, res: Response, req: Request): Promise<{ message: string }> {
    // Extract IP and user-agent from request
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Clear httpOnly cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // Log the event with IP and user-agent
    await this.prisma.event.create({
      data: {
        userId,
        eventType: 'logout',
        metadata: {},
        ipAddress,
        userAgent,
      },
    });

    return { message: 'Logged out successfully' };
  }
}
