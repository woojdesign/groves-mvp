import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';
export declare const tenantContext: AsyncLocalStorage<{
    orgId: string;
    userId: string;
}>;
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    withOrgContext<T>(orgId: string, userId: string, fn: () => Promise<T>): Promise<T>;
}
