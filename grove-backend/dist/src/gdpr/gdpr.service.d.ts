import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
export declare class GdprService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    exportUserData(userId: string, req: Request): Promise<any>;
    deleteUserData(userId: string, req: Request): Promise<{
        message: string;
    }>;
    recordConsent(userId: string, consentType: 'privacy_policy' | 'terms_of_service', version: string, req: Request): Promise<{
        success: boolean;
    }>;
}
