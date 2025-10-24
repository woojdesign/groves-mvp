import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit() {
    // Add query logging in development using Client Extensions
    if (process.env.NODE_ENV === 'development') {
      const withLogging = (this as any).$extends({
        query: {
          $allOperations({ operation, model, args, query }: any) {
            const start = performance.now();
            return query(args).then((result: any) => {
              const time = performance.now() - start;
              if (time > 10) { // Only log slow queries
                console.log(
                  `[Prisma] Query ${model}.${operation} took ${time.toFixed(2)}ms`
                );
              }
              return result;
            });
          },
        },
      });

      Object.assign(this, withLogging);
      this.logger.log('Query logging enabled for development');
    }

    await this.$connect();
    console.log('✅ Database connected');

    // Note: Field encryption via prisma-field-encryption removed due to compatibility issues
    // Encryption is handled by EncryptionService directly in the service layer
    this.logger.log('Using service-layer encryption (EncryptionService)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }
}
