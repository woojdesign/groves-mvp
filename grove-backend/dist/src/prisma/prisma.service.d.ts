import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../encryption/encryption.service';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private encryptionService;
    private readonly logger;
    constructor(encryptionService: EncryptionService);
    onModuleInit(): Promise<void>;
    private setupEncryptionMiddleware;
    private decryptFields;
    onModuleDestroy(): Promise<void>;
}
