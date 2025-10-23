import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// Create AsyncLocalStorage for tenant context
export const tenantContext = new AsyncLocalStorage<{
  orgId: string;
  userId: string;
}>();

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');

    // Add middleware to automatically filter by orgId for tenant-scoped models
    (this as any).$use(async (params: any, next: any) => {
      const context = tenantContext.getStore();

      if (!context) {
        // No tenant context - allow query (for system operations)
        return next(params);
      }

      const { orgId } = context;
      const tenantModels = [
        'User',
        'Profile',
        'Match',
        'Embedding',
        'Feedback',
        'SafetyFlag',
      ];

      if (tenantModels.includes(params.model || '')) {
        // Automatically inject orgId filter for read operations
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.args.where = {
            ...params.args.where,
            org: { id: orgId },
          };
        }

        if (params.action === 'findMany') {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};

          // Add org filter
          params.args.where = {
            ...params.args.where,
            org: { id: orgId },
          };
        }

        // For write operations, verify orgId matches
        if (params.action === 'create' || params.action === 'update') {
          if (params.args.data && !params.args.data.orgId) {
            params.args.data.orgId = orgId;
          }
        }
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }

  // Helper to execute queries with tenant context
  async withOrgContext<T>(
    orgId: string,
    userId: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    return tenantContext.run({ orgId, userId }, fn);
  }
}
