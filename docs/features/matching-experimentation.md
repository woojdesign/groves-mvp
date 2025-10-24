# Grove Matching Algorithm Experimentation Strategy
**Comprehensive Implementation Plan for Testing, Tuning, and Evolving Grove's Matching System**

---

## Executive Summary

This document provides a complete, actionable strategy for implementing matching algorithm experimentation at Grove, based on extensive research into how top tech companies (Uber, Meta, Google, Hinge, Tinder) test and tune their recommendation systems, adapted for a startup MVP context.

**Key Findings**:
- Grove's current architecture (Strategy pattern + DI) is **production-ready** and mirrors industry best practices
- MVP-stage experimentation requires **hybrid qualitative + quantitative** approaches, not just rigorous A/B testing
- **Lightweight, open-source tools** can provide 80% of enterprise functionality at 0% of the cost
- **Incremental adoption** is key: Start simple, add complexity as you scale

**Recommended Timeline**: 2-week MVP implementation → 3-month growth phase → 6-month scale phase

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Industry Best Practices (Synthesis)](#2-industry-best-practices-synthesis)
3. [Grove-Specific Strategy](#3-grove-specific-strategy)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Technical Architecture](#5-technical-architecture)
6. [Metrics & Observability](#6-metrics--observability)
7. [Experimentation Workflow](#7-experimentation-workflow)
8. [Migration Paths](#8-migration-paths)
9. [Cost Analysis](#9-cost-analysis)
10. [Success Criteria](#10-success-criteria)

---

## 1. Current State Assessment

### What You've Built (Phase 1-6 Complete)

**Architecture Strengths** ✅:
- **Modular Design**: Strategy pattern with clean interfaces (`IMatchingEngine`, `IMatchingStrategy`, `IFilterStrategy`, `IRankingStrategy`)
- **Dependency Injection**: NestJS providers with injection tokens enable algorithm swapping
- **Template Method Pattern**: `BaseMatchingEngine` orchestrates pipeline, delegating to strategies
- **Vector-Based Matching**: pgvector cosine similarity with real semantic embeddings
- **Multi-Stage Funnel**: Retrieval → Filtering → Scoring → Ranking → Explainability
- **Privacy-Preserving**: Double opt-in flow with mirrored notifications

**Current Algorithm Pipeline**:
```
1. getCandidatePool()       → Top 100 active users with embeddings
2. filterStrategy.filter()  → Remove prior matches, blocked users, same org
3. matchingStrategy.score() → pgvector cosine similarity (1536-dim vectors)
4. Filter by threshold      → Default: 0.7 minimum similarity
5. rankingStrategy.rerank() → Diversity ranking (70% similarity, 30% diversity)
6. generateReasons()        → Extract shared topics (explainability)
```

**Key Files**:
- `/workspace/grove-backend/src/matching/matching.module.ts` - DI configuration
- `/workspace/grove-backend/src/matching/engines/vector-matching.engine.ts` - Main engine
- `/workspace/grove-backend/src/matching/strategies/` - Pluggable strategies

### What's Missing (Gaps to Address)

**Experimentation Infrastructure** 🔴:
- No feature flags for algorithm control
- No A/B testing framework
- No experiment tracking (exposures, conversions)
- No statistical analysis tooling

**Metrics & Observability** 🟡:
- Limited performance tracking (no query logs)
- No real-time dashboards
- No alerting on degradation
- No acceptance rate tracking

**Testing & Validation** 🟡:
- Unit tests exist, but no regression testing
- No offline evaluation metrics
- No synthetic test data for benchmarking
- No ground truth pairs for validation

**Algorithm Versioning** 🔴:
- No systematic way to compare algorithm variants
- No rollout strategy (canary, gradual percentage)
- No rollback mechanism

---

## 2. Industry Best Practices (Synthesis)

### How Top Companies Approach Matching Algorithm Experimentation

#### **Meta (FBLearner Flow)**
- **Modular components** connected through well-defined interfaces ✅ *Grove already does this*
- **Feature Store** for shared features (Tecton, Feast)
- **Thousands of experiments** running simultaneously
- **Offline → Shadow → A/B testing** progression

**Key Insight**: Your architecture already mirrors Meta's approach. Focus on experimentation infrastructure.

#### **Airbnb (Search Ranking)**
- **Interleaving** for 50x faster iteration than traditional A/B tests
- **Team draft algorithm** for fair comparison
- **Days to validate** vs weeks with A/B testing
- Shadow mode before production deployment

**Key Insight**: At MVP scale, interleaving may be overkill, but shadow mode is essential.

#### **Uber (XP Platform)**
- **Canary deployments**: 1% → 5% → 25% → 50% → 100%
- **1,000+ experiments** running concurrently
- **Automated validation**: Sample size balance, flicker detection
- **Local evaluation** (100x faster than remote)

**Key Insight**: Gradual rollouts with automated monitoring prevent catastrophic failures.

#### **Netflix (Experimentation)**
- **Interleaving in Stage 1** (fast iteration)
- **A/B testing in Stage 2** (business metrics validation)
- **Weak correlation** between offline and online metrics → always test in production

**Key Insight**: Offline metrics guide direction, but online validation is mandatory.

#### **LinkedIn (GLMix Ranking)**
- **Multi-stage funnel**: L0 (candidate retrieval) → L1 (ranking) → Filtering
- **Multiple candidate sources** (graph-based, similarity-based, heuristic)
- **Diversity constraints** applied post-ranking

**Key Insight**: Your multi-stage architecture is correct. Add diversity as tunable parameter.

### Universal Patterns Across All Companies

| Pattern | Description | Grove Status |
|---------|-------------|--------------|
| **Strategy Pattern** | Swappable algorithms via interfaces | ✅ Implemented |
| **Feature Flags** | Runtime algorithm selection | ❌ Missing |
| **Three-Tier Testing** | Offline → Shadow → A/B | 🟡 Partial (no shadow/A/B) |
| **Canary Deployments** | Gradual rollout with monitoring | ❌ Missing |
| **Metrics Tracking** | Real-time performance dashboards | 🟡 Partial (no dashboards) |
| **Interleaving** | Fast algorithm comparison | ❌ Not needed at MVP scale |
| **Regression Testing** | Ensure quality doesn't degrade | ❌ Missing |

---

## 3. Grove-Specific Strategy

### Guiding Principles for Grove

1. **Leverage What You Have**: PostgreSQL, NestJS, existing architecture
2. **Start Simple, Scale Later**: Avoid premature infrastructure complexity
3. **Qualitative + Quantitative**: With <1K users, interviews > statistical tests
4. **Open Source First**: Minimize costs, maximize flexibility
5. **Incremental Adoption**: 2-week MVP → 3-month growth → 6-month scale

### Core Philosophy: "Good Enough to Ship Fast"

**Traditional Startup Mistake**:
```
Build complex A/B testing platform → 6 months later → Still no experiments run
```

**Grove Approach**:
```
Week 1: Add feature flags (2 days)
Week 2: Run first experiment with 50 users + 5 interviews
Week 3: Ship winning variant
Repeat weekly
```

### Recommended Tech Stack Evolution

#### **Phase 1: MVP (Now - Month 3)**

**Goal**: Run experiments with minimal infrastructure

**Stack**:
- **Feature Flags**: OpenFeature + InMemoryProvider
- **A/B Testing**: Custom TypeScript service with `simple-statistics`
- **Metrics**: PostgreSQL + Metabase (SQL dashboards)
- **Qualitative**: User interviews + Typeform surveys
- **pgvector Index**: IVFFlat (lists=25 for ~500 users)

**Why This Stack**:
- **$0/month cost**
- **2-week setup time** (1 engineer)
- **Zero operational overhead** (no new services)
- **TypeScript-native** (familiar to team)

**What You Can Do**:
- ✅ Test algorithm variants (e.g., diversity weight 0.3 vs 0.5)
- ✅ Gradual rollouts (via feature flag percentages)
- ✅ Track acceptance rates, conversion metrics
- ✅ Run user interviews for qualitative validation
- ✅ SQL-based analytics (Metabase dashboards)

**Limitations**:
- ❌ Requires deployment to change flags
- ❌ No real-time dashboards (Metabase is batch)
- ❌ Manual statistical analysis
- ❌ No web UI for non-engineers

**When to Upgrade**: When non-engineers need to control experiments (Month 3-4)

---

#### **Phase 2: Growth (Month 3-6)**

**Goal**: Enable non-technical team members, add real-time monitoring

**Stack Additions**:
- **Feature Flags**: Migrate to Unleash (self-hosted) via OpenFeature
- **A/B Testing**: GrowthBook (self-hosted) with warehouse integration
- **Metrics**: Add Prometheus + Grafana for real-time dashboards
- **pgvector Index**: Migrate IVFFlat → HNSW at 5K users

**Why Upgrade**:
- **Web UI** for product managers to control experiments
- **Real-time dashboards** (not just batch SQL)
- **Built-in statistical analysis** (GrowthBook)
- **User targeting** (e.g., test on power users first)

**Migration Effort**: 1 week (OpenFeature makes this seamless - just swap provider)

**Cost**: $20-50/month (self-hosted infrastructure)

**What You Gain**:
- ✅ Non-engineers can launch experiments
- ✅ Granular targeting (by user segment, org, etc.)
- ✅ Real-time metric monitoring
- ✅ Automated statistical significance detection
- ✅ Experiment history and audit logs

---

#### **Phase 3: Scale (Month 6-12)**

**Goal**: Handle 10K+ users, advanced experimentation

**Stack Additions**:
- **All-in-One**: Consider PostHog (analytics + flags + A/B testing)
- **OR** Upgrade Unleash to Cloud ($80/month for managed service)
- **Feature Store**: Add Feast for centralized feature management
- **ML Platform**: MLflow for model versioning and registry

**Why Upgrade**:
- **Scale**: 10K+ users, 100+ experiments
- **Automation**: Reduce manual work
- **Advanced Features**: Multi-armed bandits, personalization

**Cost**: $200-500/month

---

### Experimentation Maturity Model

| Stage | Users | Tools | Testing Approach | Timeline |
|-------|-------|-------|------------------|----------|
| **MVP** | <1K | Feature flags, SQL, interviews | Qual > Quant, directional signals | Now - Month 3 |
| **Growth** | 1-5K | Unleash, GrowthBook, Grafana | Hybrid qual+quant, relaxed p-values | Month 3-6 |
| **Scale** | 5-20K | PostHog/LaunchDarkly, MLflow | Rigorous A/B tests, p<0.05 | Month 6-12 |
| **Mature** | 20K+ | Full ML platform, data warehouse | Multi-armed bandits, personalization | Year 2+ |

**Grove is currently at Stage 1 (MVP)**. This document focuses on implementing Stage 1 and preparing for Stage 2.

---

## 4. Implementation Roadmap

### **Sprint 1: Foundation (Week 1-2)**

**Goal**: Enable basic algorithm experimentation with feature flags

#### **Day 1-2: Feature Flags Setup**

**Tasks**:
1. Install OpenFeature SDK
2. Create `FeatureFlagsModule` with InMemoryProvider
3. Define initial flags for matching parameters
4. Wire into existing `MatchingModule` via dependency injection

**Implementation**:

```typescript
// src/feature-flags/feature-flags.module.ts
import { Module, Global } from '@nestjs/common';
import { OpenFeatureModule } from '@openfeature/nestjs-sdk';
import { InMemoryProvider } from '@openfeature/server-sdk';

@Global()
@Module({
  imports: [
    OpenFeatureModule.forRoot({
      provider: new InMemoryProvider({
        // Matching algorithm selection
        'matching-strategy': {
          value: 'vector-similarity',
          metadata: { description: 'Which matching strategy to use' }
        },

        // Tunable parameters
        'similarity-threshold': {
          value: 0.7,
          metadata: { description: 'Minimum similarity score for matches' }
        },
        'diversity-weight': {
          value: 0.3,
          metadata: { description: 'Weight for diversity in ranking (0-1)' }
        },
        'candidate-pool-size': {
          value: 100,
          metadata: { description: 'Max candidates to consider' }
        },

        // Feature toggles
        'enable-diversity-ranking': {
          value: true,
          metadata: { description: 'Use diversity ranking strategy' }
        },
        'enable-same-org-filter': {
          value: true,
          metadata: { description: 'Filter out users from same organization' }
        }
      })
    })
  ],
  exports: [OpenFeatureModule]
})
export class FeatureFlagsModule {}
```

**Update App Module**:
```typescript
// src/app.module.ts
@Module({
  imports: [
    // ... existing imports
    FeatureFlagsModule, // Add this
  ],
})
export class AppModule {}
```

**Update Matching Module**:
```typescript
// src/matching/matching.module.ts
import { OpenFeatureService } from '@openfeature/nestjs-sdk';

@Module({
  imports: [
    PrismaModule,
    IntrosModule,
    EmailModule,
    FeatureFlagsModule // Add this
  ],
  providers: [
    MatchingService,

    // Strategy implementations
    VectorSimilarityStrategy,
    CompositeFilterStrategy,
    DiversityRankingStrategy,
    PriorMatchesFilter,
    BlockedUsersFilter,
    SameOrgFilter,

    // Dynamic provider using feature flags
    {
      provide: 'MATCHING_STRATEGY',
      useFactory: async (openFeature: OpenFeatureService) => {
        const client = openFeature.getClient();
        const strategyName = await client.getStringValue('matching-strategy', 'vector-similarity');

        // For MVP, just return VectorSimilarityStrategy
        // Later: Add switch statement for multiple strategies
        return new VectorSimilarityStrategy(prisma);
      },
      inject: [OpenFeatureService, PrismaService]
    },

    {
      provide: 'RANKING_STRATEGY',
      useFactory: async (openFeature: OpenFeatureService) => {
        const client = openFeature.getClient();
        const useDiversity = await client.getBooleanValue('enable-diversity-ranking', true);

        return useDiversity
          ? new DiversityRankingStrategy(prisma)
          : null; // Simple scoring without re-ranking
      },
      inject: [OpenFeatureService, PrismaService]
    },

    {
      provide: 'MATCHING_ENGINE',
      useClass: VectorMatchingEngine
    }
  ],
  exports: [MatchingService]
})
export class MatchingModule {}
```

**Deliverables**:
- ✅ Feature flags controlling matching algorithm parameters
- ✅ Ability to change algorithm behavior via environment config
- ✅ Zero production impact (flags default to current values)

**Testing**:
```bash
# Test that flags work
npm run test:e2e matching
```

**Estimated Effort**: 4-6 hours

---

#### **Day 3-4: Experiment Tracking**

**Tasks**:
1. Add Prisma schema for experiments
2. Create `ExperimentationService` for tracking exposures/conversions
3. Instrument `MatchingService` to log experiment events

**Database Schema**:

```prisma
// prisma/schema.prisma (add these models)

model ExperimentExposure {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @db.Uuid
  experimentName String
  variant        String
  timestamp      DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([experimentName, variant])
  @@index([userId, experimentName])
  @@map("experiment_exposures")
}

model ExperimentConversion {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @db.Uuid
  experimentName String
  metricName     String   // e.g., "intro_accepted", "message_sent"
  value          Float?   // Optional metric value
  timestamp      DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([experimentName, metricName])
  @@index([userId, experimentName])
  @@map("experiment_conversions")
}

model QueryLog {
  id             String   @id @default(uuid()) @db.Uuid
  operation      String   // e.g., "vector_similarity_search"
  durationMs     Int
  candidateCount Int?
  resultsCount   Int?
  timestamp      DateTime @default(now())

  @@index([operation, timestamp])
  @@map("query_logs")
}
```

**Run Migration**:
```bash
npx prisma migrate dev --name add_experimentation_tables
```

**Create Experimentation Service**:

```typescript
// src/experimentation/experimentation.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExperimentationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Assign user to experiment variant using consistent hashing
   */
  assignVariant(userId: string, experimentName: string, variants: string[]): string {
    const hash = this.hashString(`${userId}-${experimentName}`);
    const index = hash % variants.length;
    return variants[index];
  }

  /**
   * Track that user was exposed to an experiment variant
   */
  async trackExposure(userId: string, experimentName: string, variant: string): Promise<void> {
    await this.prisma.experimentExposure.create({
      data: {
        userId,
        experimentName,
        variant,
        timestamp: new Date()
      }
    });
  }

  /**
   * Track that user converted on a metric (e.g., accepted intro)
   */
  async trackConversion(
    userId: string,
    experimentName: string,
    metricName: string,
    value?: number
  ): Promise<void> {
    await this.prisma.experimentConversion.create({
      data: {
        userId,
        experimentName,
        metricName,
        value,
        timestamp: new Date()
      }
    });
  }

  /**
   * Get experiment results (basic version - we'll enhance in Day 5-7)
   */
  async getExperimentStats(experimentName: string) {
    const exposures = await this.prisma.experimentExposure.groupBy({
      by: ['variant'],
      where: { experimentName },
      _count: { userId: true }
    });

    const conversions = await this.prisma.experimentConversion.groupBy({
      by: ['variant'],
      where: { experimentName },
      _count: { userId: true }
    });

    // Simple aggregation - we'll add statistical analysis later
    return exposures.map(exposure => ({
      variant: exposure.variant,
      exposures: exposure._count.userId,
      conversions: conversions.find(c => c.variant === exposure.variant)?._count.userId || 0
    }));
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```

**Create Module**:
```typescript
// src/experimentation/experimentation.module.ts
import { Module, Global } from '@nestjs/common';
import { ExperimentationService } from './experimentation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [ExperimentationService],
  exports: [ExperimentationService]
})
export class ExperimentationModule {}
```

**Instrument Matching Service**:

```typescript
// src/matching/matching.service.ts (add experiment tracking)
import { ExperimentationService } from '../experimentation/experimentation.service';

@Injectable()
export class MatchingService {
  constructor(
    @Inject('MATCHING_ENGINE') private readonly matchingEngine: IMatchingEngine,
    private readonly prisma: PrismaService,
    private readonly introsService: IntrosService,
    private readonly emailService: EmailService,
    private readonly experimentation: ExperimentationService, // Add this
  ) {}

  async getMatchesForUser(
    userId: string,
    options: GenerateMatchesRequestDto = {},
  ): Promise<MatchCandidateDto[]> {
    // Track experiment exposure (example: diversity weight experiment)
    const experimentName = 'diversity-weight-experiment-v1';
    const variant = this.experimentation.assignVariant(userId, experimentName, ['control', 'treatment']);

    await this.experimentation.trackExposure(userId, experimentName, variant);

    // Use variant to modify behavior
    const diversityWeight = variant === 'treatment' ? 0.5 : 0.3;

    // ... existing matching logic with diversityWeight ...

    const result = await this.matchingEngine.generateMatches({
      userId,
      limit: options.limit,
      minSimilarityScore: options.minSimilarityScore,
      diversityWeight, // Use experiment variant
    });

    // ... rest of existing code ...
  }

  async acceptMatch(matchId: string, userId: string): Promise<AcceptMatchResponseDto> {
    const result = await // ... existing logic ...

    // Track conversion when user accepts
    await this.experimentation.trackConversion(
      userId,
      'diversity-weight-experiment-v1',
      'intro_accepted'
    );

    return result;
  }
}
```

**Deliverables**:
- ✅ Database schema for tracking experiments
- ✅ `ExperimentationService` for assigning variants and tracking events
- ✅ Instrumented `MatchingService` to log exposures and conversions
- ✅ Consistent user assignment (same user always sees same variant)

**Testing**:
```typescript
// src/experimentation/experimentation.service.spec.ts
describe('ExperimentationService', () => {
  it('should assign same variant consistently for same user', () => {
    const variant1 = service.assignVariant('user-123', 'test-exp', ['A', 'B']);
    const variant2 = service.assignVariant('user-123', 'test-exp', ['A', 'B']);
    expect(variant1).toBe(variant2);
  });

  it('should distribute variants evenly', () => {
    const variants = Array.from({ length: 1000 }, (_, i) =>
      service.assignVariant(`user-${i}`, 'test-exp', ['A', 'B'])
    );
    const aCount = variants.filter(v => v === 'A').length;
    expect(aCount).toBeGreaterThan(450);
    expect(aCount).toBeLessThan(550); // Should be ~50%
  });
});
```

**Estimated Effort**: 6-8 hours

---

#### **Day 5-7: Statistical Analysis & Metrics**

**Tasks**:
1. Install `simple-statistics` library
2. Add statistical analysis to `ExperimentationService`
3. Create SQL queries for Metabase dashboards
4. Add performance logging to vector strategy

**Install Dependencies**:
```bash
npm install simple-statistics @types/simple-statistics
```

**Enhance Experimentation Service**:

```typescript
// src/experimentation/experimentation.service.ts (add analysis methods)
import * as ss from 'simple-statistics';

export interface ExperimentAnalysis {
  experimentName: string;
  control: VariantMetrics;
  treatment: VariantMetrics;
  lift: number;
  zScore: number;
  pValue: number;
  isSignificant: boolean;
  sampleSizeRecommendation: number;
}

export interface VariantMetrics {
  name: string;
  conversionRate: number;
  conversions: number;
  exposures: number;
  confidenceInterval: [number, number];
}

@Injectable()
export class ExperimentationService {
  // ... existing methods ...

  /**
   * Analyze experiment results with statistical rigor
   */
  async analyzeExperiment(experimentName: string): Promise<ExperimentAnalysis> {
    const variants = await this.getVariantData(experimentName);

    if (variants.length !== 2) {
      throw new Error('Analysis requires exactly 2 variants (control and treatment)');
    }

    const [control, treatment] = variants;

    // Calculate conversion rates
    const controlRate = control.conversions / control.exposures;
    const treatmentRate = treatment.conversions / treatment.exposures;
    const lift = ((treatmentRate - controlRate) / controlRate) * 100;

    // Two-proportion z-test
    const zScore = this.calculateZScore(control, treatment);
    const pValue = this.calculatePValue(zScore);
    const isSignificant = pValue < 0.05;

    // Confidence intervals
    const controlCI = this.calculateConfidenceInterval(controlRate, control.exposures);
    const treatmentCI = this.calculateConfidenceInterval(treatmentRate, treatment.exposures);

    return {
      experimentName,
      control: {
        name: control.name,
        conversionRate: controlRate,
        conversions: control.conversions,
        exposures: control.exposures,
        confidenceInterval: controlCI
      },
      treatment: {
        name: treatment.name,
        conversionRate: treatmentRate,
        conversions: treatment.conversions,
        exposures: treatment.exposures,
        confidenceInterval: treatmentCI
      },
      lift,
      zScore,
      pValue,
      isSignificant,
      sampleSizeRecommendation: this.calculateRequiredSampleSize(controlRate)
    };
  }

  private calculateZScore(control: { conversions: number; exposures: number }, treatment: { conversions: number; exposures: number }): number {
    const p1 = control.conversions / control.exposures;
    const p2 = treatment.conversions / treatment.exposures;
    const n1 = control.exposures;
    const n2 = treatment.exposures;

    // Pooled proportion
    const pPool = (control.conversions + treatment.conversions) / (n1 + n2);

    // Standard error
    const se = Math.sqrt(pPool * (1 - pPool) * (1/n1 + 1/n2));

    return (p2 - p1) / se;
  }

  private calculatePValue(zScore: number): number {
    const cdf = ss.cumulativeStdNormalProbability(Math.abs(zScore));
    return 2 * (1 - cdf); // Two-tailed
  }

  private calculateConfidenceInterval(proportion: number, sampleSize: number): [number, number] {
    const z = 1.96; // 95% confidence
    const se = Math.sqrt((proportion * (1 - proportion)) / sampleSize);
    return [
      Math.max(0, proportion - z * se),
      Math.min(1, proportion + z * se)
    ];
  }

  private calculateRequiredSampleSize(
    baselineRate: number,
    mde: number = 0.05,
    alpha: number = 0.05,
    power: number = 0.8
  ): number {
    const p1 = baselineRate;
    const p2 = baselineRate * (1 + mde);

    const z_alpha = 1.96;
    const z_beta = 0.84;

    const numerator = Math.pow(z_alpha + z_beta, 2) * (p1 * (1-p1) + p2 * (1-p2));
    const denominator = Math.pow(p2 - p1, 2);

    return Math.ceil(numerator / denominator);
  }

  private async getVariantData(experimentName: string): Promise<Array<{ name: string; conversions: number; exposures: number }>> {
    const result = await this.prisma.$queryRaw<Array<{ variant: string; exposures: bigint; conversions: bigint }>>`
      SELECT
        e.variant,
        COUNT(DISTINCT e.user_id) as exposures,
        COUNT(DISTINCT c.user_id) as conversions
      FROM experiment_exposures e
      LEFT JOIN experiment_conversions c
        ON e.user_id = c.user_id
        AND e.experiment_name = c.experiment_name
        AND e.variant = c.variant
      WHERE e.experiment_name = ${experimentName}
      GROUP BY e.variant
      ORDER BY e.variant
    `;

    return result.map(r => ({
      name: r.variant,
      exposures: Number(r.exposures),
      conversions: Number(r.conversions)
    }));
  }
}
```

**Create Admin Controller** for viewing results:

```typescript
// src/experimentation/experimentation.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExperimentationService } from './experimentation.service';

@Controller('admin/experiments')
@UseGuards(JwtAuthGuard)
export class ExperimentationController {
  constructor(private experimentation: ExperimentationService) {}

  @Get(':name/results')
  async getResults(@Param('name') name: string) {
    return this.experimentation.analyzeExperiment(name);
  }

  @Get(':name/stats')
  async getStats(@Param('name') name: string) {
    return this.experimentation.getExperimentStats(name);
  }
}
```

**Add Performance Logging**:

```typescript
// src/matching/strategies/matching/vector-similarity.strategy.ts (enhance)
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VectorSimilarityStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(VectorSimilarityStrategy.name);

  constructor(private readonly prisma: PrismaService) {}

  async computeSimilarity(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<Map<string, number>> {
    const startTime = performance.now();

    // ... existing vector similarity logic ...

    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);

    // Log performance
    this.logger.debug({
      operation: 'vector_similarity_search',
      candidateCount: candidateUserIds.length,
      resultsCount: scoreMap.size,
      durationMs
    });

    // Store in database for historical analysis
    await this.prisma.queryLog.create({
      data: {
        operation: 'vector_similarity_search',
        durationMs,
        candidateCount: candidateUserIds.length,
        resultsCount: scoreMap.size,
        timestamp: new Date()
      }
    }).catch(err => {
      // Don't fail matching if logging fails
      this.logger.error('Failed to log query performance', err);
    });

    return scoreMap;
  }
}
```

**Create Metabase Queries** (save these as SQL snippets):

```sql
-- Query 1: Acceptance Rate by Date (last 30 days)
SELECT
  DATE(created_at) as date,
  COUNT(*) as matches_generated,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as intros_accepted,
  ROUND(
    COUNT(CASE WHEN status = 'accepted' THEN 1 END)::numeric /
    COUNT(*) * 100,
    2
  ) as acceptance_rate_pct
FROM matches
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Query 2: Experiment Performance Comparison
SELECT
  ee.variant,
  COUNT(DISTINCT ee.user_id) as users_exposed,
  COUNT(DISTINCT ec.user_id) as users_converted,
  ROUND(
    COUNT(DISTINCT ec.user_id)::numeric /
    COUNT(DISTINCT ee.user_id) * 100,
    2
  ) as conversion_rate_pct
FROM experiment_exposures ee
LEFT JOIN experiment_conversions ec
  ON ee.user_id = ec.user_id
  AND ee.experiment_name = ec.experiment_name
WHERE ee.experiment_name = 'diversity-weight-experiment-v1'
GROUP BY ee.variant;

-- Query 3: pgvector Query Performance (last 7 days)
SELECT
  DATE(timestamp) as date,
  AVG(duration_ms) as avg_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  AVG(candidate_count) as avg_candidates,
  COUNT(*) as query_count
FROM query_logs
WHERE operation = 'vector_similarity_search'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Query 4: Vector Similarity Distribution
SELECT
  CASE
    WHEN similarity_score >= 0.9 THEN '0.90-1.00'
    WHEN similarity_score >= 0.8 THEN '0.80-0.89'
    WHEN similarity_score >= 0.7 THEN '0.70-0.79'
    WHEN similarity_score >= 0.6 THEN '0.60-0.69'
    ELSE '< 0.60'
  END as similarity_bucket,
  COUNT(*) as match_count,
  ROUND(
    AVG(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) * 100,
    2
  ) as acceptance_rate_pct
FROM matches
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY similarity_bucket
ORDER BY similarity_bucket DESC;
```

**Set up Metabase** (if not already running):

```yaml
# docker-compose.yml (add to existing services)
services:
  metabase:
    image: metabase/metabase:latest
    ports:
      - "3000:3000"
    environment:
      MB_DB_TYPE: postgres
      MB_DB_DBNAME: grove
      MB_DB_PORT: 5432
      MB_DB_USER: ${POSTGRES_USER}
      MB_DB_PASS: ${POSTGRES_PASSWORD}
      MB_DB_HOST: postgres
    volumes:
      - metabase_data:/metabase-data
    depends_on:
      - postgres

volumes:
  metabase_data:
```

**Start Metabase**:
```bash
docker-compose up -d metabase
# Access at http://localhost:3000
# Connect to your PostgreSQL database
# Create dashboards with the SQL queries above
```

**Deliverables**:
- ✅ Statistical analysis with p-values, confidence intervals, lift calculation
- ✅ Admin endpoint to view experiment results
- ✅ Performance logging for pgvector queries
- ✅ Metabase dashboards for acceptance rates and experiment tracking

**Testing**:
```bash
# Run experiment analysis
curl http://localhost:4000/admin/experiments/diversity-weight-experiment-v1/results

# Expected response:
{
  "experimentName": "diversity-weight-experiment-v1",
  "control": {
    "conversionRate": 0.23,
    "conversions": 23,
    "exposures": 100,
    "confidenceInterval": [0.15, 0.31]
  },
  "treatment": {
    "conversionRate": 0.31,
    "conversions": 31,
    "exposures": 100,
    "confidenceInterval": [0.22, 0.40]
  },
  "lift": 34.78,
  "pValue": 0.15,
  "isSignificant": false,
  "sampleSizeRecommendation": 384
}
```

**Estimated Effort**: 8-10 hours

---

### **Sprint 2: First Experiment (Week 3-4)**

**Goal**: Run a real experiment to test diversity weight impact on acceptance rates

#### **Week 3: Design & Deploy**

**Hypothesis**:
> "Increasing diversity weight from 0.3 to 0.5 will improve intro acceptance rates because users value serendipitous connections over pure similarity."

**Success Criteria**:
- **Primary Metric**: Intro acceptance rate (target: +10% relative lift)
- **Secondary Metrics**:
  - Mutual match rate (both users accept)
  - Time to accept (faster = better engagement)
  - User satisfaction (qualitative interviews)
- **Guardrail Metrics**:
  - Average similarity score (shouldn't drop below 0.7)
  - Match generation latency (p95 < 500ms)

**Experiment Design**:
- **Control**: `diversityWeight = 0.3` (current)
- **Treatment**: `diversityWeight = 0.5` (proposed)
- **Traffic Split**: 50/50
- **Duration**: 2 weeks
- **Sample Size**: Target 100 users per variant (200 total)

**Implementation**:

Already done in Day 3-4! The instrumentation is in place. Now just activate the experiment:

```typescript
// src/matching/matching.service.ts (already implemented)
async getMatchesForUser(userId: string, options: GenerateMatchesRequestDto = {}) {
  const experimentName = 'diversity-weight-experiment-v1';
  const variant = this.experimentation.assignVariant(userId, experimentName, ['control', 'treatment']);

  await this.experimentation.trackExposure(userId, experimentName, variant);

  const diversityWeight = variant === 'treatment' ? 0.5 : 0.3;

  // ... rest of matching logic ...
}
```

**Deployment Checklist**:
- [x] Feature flag configured
- [x] Experiment tracking instrumented
- [x] Conversion tracking added to `acceptMatch()`
- [x] Metabase dashboards created
- [x] Rollout plan defined (start at 10%, ramp to 50%)

**Gradual Rollout**:
```typescript
// Day 1-2: Canary test with 10% traffic
const rolloutPercentage = 0.1;
const inExperiment = (this.hashString(userId) % 100) < (rolloutPercentage * 100);

if (inExperiment) {
  // Run experiment logic
} else {
  // Use current logic
}

// Day 3-4: Increase to 25%
// Day 5+: Increase to 50%
```

**Monitor**:
- Check Metabase daily for acceptance rates
- Watch PostgreSQL logs for errors
- Verify no increase in latency

**Estimated Effort**: 2-4 hours (mostly monitoring)

---

#### **Week 4: Qualitative Research & Analysis**

**User Interviews (n=10)**:

**Recruiting**:
- Email 50 users who received matches in treatment group
- Offer $25 Amazon gift card for 15-minute interview
- Use Calendly for scheduling

**Interview Script**:
```
1. Opening (2 min):
   "Thanks for joining! We're working to improve Grove's matching algorithm
   and would love your feedback on recent matches you've received."

2. Match Relevance (5 min):
   - "Looking at your recent matches, which ones stood out to you?"
   - "What made you decide to accept or decline an intro?"
   - "On a scale of 1-10, how relevant were your matches?"

3. Diversity vs Similarity (5 min):
   - "Did any matches feel surprising or unexpected?"
   - "Do you prefer matches with similar interests or diverse backgrounds?"
   - "Have you noticed any patterns in who gets matched with you?"

4. Feature Discovery (2 min):
   - "What would make Grove matches more valuable to you?"
   - "Would you recommend Grove to a friend? Why or why not?"

5. Closing (1 min):
   "Thank you! Your feedback helps us build better connections."
```

**Synthesis** (use Notion):
- Transcribe interviews (Otter.ai - $10/month)
- Tag themes: "diversity-positive", "diversity-negative", "similarity-important", etc.
- Count mentions: e.g., "8/10 mentioned 'unexpected but interesting'"
- Extract quotes for presentation

**In-App Survey** (Typeform embedded in match notification email):

```
1. How relevant were your matches this week?
   ⭐⭐⭐⭐⭐ (1-5 stars)

2. Did you notice anything different about your matches?
   ( ) Yes ( ) No

3. [If yes] What did you notice? (Free text)

4. Would you recommend Grove to a friend?
   😞 😐 😊 (NPS scale 1-10)
```

**Target**: 50+ responses (25% response rate from 200 users)

**Quantitative Analysis**:

Run statistical analysis after 2 weeks:

```bash
curl http://localhost:4000/admin/experiments/diversity-weight-experiment-v1/results
```

**Example Output** (realistic for 200 users):
```json
{
  "experimentName": "diversity-weight-experiment-v1",
  "control": {
    "conversionRate": 0.23,
    "conversions": 23,
    "exposures": 100
  },
  "treatment": {
    "conversionRate": 0.31,
    "conversions": 31,
    "exposures": 100
  },
  "lift": 34.78,
  "pValue": 0.15,
  "isSignificant": false,
  "sampleSizeRecommendation": 384
}
```

**Interpretation**:
- **Lift**: +34.78% improvement in acceptance rate (23% → 31%)
- **Significance**: p=0.15 (NOT statistically significant at p<0.05)
- **Sample Size**: Need 384 users per variant for 95% confidence
- **Reality**: With 100 users, we have directional signal, not statistical proof

**Decision Framework** (for MVP stage):

| Quantitative | Qualitative | Decision |
|-------------|-------------|----------|
| **+35% lift, p=0.15** | **8/10 users prefer treatment** | ✅ **Ship to 100%** |
| +5% lift, p=0.45 | 5/10 neutral | 🔄 **Iterate or extend test** |
| +15% lift, p=0.25 | 2/10 prefer treatment | ❌ **Kill experiment** |

**For our example**: Ship it! Strong qualitative + directional quantitative signal.

**Ship Decision**:
```typescript
// Update feature flag to make treatment the default
{
  'diversity-weight': {
    value: 0.5, // Changed from 0.3
    metadata: {
      description: 'Diversity weight (updated based on experiment results)',
      experiment: 'diversity-weight-experiment-v1',
      shippedAt: '2025-10-30'
    }
  }
}
```

**Document in Notion**:
- Hypothesis
- Experiment design
- Results (quantitative + qualitative)
- Decision rationale
- Next steps

**Estimated Effort**: 10-15 hours (interviews + analysis)

---

## 5. Technical Architecture

### Current Architecture (Phase 1-6)

```
┌─────────────────────────────────────────────────────────────┐
│                      MatchingController                      │
│                    GET /api/matches                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MatchingService                         │
│  - getMatchesForUser()                                       │
│  - acceptMatch() / passMatch()                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   VectorMatchingEngine                       │
│  (extends BaseMatchingEngine)                                │
│                                                              │
│  Template Method Pattern:                                    │
│  1. getCandidatePool() → Top 100 users                       │
│  2. filterStrategy.filter() → Remove invalid               │
│  3. matchingStrategy.computeSimilarity() → pgvector        │
│  4. Filter by threshold → minSimilarityScore               │
│  5. rankingStrategy.rerank() → Diversity                   │
│  6. generateReasons() → Explainability                     │
└───────────┬────────────────┬────────────────┬───────────────┘
            │                │                │
            ▼                ▼                ▼
┌───────────────┐ ┌────────────────┐ ┌──────────────────┐
│ Matching      │ │ Filter         │ │ Ranking          │
│ Strategy      │ │ Strategy       │ │ Strategy         │
│               │ │                │ │                  │
│ • Vector      │ │ • Composite    │ │ • Diversity      │
│   Similarity  │ │ • PriorMatches │ │   Ranking        │
│               │ │ • BlockedUsers │ │                  │
│               │ │ • SameOrg      │ │                  │
└───────────────┘ └────────────────┘ └──────────────────┘
```

**Key Design Patterns**:
- **Strategy Pattern**: Swappable algorithms via interfaces
- **Dependency Injection**: NestJS provides with injection tokens
- **Template Method**: BaseMatchingEngine defines skeleton, subclasses fill in details
- **Composite Pattern**: CompositeFilterStrategy chains multiple filters

---

### Enhanced Architecture (Post-Implementation)

```
┌─────────────────────────────────────────────────────────────┐
│                      MatchingController                      │
│                    GET /api/matches                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MatchingService                         │
│                                                              │
│  NEW: Experiment tracking                                    │
│  ✓ assignVariant() → Consistent user assignment             │
│  ✓ trackExposure() → Log variant shown                      │
│  ✓ trackConversion() → Log user actions                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌────────────────────────┐
│ ExperimentationService│       │  FeatureFlags         │
│                       │       │  (OpenFeature)        │
│ • assignVariant()     │       │                        │
│ • trackExposure()     │       │ • Get strategy name    │
│ • trackConversion()   │       │ • Get parameters       │
│ • analyzeExperiment() │       │ • Boolean toggles      │
└───────────────────────┘       └────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Database (PostgreSQL)                        │
│                                                              │
│  NEW Tables:                                                 │
│  • experiment_exposures (user, experiment, variant, time)    │
│  • experiment_conversions (user, experiment, metric, time)   │
│  • query_logs (operation, duration, candidate_count)         │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Metabase Dashboards                        │
│                                                              │
│  • Acceptance Rate by Date                                   │
│  • Experiment Performance Comparison                         │
│  • pgvector Query Performance                                │
│  • Similarity Score Distribution                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Data Flow: Experiment Execution

```
User Request
     │
     ▼
[1] MatchingService.getMatchesForUser()
     │
     ├─> ExperimentationService.assignVariant()
     │   (Consistent hashing: userId + experimentName → variant)
     │
     ├─> ExperimentationService.trackExposure()
     │   (INSERT INTO experiment_exposures)
     │
     ├─> Apply variant logic
     │   (e.g., diversityWeight = 0.5 if treatment, else 0.3)
     │
     └─> VectorMatchingEngine.generateMatches()
         (Run matching with experiment parameters)

User accepts intro
     │
     ▼
[2] MatchingService.acceptMatch()
     │
     └─> ExperimentationService.trackConversion()
         (INSERT INTO experiment_conversions)

Admin wants results
     │
     ▼
[3] GET /admin/experiments/:name/results
     │
     └─> ExperimentationService.analyzeExperiment()
         │
         ├─> Query exposures by variant
         ├─> Query conversions by variant
         ├─> Calculate conversion rates
         ├─> Run two-proportion z-test
         ├─> Calculate p-value, confidence intervals
         └─> Return analysis
```

---

## 6. Metrics & Observability

### Metrics Hierarchy

**Level 1: Business Metrics** (Product impact)
- Intro acceptance rate (% of matches → accepted intros)
- Mutual match rate (% where both users accept)
- Time to accept (days from match to acceptance)
- User retention (D7, D14, D30)
- Net Promoter Score (NPS)

**Level 2: Algorithm Metrics** (Quality)
- Average similarity score (pgvector cosine similarity)
- Diversity score (cross-org, cross-domain)
- Match relevance (user-reported 1-5 stars)
- Precision@K (relevant matches in top K)
- Coverage (% of users who receive matches)

**Level 3: System Metrics** (Performance)
- Matching latency (p50, p95, p99)
- pgvector query time
- Candidate pool size
- Filter efficiency (candidates before/after)
- Error rate

---

### Metabase Dashboard Setup

**Dashboard 1: Matching Performance**

```sql
-- Panel 1: Daily Acceptance Rate (last 30 days)
SELECT
  DATE(m.created_at) as date,
  COUNT(*) as total_matches,
  COUNT(i.id) as accepted_intros,
  ROUND(COUNT(i.id)::numeric / COUNT(*) * 100, 2) as acceptance_rate_pct
FROM matches m
LEFT JOIN intros i ON m.id = i.match_id AND i.status = 'mutual'
WHERE m.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(m.created_at)
ORDER BY date DESC;

-- Panel 2: Acceptance Rate by Similarity Score Bucket
SELECT
  CASE
    WHEN m.similarity_score >= 0.9 THEN '0.90+'
    WHEN m.similarity_score >= 0.8 THEN '0.80-0.89'
    WHEN m.similarity_score >= 0.7 THEN '0.70-0.79'
    ELSE '< 0.70'
  END as similarity_bucket,
  COUNT(*) as match_count,
  COUNT(i.id) as accepted_count,
  ROUND(COUNT(i.id)::numeric / COUNT(*) * 100, 2) as acceptance_rate_pct
FROM matches m
LEFT JOIN intros i ON m.id = i.match_id AND i.status = 'mutual'
WHERE m.created_at >= NOW() - INTERVAL '30 days'
GROUP BY similarity_bucket
ORDER BY similarity_bucket DESC;

-- Panel 3: Top Performing Match Reasons
SELECT
  unnest(string_to_array(m.context, '.')) as reason,
  COUNT(*) as mention_count,
  COUNT(i.id) as accepted_count,
  ROUND(COUNT(i.id)::numeric / COUNT(*) * 100, 2) as acceptance_rate_pct
FROM matches m
LEFT JOIN intros i ON m.id = i.match_id AND i.status = 'mutual'
WHERE m.created_at >= NOW() - INTERVAL '30 days'
  AND m.context IS NOT NULL
GROUP BY reason
ORDER BY accepted_count DESC
LIMIT 10;
```

**Dashboard 2: Experiment Tracking**

```sql
-- Panel 1: Experiment Overview
SELECT
  ee.experiment_name,
  ee.variant,
  COUNT(DISTINCT ee.user_id) as users_exposed,
  COUNT(DISTINCT ec.user_id) as users_converted,
  ROUND(
    COUNT(DISTINCT ec.user_id)::numeric /
    COUNT(DISTINCT ee.user_id) * 100,
    2
  ) as conversion_rate_pct,
  MIN(ee.timestamp) as start_date,
  MAX(ee.timestamp) as last_exposure
FROM experiment_exposures ee
LEFT JOIN experiment_conversions ec
  ON ee.user_id = ec.user_id
  AND ee.experiment_name = ec.experiment_name
GROUP BY ee.experiment_name, ee.variant
ORDER BY ee.experiment_name, ee.variant;

-- Panel 2: Experiment Timeline (daily exposures)
SELECT
  DATE(timestamp) as date,
  variant,
  COUNT(DISTINCT user_id) as daily_exposures
FROM experiment_exposures
WHERE experiment_name = '{{experiment_name}}'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), variant
ORDER BY date DESC;

-- Panel 3: Conversion Funnel
WITH funnel AS (
  SELECT
    ee.variant,
    COUNT(DISTINCT ee.user_id) as exposed,
    COUNT(DISTINCT CASE WHEN m.id IS NOT NULL THEN ee.user_id END) as received_matches,
    COUNT(DISTINCT CASE WHEN i.id IS NOT NULL THEN ee.user_id END) as accepted_intros
  FROM experiment_exposures ee
  LEFT JOIN matches m ON ee.user_id = m.user_a_id OR ee.user_id = m.user_b_id
  LEFT JOIN intros i ON m.id = i.match_id AND i.status = 'mutual'
  WHERE ee.experiment_name = '{{experiment_name}}'
  GROUP BY ee.variant
)
SELECT
  variant,
  exposed,
  received_matches,
  ROUND(received_matches::numeric / exposed * 100, 2) as match_rate_pct,
  accepted_intros,
  ROUND(accepted_intros::numeric / exposed * 100, 2) as conversion_rate_pct
FROM funnel;
```

**Dashboard 3: System Performance**

```sql
-- Panel 1: pgvector Query Performance (last 7 days)
SELECT
  DATE(timestamp) as date,
  ROUND(AVG(duration_ms), 2) as avg_duration_ms,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms), 2) as p50_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms), 2) as p95_ms,
  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms), 2) as p99_ms,
  MAX(duration_ms) as max_ms,
  COUNT(*) as query_count
FROM query_logs
WHERE operation = 'vector_similarity_search'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Panel 2: Query Performance by Candidate Count
SELECT
  CASE
    WHEN candidate_count < 50 THEN '< 50'
    WHEN candidate_count < 100 THEN '50-99'
    WHEN candidate_count < 200 THEN '100-199'
    ELSE '200+'
  END as candidate_bucket,
  ROUND(AVG(duration_ms), 2) as avg_duration_ms,
  COUNT(*) as query_count
FROM query_logs
WHERE operation = 'vector_similarity_search'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY candidate_bucket
ORDER BY candidate_bucket;

-- Panel 3: Error Rate Tracking
SELECT
  DATE(timestamp) as date,
  event_type,
  COUNT(*) as event_count
FROM events
WHERE event_type LIKE 'error_%'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp), event_type
ORDER BY date DESC, event_count DESC;
```

---

### Alert Definitions

**Critical Alerts** (page immediately):
- Intro acceptance rate drops > 20% relative (e.g., 30% → 24%)
- pgvector P95 latency > 2 seconds
- Error rate > 1% of requests
- Matching service down (health check fails)

**Warning Alerts** (Slack notification):
- Acceptance rate drops > 10% relative
- pgvector P95 latency > 1 second
- Experiment sample size < expected after 1 week
- Diversity score drops > 15%

**Implementation** (Phase 2 - with Grafana):
```yaml
# grafana/alerts.yml
groups:
  - name: matching_performance
    interval: 5m
    rules:
      - alert: AcceptanceRateDropped
        expr: |
          (
            rate(match_acceptance_total[1h]) /
            rate(match_generation_total[1h])
          ) < 0.20
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Acceptance rate dropped below 20%"

      - alert: HighPgvectorLatency
        expr: |
          histogram_quantile(0.95,
            rate(pgvector_query_duration_seconds_bucket[5m])
          ) > 2.0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "pgvector P95 latency > 2 seconds"
```

---

## 7. Experimentation Workflow

### Standard Experiment Lifecycle

**Phase 1: Ideation (1-2 days)**
1. **Identify Opportunity**: Metric underperforming or feature hypothesis
2. **Formulate Hypothesis**: "If we change X, then Y will improve because Z"
3. **Define Metrics**:
   - Primary: What we're optimizing (e.g., acceptance rate)
   - Secondary: Supporting indicators (e.g., diversity, satisfaction)
   - Guardrails: What must not degrade (e.g., similarity, latency)
4. **Design Experiment**:
   - Control vs Treatment specification
   - Traffic split (usually 50/50 for MVP)
   - Duration (2-4 weeks for statistical power)
   - Exit criteria (what would make us stop early)

**Phase 2: Implementation (2-3 days)**
1. **Create Feature Flag**: Add to OpenFeature config
2. **Implement Variant Logic**: Use flag to control algorithm behavior
3. **Add Instrumentation**: Track exposures and conversions
4. **Write Tests**: Unit tests for both variants
5. **Code Review**: Ensure experiment doesn't break existing functionality

**Phase 3: Deployment (1 week)**
1. **Canary Test** (Day 1-2): Deploy to 10% of users
   - Monitor for errors, crashes, latency spikes
   - Quick qualitative check with 3-5 users
2. **Gradual Rollout** (Day 3-5):
   - Increase to 25%, monitor for 24 hours
   - Increase to 50%, monitor for 24 hours
3. **Full Experiment** (Day 6-7): Run at target traffic split

**Phase 4: Monitoring (1-2 weeks)**
1. **Daily Checks**:
   - Review Metabase dashboards
   - Check for errors in logs
   - Verify variant distribution is balanced
2. **Weekly Analysis**:
   - Calculate interim results (conversion rates, lift)
   - Check if on track for statistical significance
   - Identify any red flags (guardrail violations)

**Phase 5: Qualitative Research (Parallel to Phase 4)**
1. **User Interviews** (n=10-15):
   - Recruit from treatment group
   - Ask open-ended questions about experience
   - Probe for unexpected behaviors
2. **Surveys** (n=50+):
   - Embed in email notifications
   - Keep short (3-5 questions max)
   - Mix quantitative (ratings) and qualitative (free text)
3. **Synthesis**:
   - Transcribe and tag themes
   - Count mentions of key concepts
   - Extract representative quotes

**Phase 6: Analysis & Decision (2-3 days)**
1. **Statistical Analysis**:
   - Run two-proportion z-test
   - Calculate lift, p-value, confidence intervals
   - Assess statistical significance (p < 0.05 ideal, p < 0.2 acceptable at MVP)
2. **Qualitative Synthesis**:
   - Review interview themes
   - Check if qual and quant align
   - Identify edge cases or concerns
3. **Decision Framework**:
   - **Ship**: Strong qual + quant signal (lift > 10%, p < 0.2, 60%+ user preference)
   - **Iterate**: Mixed signals (redesign experiment)
   - **Kill**: Negative qual or guardrail violations
   - **Extend**: Promising but underpowered (run longer)
4. **Document**:
   - Write up experiment results in Notion
   - Include hypothesis, design, results, decision, learnings
   - Share with team

**Phase 7: Rollout (1-2 days)**
1. **Update Feature Flag**: Set winning variant as default
2. **Remove Experiment Code**: Clean up variant logic
3. **Archive Experiment**: Mark as complete in database
4. **Monitor Post-Launch**: Watch metrics for 1 week after 100% rollout

---

### Decision Framework for MVP Stage (<1000 users)

With limited sample sizes, you won't achieve statistical significance (p < 0.05). Use this framework:

| Quantitative Signal | Qualitative Signal | Decision |
|---------------------|-------------------|----------|
| **Strong lift (>25%), moderate p-value (0.1-0.2)** | **Strong user preference (>70%)** | ✅ **Ship to 100%** |
| **Moderate lift (10-25%), weak p-value (0.2-0.4)** | **Moderate preference (60-70%)** | 🟡 **Extend experiment or ship with monitoring** |
| **Weak lift (5-10%), high p-value (>0.4)** | **Neutral (50-60%)** | 🔄 **Iterate or kill** |
| **Any lift** | **Negative feedback (<40% prefer)** | ❌ **Kill immediately** |
| **Negative lift** | **Any** | ❌ **Kill immediately** |

**Guardrail Violations** (automatic kill):
- Primary metric degrades > 5%
- System performance degrades (latency, errors)
- User complaints spike
- Safety/privacy issues discovered

---

### Example: Diversity Weight Experiment

**Hypothesis**:
> "Increasing diversity weight from 0.3 to 0.5 will improve intro acceptance rates because users value serendipitous connections that expose them to different perspectives and organizations."

**Design**:
- **Primary Metric**: Intro acceptance rate (% of matches where both users accept)
- **Secondary Metrics**:
  - Cross-org diversity (% of matches across different organizations)
  - User satisfaction (NPS from survey)
- **Guardrails**:
  - Average similarity score ≥ 0.7 (relevance floor)
  - Matching latency P95 < 500ms
- **Control**: `diversityWeight = 0.3`
- **Treatment**: `diversityWeight = 0.5`
- **Traffic**: 50/50 split
- **Duration**: 2 weeks
- **Target Sample**: 100 users per variant

**Timeline**:
- **Week 1**: Deploy experiment, monitor for errors
- **Week 2**: User interviews (n=10), collect survey responses
- **Week 3**: Analyze results, make decision

**Results** (hypothetical):

**Quantitative**:
```json
{
  "control": {
    "conversionRate": 0.23,
    "conversions": 23,
    "exposures": 100
  },
  "treatment": {
    "conversionRate": 0.31,
    "conversions": 31,
    "exposures": 100
  },
  "lift": 34.78,
  "pValue": 0.15,
  "isSignificant": false
}
```

**Qualitative**:
- 8/10 users interviewed preferred diverse matches
- Quotes:
  - "I met someone from a completely different industry - it was refreshing!"
  - "The matches felt more interesting, less echo chamber"
  - "I appreciated the variety, even if similarity was slightly lower"
- Survey: 4.2/5 average match relevance (vs 4.0 in control)

**Decision**: ✅ **Ship to 100%**
- Strong qualitative signal (80% preference)
- Directional quantitative lift (+35%)
- No guardrail violations (avg similarity: 0.72)
- Aligns with Grove's mission (cross-org connections)

**Next Steps**:
- Update default `diversityWeight` to 0.5
- Monitor acceptance rate for 2 weeks post-launch
- Document learnings in Notion

---

## 8. Migration Paths

### Phase 1 → Phase 2 Migration (Month 3-4)

**When to Migrate**:
- Product managers want to control experiments without engineer deploys
- Running 3+ experiments simultaneously
- Need real-time dashboards (not batch SQL)

**Migration Steps**:

#### **Step 1: Set up Unleash (1-2 hours)**

```bash
# Add to docker-compose.yml
services:
  unleash-db:
    image: postgres:15
    environment:
      POSTGRES_DB: unleash
      POSTGRES_USER: unleash
      POSTGRES_PASSWORD: ${UNLEASH_DB_PASSWORD}
    volumes:
      - unleash_data:/var/lib/postgresql/data

  unleash:
    image: unleashorg/unleash-server:latest
    ports:
      - "4242:4242"
    environment:
      DATABASE_URL: postgres://unleash:${UNLEASH_DB_PASSWORD}@unleash-db:5432/unleash
      DATABASE_SSL: "false"
    depends_on:
      - unleash-db

volumes:
  unleash_data:
```

Start Unleash:
```bash
docker-compose up -d unleash unleash-db
# Access at http://localhost:4242
# Default login: admin / unleash4all
```

#### **Step 2: Install Unleash Provider (15 min)**

```bash
npm install @openfeature/unleash-client-provider unleash-client
```

#### **Step 3: Swap Provider (NO CODE CHANGES!)**

```typescript
// src/feature-flags/feature-flags.module.ts
import { UnleashProvider } from '@openfeature/unleash-client-provider';

@Module({
  imports: [
    OpenFeatureModule.forRoot({
      // ONLY THIS CHANGES - rest of your code stays the same!
      provider: new UnleashProvider({
        url: process.env.UNLEASH_URL || 'http://localhost:4242/api',
        appName: 'grove-matching',
        clientKey: process.env.UNLEASH_CLIENT_KEY,
      })
    })
  ],
  exports: [OpenFeatureModule]
})
export class FeatureFlagsModule {}
```

**That's it!** All your existing feature flag code works unchanged because of OpenFeature abstraction.

#### **Step 4: Migrate Flags in Unleash UI (30 min)**

1. Log into Unleash (http://localhost:4242)
2. Create flags:
   - `matching-strategy` (string variant: vector-similarity, collaborative-filtering, etc.)
   - `diversity-weight` (number variant: 0.3, 0.5, etc.)
   - `similarity-threshold` (number variant: 0.6, 0.7, 0.8, etc.)
3. Set default values to match your current InMemoryProvider config
4. Deploy updated environment variables

**Benefits After Migration**:
- ✅ Product managers can change flags via UI
- ✅ Gradual rollout percentages (0% → 25% → 50% → 100%)
- ✅ User targeting (by org, by cohort, by user ID)
- ✅ Audit logs (who changed what, when)
- ✅ A/B test variants with traffic splits

---

### Phase 2 → Phase 3 Migration (Month 6-9)

**When to Migrate**:
- >5K users (need better performance)
- >10 experiments running simultaneously
- Want unified analytics + flags + A/B testing
- pgvector queries slowing down (need HNSW)

**Option A: Add PostHog (All-in-One)**

**Why PostHog**:
- Replaces Metabase, Unleash, and GrowthBook with one platform
- Product analytics + feature flags + A/B testing + session replay
- Generous free tier (1M events/month)

**Setup** (2-3 hours):

```bash
npm install posthog-node posthog-js
```

```typescript
// src/analytics/posthog.module.ts
import { Module, Global } from '@nestjs/common';
import { PostHog } from 'posthog-node';

@Global()
@Module({
  providers: [
    {
      provide: 'POSTHOG_CLIENT',
      useFactory: () => {
        return new PostHog(
          process.env.POSTHOG_API_KEY!,
          { host: 'https://app.posthog.com' }
        );
      },
    },
  ],
  exports: ['POSTHOG_CLIENT'],
})
export class PostHogModule {}
```

**Track Events**:
```typescript
// src/matching/matching.service.ts
@Injectable()
export class MatchingService {
  constructor(
    @Inject('POSTHOG_CLIENT') private posthog: PostHog
  ) {}

  async generateMatches(request: GenerateMatchesRequest) {
    // ... matching logic ...

    this.posthog.capture({
      distinctId: request.userId,
      event: 'matches_generated',
      properties: {
        match_count: matches.length,
        avg_similarity: this.avgScore(matches),
        strategy: 'vector-similarity',
        diversity_weight: diversityWeight
      }
    });

    return matches;
  }
}
```

**Migrate Feature Flags**:

PostHog has built-in feature flags - can replace Unleash:

```typescript
// Check feature flag
const variant = await this.posthog.getFeatureFlag(
  'diversity-weight-experiment',
  userId
);

if (variant === 'test') {
  diversityWeight = 0.5;
}
```

**Cost**: $0 for first 1M events, then $0.0001/event (~$100/month at 1M events/month)

---

**Option B: Keep Unleash + Add Prometheus/Grafana**

If you prefer separate tools:

**Add Prometheus**:
```bash
npm install prom-client @willsoto/nestjs-prometheus
```

```typescript
// src/metrics/metrics.module.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
    }),
  ],
})
export class MetricsModule {}
```

**Add Custom Metrics**:
```typescript
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MatchingService {
  constructor(
    @InjectMetric('matching_requests_total') private counter: Counter,
    @InjectMetric('matching_duration_seconds') private histogram: Histogram
  ) {}

  async generateMatches(request: GenerateMatchesRequest) {
    const start = Date.now();
    this.counter.inc({ strategy: 'vector-similarity' });

    // ... matching logic ...

    this.histogram.observe((Date.now() - start) / 1000);
    return matches;
  }
}
```

**Set up Grafana** (docker-compose.yml):
```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:
```

**Cost**: $0 (self-hosted) or Grafana Cloud free tier (10K series, 50GB logs)

---

**pgvector Index Migration (IVFFlat → HNSW)**

When you reach 5K+ users, migrate to HNSW for better query performance:

```sql
-- 1. Create new index (this will take time - run during low traffic)
CREATE INDEX CONCURRENTLY embeddings_hnsw_idx ON embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 2. Drop old index
DROP INDEX embeddings_vector_idx;

-- 3. Rename new index
ALTER INDEX embeddings_hnsw_idx RENAME TO embeddings_vector_idx;

-- 4. Test performance
EXPLAIN ANALYZE
SELECT user_id, 1 - (embedding <=> '[...]'::vector) AS score
FROM embeddings
WHERE user_id != 'source-user-id'
ORDER BY embedding <=> '[...]'::vector
LIMIT 100;
```

**Expected Improvement**:
- IVFFlat P95 latency: ~20-50ms (5K users)
- HNSW P95 latency: ~5-10ms (5K users)
- 2-5x faster queries at scale

---

## 9. Cost Analysis

### Total Cost of Ownership (TCO)

#### **Phase 1: MVP (Month 1-3)**

| Component | Solution | Cost/Month | Notes |
|-----------|----------|------------|-------|
| **Feature Flags** | OpenFeature + InMemory | $0 | Code-based, no external service |
| **A/B Testing** | Custom (simple-statistics) | $0 | TypeScript library, no service |
| **Metrics** | PostgreSQL + Metabase | $0 | Self-hosted, reuse existing DB |
| **Interviews** | Calendly Free + Otter.ai | $10 | $10/month for transcription |
| **Surveys** | Typeform Free | $0 | Up to 10 questions, 100 responses/month |
| **Hosting** | Existing infrastructure | $0 | No new services |
| **Total** | | **$10/month** | |

**Additional One-Time Costs**:
- User interview incentives: $25/interview × 10 interviews = $250/experiment
- Amortized: ~$125/month if running 2 experiments per month

**Total Phase 1**: **~$135/month** including incentives

---

#### **Phase 2: Growth (Month 3-6)**

| Component | Solution | Cost/Month | Notes |
|-----------|----------|------------|-------|
| **Feature Flags** | Unleash (self-hosted) | $10 | DigitalOcean droplet for Unleash DB |
| **A/B Testing** | GrowthBook (self-hosted) | $0 | OR use GrowthBook Cloud ($20/month) |
| **Metrics** | Prometheus + Grafana Cloud | $0 | Free tier: 10K series, 50GB logs |
| **Observability** | Grafana Dashboards | $0 | Included in Grafana Cloud free tier |
| **Interviews/Surveys** | Calendly + Typeform + Otter.ai | $10 | Same as Phase 1 |
| **Hosting** | +1 droplet for Prometheus | $10 | $10/month DigitalOcean |
| **Total** | | **$30-50/month** | |

**With User Incentives**: **~$155-175/month**

---

#### **Phase 3: Scale (Month 6-12)**

**Option A: All-in-One (PostHog)**

| Component | Solution | Cost/Month | Notes |
|-----------|----------|------------|-------|
| **All-in-One** | PostHog Cloud | $100-200 | 1M events = $100, 2M = $200 |
| **Feature Flags** | PostHog (included) | $0 | Part of PostHog |
| **A/B Testing** | PostHog (included) | $0 | Part of PostHog |
| **Analytics** | PostHog (included) | $0 | Part of PostHog |
| **Interviews** | Calendly Pro | $15 | Unlimited event types |
| **Surveys** | Typeform Pro | $25 | Unlimited questions |
| **Total** | | **$140-240/month** | |

**With User Incentives**: **~$265-365/month**

**Option B: Best-of-Breed**

| Component | Solution | Cost/Month | Notes |
|-----------|----------|------------|-------|
| **Feature Flags** | Unleash Cloud | $80 | 5 users, hosted |
| **A/B Testing** | GrowthBook Cloud | $20 | 3 users |
| **Metrics** | Grafana Cloud | $0-50 | Free → Paid at scale |
| **Analytics** | Mixpanel Free | $0 | 20M events/month free |
| **Observability** | Prometheus + Grafana | $30 | Self-hosted |
| **Total** | | **$130-180/month** | |

---

#### **Phase 4: Mature (Year 2+)**

| Component | Solution | Cost/Month | Notes |
|-----------|----------|------------|-------|
| **Feature Flags** | LaunchDarkly | $200-500 | Enterprise features |
| **A/B Testing** | Optimizely / VWO | $500-2000 | Advanced experimentation |
| **Observability** | Datadog | $500-1500 | Full APM suite |
| **Analytics** | Mixpanel / Amplitude | $200-500 | Product analytics |
| **ML Platform** | MLflow + Kubeflow | $200-500 | Self-hosted on k8s |
| **Total** | | **$1600-5000/month** | |

---

### Cost Comparison: Build vs Buy

**Build (Phase 1 Approach)**:
- **Pros**:
  - $10/month (cheapest)
  - Full control
  - No vendor lock-in
  - Familiar tech (TypeScript, PostgreSQL)
- **Cons**:
  - Engineering time (2 weeks setup)
  - No web UI for non-engineers
  - Manual statistical analysis
  - Limited scalability

**Buy (PostHog / LaunchDarkly)**:
- **Pros**:
  - Faster setup (1 day)
  - Web UI for everyone
  - Built-in analytics
  - Scales automatically
- **Cons**:
  - $100-500/month
  - Vendor lock-in
  - Less customization
  - Data privacy (external hosting)

**Grove Recommendation**: Start with Build (Phase 1), migrate to Buy when you have product-market fit and revenue. The $1500-5000/month in Phase 4 should be <1% of revenue by then.

---

### ROI Analysis

**Scenario**: Diversity weight experiment increases acceptance rate from 23% to 31% (+35% lift)

**Assumptions**:
- 500 active users
- Each user generates 5 matches/month
- Acceptance rate: 23% → 31%
- Each intro creates $10 in lifetime value (LTV)

**Baseline** (no experiment):
- Matches: 500 users × 5 matches = 2,500 matches/month
- Accepted: 2,500 × 23% = 575 intros/month
- LTV: 575 × $10 = **$5,750/month**

**After Experiment**:
- Matches: 2,500 matches/month (same)
- Accepted: 2,500 × 31% = 775 intros/month
- LTV: 775 × $10 = **$7,750/month**

**Incremental Value**: $7,750 - $5,750 = **$2,000/month**

**Experiment Cost**:
- Engineering time: 40 hours @ $100/hour = $4,000 one-time
- Tooling: $135/month (Phase 1)
- Ongoing: $135/month

**Payback Period**: $4,000 / $2,000 = **2 months**

**12-Month ROI**: ($2,000 × 12 - $4,000 - $135 × 12) / ($4,000 + $135 × 12) = **287% ROI**

**Conclusion**: Even modest improvements in matching quality deliver massive ROI. Experimentation infrastructure pays for itself in weeks, not years.

---

## 10. Success Criteria

### Phase 1 Success Metrics (2-week implementation)

**Infrastructure** (Technical):
- [x] Feature flags control 3+ algorithm parameters
- [x] Experiment tracking logs 100% of exposures and conversions
- [x] Statistical analysis produces p-values, confidence intervals, lift
- [x] Metabase dashboards show acceptance rates, experiment results
- [x] Performance logging tracks pgvector query times

**Process** (Operational):
- [x] Run first experiment (diversity weight)
- [x] Conduct 10 user interviews
- [x] Analyze results and make ship/no-ship decision
- [x] Document experiment in Notion
- [x] Ship winning variant to 100% traffic

**Outcome** (Business):
- [x] Acceptance rate directional lift > 10% (even if not statistically significant)
- [x] Qualitative feedback positive (>60% user preference)
- [x] No increase in latency (P95 < 500ms)
- [x] No errors or crashes from experiment code

---

### Phase 2 Success Metrics (3-month growth)

**Infrastructure**:
- [x] Unleash web UI accessible to product managers
- [x] Prometheus + Grafana real-time dashboards
- [x] Automated alerts for acceptance rate drops, latency spikes
- [x] User targeting (by org, by cohort)

**Process**:
- [x] Run 5+ experiments over 3 months (≥1 per 3 weeks)
- [x] Non-engineers launch experiments without engineer help
- [x] Experiment documentation standardized (template in Notion)
- [x] Experiment review meetings every 2 weeks

**Outcome**:
- [x] 2+ experiments shipped to production
- [x] Cumulative acceptance rate improvement > 25% from baseline
- [x] Matching algorithm iteration cycle < 3 weeks (down from months)
- [x] Product team confidence in data-driven decisions

---

### Phase 3 Success Metrics (6-12 month scale)

**Infrastructure**:
- [x] pgvector migrated to HNSW (P95 latency < 10ms)
- [x] Feature store (if needed) for shared features
- [x] Model registry (MLflow) for algorithm versioning
- [x] Automated regression testing on every deploy

**Process**:
- [x] Run 20+ experiments over 6 months (≥1 per week)
- [x] Experiment velocity: idea → shipped in <2 weeks
- [x] Multi-armed bandits or personalization deployed
- [x] Quarterly algorithm performance reviews

**Outcome**:
- [x] Acceptance rate > 40% (from 23% baseline = 74% relative improvement)
- [x] User satisfaction (NPS) > 50
- [x] Matching algorithm supports 10K+ users with <50ms latency
- [x] Experimentation culture embedded in team

---

## Appendix A: File Structure

After implementing Phase 1, your Grove backend will have these additions:

```
grove-backend/
├── src/
│   ├── feature-flags/
│   │   ├── feature-flags.module.ts
│   │   └── README.md (flag documentation)
│   │
│   ├── experimentation/
│   │   ├── experimentation.module.ts
│   │   ├── experimentation.service.ts
│   │   ├── experimentation.service.spec.ts
│   │   └── experimentation.controller.ts
│   │
│   ├── matching/
│   │   ├── matching.service.ts (UPDATED - adds experiment tracking)
│   │   ├── matching.module.ts (UPDATED - adds feature flag DI)
│   │   ├── strategies/
│   │   │   ├── matching/
│   │   │   │   ├── vector-similarity.strategy.ts (UPDATED - adds logging)
│   │   │   │   └── vector-similarity-v2.strategy.ts (NEW - future variant)
│   │   │   └── ... (existing filters, ranking)
│   │   └── ... (existing files)
│   │
│   └── ... (existing modules)
│
├── prisma/
│   ├── schema.prisma (UPDATED - adds experiment tables)
│   └── migrations/
│       └── 20251023_add_experimentation_tables/
│           └── migration.sql
│
├── docs/
│   ├── MATCHING_ALGORITHM_EXPERIMENTATION_STRATEGY.md (THIS FILE)
│   ├── experiments/
│   │   ├── template.md (Experiment documentation template)
│   │   └── diversity-weight-experiment-v1.md (Example)
│   └── metabase/
│       ├── dashboard-1-matching-performance.sql
│       ├── dashboard-2-experiment-tracking.sql
│       └── dashboard-3-system-performance.sql
│
├── docker-compose.yml (UPDATED - adds Metabase)
└── .env.example (UPDATED - adds feature flag config)
```

---

## Appendix B: Experiment Documentation Template

Save this as `docs/experiments/template.md`:

```markdown
# Experiment: [Name]

**Status**: [Planning | Running | Analyzing | Shipped | Killed]
**Start Date**: YYYY-MM-DD
**End Date**: YYYY-MM-DD
**Owner**: [Name]
**Reviewers**: [Names]

---

## Hypothesis

**If we** [change/add/remove X], **then** [metric Y will improve], **because** [reasoning Z].

---

## Design

### Metrics
- **Primary**: [What we're optimizing]
- **Secondary**: [Supporting indicators]
- **Guardrails**: [What must not degrade]

### Variants
- **Control**: [Baseline behavior]
- **Treatment**: [Proposed change]

### Configuration
- **Traffic Split**: X% control, Y% treatment
- **Duration**: N weeks
- **Target Sample**: M users per variant
- **Exit Criteria**: [When to stop early]

---

## Implementation

**Feature Flag**: `experiment-name-v1`

**Code Changes**:
- [File 1]: [Description]
- [File 2]: [Description]

**Deployment**:
- Day 1-2: Canary (10%)
- Day 3-5: Gradual rollout (25% → 50%)
- Day 6+: Full experiment (50/50 split)

---

## Results

### Quantitative

| Metric | Control | Treatment | Lift | p-value | Significant? |
|--------|---------|-----------|------|---------|--------------|
| [Primary] | X.XX | X.XX | +XX% | 0.XX | Yes/No |
| [Secondary 1] | X.XX | X.XX | +XX% | 0.XX | Yes/No |
| [Guardrail 1] | X.XX | X.XX | +XX% | 0.XX | Yes/No |

**Statistical Analysis**:
```json
{
  "lift": XX.XX,
  "pValue": 0.XX,
  "confidenceInterval": [0.XX, 0.XX],
  "sampleSize": XXX
}
```

### Qualitative

**User Interviews** (n=XX):
- **Theme 1**: [Description] (X/X users mentioned)
- **Theme 2**: [Description] (X/X users mentioned)

**Representative Quotes**:
> "[User quote supporting or contradicting hypothesis]"

**Survey Results** (n=XX):
- Satisfaction: X.X/5 (control: X.X/5)
- NPS: XX (control: XX)

---

## Decision

**Outcome**: [Ship | Iterate | Kill | Extend]

**Rationale**:
[Why we made this decision based on quant + qual data]

**Next Steps**:
- [ ] [Action item 1]
- [ ] [Action item 2]

---

## Learnings

**What Worked**:
- [Learning 1]
- [Learning 2]

**What Didn't**:
- [Challenge 1]
- [Challenge 2]

**Future Ideas**:
- [Follow-up experiment idea 1]
- [Follow-up experiment idea 2]

---

## References

- **Metabase Dashboard**: [Link]
- **Code PR**: [Link]
- **Interview Notes**: [Link to Notion]
- **Survey Results**: [Link to Typeform]
```

---

## Appendix C: Quick Reference Commands

### Development

```bash
# Install dependencies
npm install @openfeature/server-sdk @openfeature/nestjs-sdk simple-statistics

# Run migrations
npx prisma migrate dev --name add_experimentation_tables

# Generate Prisma client
npx prisma generate

# Run tests
npm test

# Start dev server
npm run dev
```

### Docker

```bash
# Start all services (PostgreSQL, Redis, Metabase)
docker-compose up -d

# View logs
docker-compose logs -f grove-backend

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d grove

# Check experiment data
SELECT experiment_name, variant, COUNT(*)
FROM experiment_exposures
GROUP BY experiment_name, variant;

# Analyze experiment results
SELECT * FROM experiment_conversions
WHERE experiment_name = 'diversity-weight-experiment-v1';
```

### Metabase

```bash
# Access Metabase UI
open http://localhost:3000

# First-time setup:
# 1. Choose PostgreSQL
# 2. Host: postgres (Docker network)
# 3. Port: 5432
# 4. Database: grove
# 5. Username/Password: from .env
```

### Feature Flags

```bash
# View current flags (InMemoryProvider)
# Edit src/feature-flags/feature-flags.module.ts

# Deploy flag changes (InMemoryProvider requires code deploy)
git add src/feature-flags/feature-flags.module.ts
git commit -m "Update diversity weight to 0.5"
git push
```

### Experiments

```bash
# View experiment results
curl http://localhost:4000/admin/experiments/diversity-weight-experiment-v1/results

# Check experiment stats
curl http://localhost:4000/admin/experiments/diversity-weight-experiment-v1/stats
```

---

## Conclusion

This strategy provides a complete, actionable plan for implementing world-class matching algorithm experimentation at Grove, adapted for startup MVP constraints:

✅ **Modular Architecture**: Your existing Strategy pattern is production-ready
✅ **Incremental Adoption**: Start simple (2 weeks), scale gradually (3-6 months)
✅ **Cost-Effective**: $10-50/month for Phase 1-2 (vs $5000+/month enterprise solutions)
✅ **Qualitative + Quantitative**: Appropriate for <1K users
✅ **Open Source First**: Minimize vendor lock-in, maximize flexibility

**Next Steps**:
1. Review this document with your team
2. Commit to 2-week Sprint 1 implementation
3. Run your first experiment (diversity weight)
4. Ship winning variant and iterate

**Questions?** Add comments to this doc or create GitHub issues.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Authors**: Claude (Research), Sean Kim (Product Vision)
**Status**: Ready for Implementation
