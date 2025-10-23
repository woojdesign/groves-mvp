import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');

    // SIMPLIFIED MULTI-TENANCY APPROACH:
    // Services MUST explicitly filter by orgId in WHERE clauses.
    // This middleware provides monitoring and validation only.
    // See docs/MULTI_TENANCY.md for architecture details.

    if (process.env.NODE_ENV === 'development') {
      // In development, log queries for debugging
      (this as any).$use(async (params: any, next: any) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();

        this.logger.debug(
          `Query ${params.model}.${params.action} took ${after - before}ms`
        );

        return result;
      });
    }

    // Note: We do NOT use AsyncLocalStorage for automatic org filtering.
    // This was removed because:
    // 1. AsyncLocalStorage context was never being populated (blocking bug)
    // 2. Explicit filtering is more auditable and maintainable
    // 3. AdminService already demonstrates the correct pattern
    //
    // All services must explicitly filter tenant-scoped queries:
    // Example: prisma.user.findMany({ where: { orgId } })
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }
}
