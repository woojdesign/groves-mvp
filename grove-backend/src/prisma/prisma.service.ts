import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Inject(EncryptionService) private encryptionService: EncryptionService) {
    super();
  }

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

    // Field-level encryption middleware
    this.setupEncryptionMiddleware();
  }

  /**
   * Setup Prisma middleware for transparent field-level encryption/decryption
   * Encrypts PII fields on write operations (create, update)
   * Decrypts PII fields on read operations (findUnique, findMany, etc.)
   */
  private setupEncryptionMiddleware() {
    const encryptedFields = {
      User: ['email', 'name'],
      Profile: ['nicheInterest', 'project', 'rabbitHole'],
    };

    // Middleware for WRITE operations (encrypt before storing)
    (this as any).$use(async (params: any, next: any) => {
      const { model, action, args } = params;

      // Only process models with encrypted fields
      if (!model || !encryptedFields[model]) {
        return next(params);
      }

      // Encrypt fields on create and update operations
      if (action === 'create' || action === 'update' || action === 'upsert') {
        const fields = encryptedFields[model];

        // Handle different data structures
        const dataToEncrypt = action === 'upsert'
          ? [args.create, args.update]
          : [args.data];

        for (const data of dataToEncrypt) {
          if (data) {
            for (const field of fields) {
              if (data[field] !== undefined && data[field] !== null) {
                data[field] = this.encryptionService.encrypt(data[field]);
              }
            }
          }
        }
      }

      return next(params);
    });

    // Middleware for READ operations (decrypt after retrieving)
    (this as any).$use(async (params: any, next: any) => {
      const result = await next(params);
      const { model } = params;

      // Only process models with encrypted fields
      if (!model || !encryptedFields[model]) {
        return result;
      }

      const fields = encryptedFields[model];

      // Decrypt fields in the result
      if (result) {
        if (Array.isArray(result)) {
          // Handle array results (findMany)
          for (const item of result) {
            this.decryptFields(item, fields);
          }
        } else if (typeof result === 'object') {
          // Handle single object results (findUnique, findFirst, create, update)
          this.decryptFields(result, fields);
        }
      }

      return result;
    });

    if (this.encryptionService.isEnabled()) {
      this.logger.log('Field-level encryption middleware active for User and Profile models');
    }
  }

  /**
   * Decrypt specified fields in an object
   */
  private decryptFields(obj: any, fields: string[]) {
    if (!obj) return;

    for (const field of fields) {
      if (obj[field] !== undefined && obj[field] !== null) {
        obj[field] = this.encryptionService.decrypt(obj[field]);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }
}
