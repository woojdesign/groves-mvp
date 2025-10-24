import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { IEmailService } from '../email/email.service.interface';
export declare class AuthService {
    private prisma;
    private jwtService;
    private emailService;
    private configService;
    private logger;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: IEmailService, configService: ConfigService);
    requestMagicLink(email: string): Promise<{
        message: string;
        expiresIn: string;
    }>;
    verifyMagicLink(token: string, res: Response, req: Request): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            hasCompletedOnboarding: boolean;
        };
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(userId: string, res: Response, req: Request): Promise<{
        message: string;
    }>;
}
