import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MockMatchingEngine } from './engines/mock-matching.engine';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Matching module providing match generation functionality.
 * Uses dependency injection to enable swappable matching engines.
 *
 * Current: MockMatchingEngine (for development and testing)
 * Phase 5: Will swap to VectorMatchingEngine with real algorithms
 */
@Module({
  imports: [PrismaModule],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    {
      provide: 'MATCHING_ENGINE',
      useClass: MockMatchingEngine,
    },
  ],
  exports: [MatchingService],
})
export class MatchingModule {}
