import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
export declare class OidcService {
    private prisma;
    private jwtService;
    private logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateOidcUser(profile: any, orgDomain: string, ipAddress?: string, userAgent?: string): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            nicheInterest: string;
            project: string;
            connectionType: string;
            rabbitHole: string | null;
            preferences: string | null;
        } | null;
    } & {
        id: string;
        name: string;
        status: string;
        ssoProvider: string | null;
        ssoMetadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        orgId: string;
        role: string;
        lastActive: Date | null;
        ssoSubject: string | null;
    }>;
    createOidcSession(user: any, res: Response): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            hasCompletedOnboarding: boolean;
        };
    }>;
}
