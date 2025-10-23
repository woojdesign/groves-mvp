import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

/**
 * EncryptionModule provides field-level encryption services globally.
 * Marked as @Global to make EncryptionService available throughout the app
 * without needing to import the module in every feature module.
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
