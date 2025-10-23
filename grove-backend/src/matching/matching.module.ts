import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { VectorMatchingEngine } from './engines/vector-matching.engine';
import { PrismaModule } from '../prisma/prisma.module';
import { IntrosModule } from '../intros/intros.module';
import { EmailModule } from '../email/email.module';

// Import strategies
import { VectorSimilarityStrategy } from './strategies/matching/vector-similarity.strategy';
import { CompositeFilterStrategy } from './strategies/filters/composite.filter';
import { PriorMatchesFilter } from './strategies/filters/prior-matches.filter';
import { BlockedUsersFilter } from './strategies/filters/blocked-users.filter';
import { SameOrgFilter } from './strategies/filters/same-org.filter';
import { DiversityRankingStrategy } from './strategies/ranking/diversity-ranking.strategy';

/**
 * Matching module providing match generation functionality.
 * Uses dependency injection to enable swappable matching engines and strategies.
 *
 * Phase 5: VectorMatchingEngine with real pgvector similarity, filters, and ranking
 *
 * Strategies:
 * - Matching: VectorSimilarityStrategy (pgvector cosine similarity)
 * - Filtering: CompositeFilterStrategy (prior matches, blocked users, same org)
 * - Ranking: DiversityRankingStrategy (promotes cross-org diversity)
 */
@Module({
  imports: [PrismaModule, IntrosModule, EmailModule],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    // Strategy implementations
    VectorSimilarityStrategy,
    PriorMatchesFilter,
    BlockedUsersFilter,
    SameOrgFilter,
    CompositeFilterStrategy,
    DiversityRankingStrategy,
    // Provide strategies with injection tokens
    {
      provide: 'MATCHING_STRATEGY',
      useClass: VectorSimilarityStrategy,
    },
    {
      provide: 'FILTER_STRATEGY',
      useClass: CompositeFilterStrategy,
    },
    {
      provide: 'RANKING_STRATEGY',
      useClass: DiversityRankingStrategy,
    },
    // Main matching engine
    {
      provide: 'MATCHING_ENGINE',
      useClass: VectorMatchingEngine,
    },
  ],
  exports: [MatchingService],
})
export class MatchingModule {}
