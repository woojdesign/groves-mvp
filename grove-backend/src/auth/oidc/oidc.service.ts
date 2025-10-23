import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class OidcService {
  private logger = new Logger(OidcService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateOidcUser(profile: any, orgDomain: string) {
    this.logger.log(`OIDC authentication for: ${profile.email}`);

    const email = profile.email || profile.emails?.[0]?.value;
    const name = profile.displayName || profile.name || email.split('@')[0];
    const ssoSubject = profile.id || profile.sub;

    if (!email) {
      throw new UnauthorizedException('Email not provided in OIDC claims');
    }

    // Find or create organization
    const emailDomain = email.split('@')[1];
    let org = await this.prisma.org.findUnique({
      where: { domain: emailDomain },
    });

    if (!org) {
      org = await this.prisma.org.create({
        data: {
          name: emailDomain,
          domain: emailDomain,
          ssoEnabled: true,
          ssoProvider: 'oidc',
        },
      });
      this.logger.log(`Created new org via OIDC JIT: ${emailDomain}`);
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          orgId: org.id,
          ssoProvider: 'oidc',
          ssoSubject,
          ssoMetadata: profile,
        },
        include: { profile: true },
      });
      this.logger.log(`Created new user via OIDC JIT: ${email}`);

      await this.prisma.event.create({
        data: {
          userId: user.id,
          eventType: 'user_created_oidc',
          metadata: { email, ssoProvider: 'oidc' },
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ssoProvider: 'oidc',
          ssoSubject,
          ssoMetadata: profile,
          lastActive: new Date(),
        },
        include: { profile: true },
      });
    }

    if (user.status === 'deleted') {
      throw new UnauthorizedException('User account is deleted');
    }

    await this.prisma.event.create({
      data: {
        userId: user.id,
        eventType: 'login',
        metadata: { method: 'oidc', ssoProvider: 'oidc' },
      },
    });

    return user;
  }

  async createOidcSession(user: any, res: Response) {
    const payload = { sub: user.id, email: user.email, role: user.role, orgId: user.orgId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

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
