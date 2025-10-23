import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class SamlService {
  private logger = new Logger(SamlService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateSamlUser(profile: any, orgDomain: string, ipAddress?: string, userAgent?: string) {
    this.logger.log(`SAML assertion received for: ${profile.email}`);

    // Extract user attributes from SAML assertion
    const email = profile.email || profile.nameID;
    const name = profile.displayName || profile.name || email.split('@')[0];
    const ssoSubject = profile.nameID;

    if (!email) {
      throw new UnauthorizedException('Email not provided in SAML assertion');
    }

    // Find or create organization based on email domain
    const emailDomain = email.split('@')[1];
    let org = await this.prisma.org.findUnique({
      where: { domain: emailDomain },
    });

    if (!org) {
      // Create org on first SSO login (JIT provisioning)
      org = await this.prisma.org.create({
        data: {
          name: emailDomain,
          domain: emailDomain,
          ssoEnabled: true,
          ssoProvider: 'saml',
        },
      });
      this.logger.log(`Created new org via SAML JIT: ${emailDomain}`);
    }

    // Find or create user (JIT user provisioning)
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      // Create user on first SAML login
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          orgId: org.id,
          ssoProvider: 'saml',
          ssoSubject,
          ssoMetadata: profile,
        },
        include: { profile: true },
      });
      this.logger.log(`Created new user via SAML JIT: ${email}`);

      // Log event with IP/UA
      await this.prisma.event.create({
        data: {
          userId: user.id,
          eventType: 'user_created_saml',
          metadata: { email, ssoProvider: 'saml' },
          ipAddress: ipAddress || 'sso-system',
          userAgent: userAgent || 'saml-idp',
        },
      });
    } else {
      // Update user's SSO metadata
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ssoProvider: 'saml',
          ssoSubject,
          ssoMetadata: profile,
          lastActive: new Date(),
        },
        include: { profile: true },
      });
    }

    // Check user status
    if (user.status === 'deleted') {
      throw new UnauthorizedException('User account is deleted');
    }

    // Log login event with IP/UA
    await this.prisma.event.create({
      data: {
        userId: user.id,
        eventType: 'login',
        metadata: { method: 'saml', ssoProvider: 'saml' },
        ipAddress: ipAddress || 'sso-system',
        userAgent: userAgent || 'saml-idp',
      },
    });

    return user;
  }

  async createSamlSession(user: any, res: Response) {
    // Generate JWT tokens
    const payload = { sub: user.id, email: user.email, role: user.role, orgId: user.orgId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasCompletedOnboarding: !!user.profile,
      },
    };
  }
}
