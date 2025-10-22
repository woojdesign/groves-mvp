import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private emailService;
    private configService;
    private logger;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService, configService: ConfigService);
    requestMagicLink(email: string): Promise<{
        message: string;
        expiresIn: string;
    }>;
    verifyMagicLink(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
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
    logout(userId: string): Promise<{
        message: string;
    }>;
}
