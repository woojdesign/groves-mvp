---
doc_type: plan
date: 2025-10-22T22:46:59+00:00
title: "Grove MVP Modular Matching Engine - Architectural Addendum"
feature: "Modular Matching Engine Architecture"
plan_reference: thoughts/plans/2025-10-22-grove-mvp-backend-implementation-plan.md

# Update phase status as implementation progresses
phases:
  - name: "Phase 4.5: Matching Engine Foundation"
    status: pending
    estimated_days: 3
  - name: "Phase 5: Matching Implementation (Revised)"
    status: pending
    estimated_days: 11

git_commit: 0f638f51c9a505624e2f9a6a19b5dab4c2724993
branch: main
repository: workspace

created_by: Claude
last_updated: 2025-10-22
last_updated_by: Claude

tags:
  - grove-mvp
  - backend
  - matching-engine
  - architecture
  - addendum
  - modular-design
  - nestjs
status: draft

related_docs:
  - thoughts/plans/2025-10-22-grove-mvp-backend-implementation-plan.md
---

# Grove MVP Modular Matching Engine - Architectural Addendum

**Addendum Date**: October 22, 2025
**Parent Plan**: Grove MVP Backend Implementation Plan
**Focus**: Modular matching engine architecture for Phase 4.5 and revised Phase 5
**Status**: Draft

---

## Executive Summary

This addendum revises the matching engine architecture from the main implementation plan to enable:

- **Parallel Development**: API and matching engine development can proceed independently
- **Algorithm Experimentation**: Easy swapping of matching strategies without touching core API
- **Independent Testing**: Unit test matching logic without database/API dependencies
- **Future Extensibility**: Path to microservice extraction if needed post-MVP

**Key Changes**:
- NEW **Phase 4.5** (3 days): Matching Engine Foundation - runs parallel to Phases 2-3
- REVISED **Phase 5** (11 days): Matching Implementation against clean interfaces
- Total timeline remains 14 days but enables parallel work streams

---

## 1. Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NestJS API Layer                          │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  MatchesModule   │────────▶│  MatchesService  │              │
│  │  (HTTP Layer)    │         │  (Business Logic)│              │
│  └──────────────────┘         └────────┬─────────┘              │
│                                         │                         │
│                                         │ IMatchingEngine         │
│                                         │ (Interface)             │
│                                         ▼                         │
│              ┌──────────────────────────────────────┐            │
│              │      MatchingEngineModule            │            │
│              │  (Standalone, Injectable Module)     │            │
│              ├──────────────────────────────────────┤            │
│              │  MatchingEngineService               │            │
│              │  implements IMatchingEngine          │            │
│              ├──────────────────────────────────────┤            │
│              │  Strategy Pattern:                   │            │
│              │  ┌────────────────────────────────┐  │            │
│              │  │ IMatchingStrategy              │  │            │
│              │  ├────────────────────────────────┤  │            │
│              │  │ - VectorSimilarityStrategy     │  │            │
│              │  │ - CollaborativeFilterStrategy  │  │            │
│              │  └────────────────────────────────┘  │            │
│              │  ┌────────────────────────────────┐  │            │
│              │  │ IFilterStrategy                │  │            │
│              │  ├────────────────────────────────┤  │            │
│              │  │ - PriorMatchesFilter           │  │            │
│              │  │ - BlockedUsersFilter           │  │            │
│              │  │ - SameOrgFilter                │  │            │
│              │  │ - CompositeFilterStrategy      │  │            │
│              │  └────────────────────────────────┘  │            │
│              │  ┌────────────────────────────────┐  │            │
│              │  │ IRankingStrategy               │  │            │
│              │  ├────────────────────────────────┤  │            │
│              │  │ - DiversityRankingStrategy     │  │            │
│              │  │ - RecencyRankingStrategy       │  │            │
│              │  └────────────────────────────────┘  │            │
│              └──────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Prisma ORM
                               ▼
                    ┌───────────────────────┐
                    │  PostgreSQL + pgvector│
                    └───────────────────────┘
```

### Core Principles

1. **Interface-First Design**: All components interact through TypeScript interfaces
2. **Strategy Pattern**: Pluggable algorithms for similarity, filtering, and ranking
3. **Dependency Injection**: NestJS DI enables easy mocking and testing
4. **Single Responsibility**: Each strategy handles one concern
5. **Open/Closed Principle**: Add new strategies without modifying existing code

### Why This Matters

**For MVP**:
- API team can develop endpoints using mock engine while algorithm team builds real engine
- Each strategy (filtering, ranking, similarity) can be unit tested independently
- Easy to experiment with different similarity thresholds or ranking weights

**Post-MVP**:
- Swap vector similarity for collaborative filtering without API changes
- Extract matching engine to separate microservice by implementing same interface over HTTP
- A/B test different matching algorithms by toggling strategies via config

---

## 2. Interface Definitions

### Core Matching Engine Interface

```typescript
// src/matching/interfaces/matching-engine.interface.ts

/**
 * Primary contract for the matching engine.
 * Any implementation (in-process, microservice, third-party) must satisfy this interface.
 */
export interface IMatchingEngine {
  /**
   * Generate matches for a single user.
   * @param request - User ID and matching parameters
   * @returns Ranked list of match candidates with scores
   */
  generateMatches(request: GenerateMatchesRequest): Promise<GenerateMatchesResponse>;

  /**
   * Batch generate matches for multiple users (e.g., nightly job).
   * @param userIds - List of user IDs to generate matches for
   * @param options - Batch processing options
   * @returns Summary of matches generated per user
   */
  generateBatchMatches(
    userIds: string[],
    options?: BatchMatchOptions,
  ): Promise<BatchMatchResult>;

  /**
   * Health check for matching engine (e.g., vector index status).
   */
  healthCheck(): Promise<MatchingEngineHealthStatus>;
}

/**
 * Request payload for single-user match generation.
 */
export interface GenerateMatchesRequest {
  userId: string;
  limit?: number; // Max matches to return (default: 5)
  minSimilarityScore?: number; // Threshold for similarity (default: 0.7)
  diversityWeight?: number; // Weight for diversity vs similarity (default: 0.3)
}

/**
 * Response containing ranked match candidates.
 */
export interface GenerateMatchesResponse {
  userId: string;
  matches: MatchCandidate[];
  metadata: {
    totalCandidatesConsidered: number;
    totalFiltered: number;
    processingTimeMs: number;
  };
}

/**
 * A single match candidate with scoring details.
 */
export interface MatchCandidate {
  candidateUserId: string;
  similarityScore: number; // 0-1, from vector similarity
  diversityScore: number; // 0-1, from re-ranking
  finalScore: number; // Weighted combination
  reasons: string[]; // Explainability: ["Similar values", "Different backgrounds"]
}

/**
 * Options for batch matching.
 */
export interface BatchMatchOptions {
  batchSize?: number; // Process N users at a time (default: 100)
  parallelism?: number; // Number of concurrent workers (default: 5)
}

/**
 * Result summary for batch matching.
 */
export interface BatchMatchResult {
  totalUsersProcessed: number;
  totalMatchesGenerated: number;
  failures: Array<{ userId: string; error: string }>;
  durationMs: number;
}

/**
 * Health status for matching engine.
 */
export interface MatchingEngineHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    vectorIndexReady: boolean;
    databaseConnected: boolean;
    lastSuccessfulMatch?: Date;
  };
}
```

### Strategy Interfaces

```typescript
// src/matching/interfaces/matching-strategy.interface.ts

/**
 * Strategy for computing similarity between two users.
 * Implementations: vector similarity, collaborative filtering, hybrid.
 */
export interface IMatchingStrategy {
  /**
   * Compute similarity score between source user and candidate users.
   * @param sourceUserId - The user to generate matches for
   * @param candidateUserIds - Pool of potential matches
   * @returns Map of candidateUserId -> similarity score (0-1)
   */
  computeSimilarity(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<Map<string, number>>;

  /**
   * Strategy name for logging/debugging.
   */
  getName(): string;
}

// src/matching/interfaces/filter-strategy.interface.ts

/**
 * Strategy for filtering out invalid match candidates.
 * Implementations: prior matches, blocked users, same org, etc.
 */
export interface IFilterStrategy {
  /**
   * Filter candidates based on business rules.
   * @param sourceUserId - The user to generate matches for
   * @param candidateUserIds - Pool of potential matches
   * @returns Filtered list of candidate user IDs
   */
  filter(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<string[]>;

  /**
   * Strategy name for logging/debugging.
   */
  getName(): string;
}

// src/matching/interfaces/ranking-strategy.interface.ts

/**
 * Strategy for re-ranking match candidates.
 * Implementations: diversity re-ranking, recency boosting, etc.
 */
export interface IRankingStrategy {
  /**
   * Re-rank candidates based on additional criteria.
   * @param sourceUserId - The user to generate matches for
   * @param candidates - Initial candidates with similarity scores
   * @returns Re-ranked candidates with updated scores
   */
  rerank(
    sourceUserId: string,
    candidates: RankingCandidate[],
  ): Promise<RankingCandidate[]>;

  /**
   * Strategy name for logging/debugging.
   */
  getName(): string;
}

/**
 * Candidate representation for ranking.
 */
export interface RankingCandidate {
  userId: string;
  similarityScore: number;
  diversityScore?: number;
  finalScore?: number;
  metadata?: Record<string, any>; // For strategy-specific data
}
```

---

## 3. Implementation Approach

### Folder Structure

```
backend/src/matching/
├── matching.module.ts                 # NestJS module definition
├── services/
│   └── matching-engine.service.ts     # Main engine implementation
├── strategies/
│   ├── matching/
│   │   ├── vector-similarity.strategy.ts
│   │   └── collaborative-filter.strategy.ts (future)
│   ├── filtering/
│   │   ├── prior-matches.filter.ts
│   │   ├── blocked-users.filter.ts
│   │   ├── same-org.filter.ts
│   │   └── composite-filter.strategy.ts
│   └── ranking/
│       ├── diversity-ranking.strategy.ts
│       └── recency-ranking.strategy.ts (future)
├── interfaces/
│   ├── matching-engine.interface.ts
│   ├── matching-strategy.interface.ts
│   ├── filter-strategy.interface.ts
│   └── ranking-strategy.interface.ts
├── dto/
│   ├── generate-matches.dto.ts
│   └── batch-match.dto.ts
└── __tests__/
    ├── matching-engine.service.spec.ts
    ├── strategies/
    │   ├── vector-similarity.strategy.spec.ts
    │   ├── prior-matches.filter.spec.ts
    │   └── diversity-ranking.strategy.spec.ts
    └── mocks/
        └── mock-matching-engine.ts
```

### Key Files and Purposes

**`matching.module.ts`** - Module registration with DI:
```typescript
import { Module } from '@nestjs/common';
import { MatchingEngineService } from './services/matching-engine.service';
import { VectorSimilarityStrategy } from './strategies/matching/vector-similarity.strategy';
import { CompositeFilterStrategy } from './strategies/filtering/composite-filter.strategy';
import { DiversityRankingStrategy } from './strategies/ranking/diversity-ranking.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    MatchingEngineService,
    // Matching strategies
    {
      provide: 'MATCHING_STRATEGY',
      useClass: VectorSimilarityStrategy,
    },
    // Filter strategies (composed)
    {
      provide: 'FILTER_STRATEGY',
      useClass: CompositeFilterStrategy,
    },
    // Ranking strategies
    {
      provide: 'RANKING_STRATEGY',
      useClass: DiversityRankingStrategy,
    },
  ],
  exports: [MatchingEngineService], // Expose to MatchesModule
})
export class MatchingModule {}
```

**`services/matching-engine.service.ts`** - Main orchestrator:
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { IMatchingEngine, GenerateMatchesRequest, GenerateMatchesResponse } from '../interfaces/matching-engine.interface';
import { IMatchingStrategy } from '../interfaces/matching-strategy.interface';
import { IFilterStrategy } from '../interfaces/filter-strategy.interface';
import { IRankingStrategy } from '../interfaces/ranking-strategy.interface';

@Injectable()
export class MatchingEngineService implements IMatchingEngine {
  constructor(
    @Inject('MATCHING_STRATEGY') private matchingStrategy: IMatchingStrategy,
    @Inject('FILTER_STRATEGY') private filterStrategy: IFilterStrategy,
    @Inject('RANKING_STRATEGY') private rankingStrategy: IRankingStrategy,
  ) {}

  async generateMatches(request: GenerateMatchesRequest): Promise<GenerateMatchesResponse> {
    const startTime = Date.now();

    // Step 1: Get candidate pool (all users with embeddings except source)
    const allCandidates = await this.getCandidatePool(request.userId);

    // Step 2: Apply filters (prior matches, blocked, same org)
    const filteredCandidates = await this.filterStrategy.filter(
      request.userId,
      allCandidates,
    );

    // Step 3: Compute similarity scores
    const similarityScores = await this.matchingStrategy.computeSimilarity(
      request.userId,
      filteredCandidates,
    );

    // Step 4: Filter by minimum similarity threshold
    const candidates = Array.from(similarityScores.entries())
      .filter(([_, score]) => score >= (request.minSimilarityScore ?? 0.7))
      .map(([userId, score]) => ({
        userId,
        similarityScore: score,
      }));

    // Step 5: Re-rank for diversity
    const rankedCandidates = await this.rankingStrategy.rerank(
      request.userId,
      candidates,
    );

    // Step 6: Take top N
    const topMatches = rankedCandidates.slice(0, request.limit ?? 5);

    return {
      userId: request.userId,
      matches: topMatches.map(c => ({
        candidateUserId: c.userId,
        similarityScore: c.similarityScore,
        diversityScore: c.diversityScore ?? 0,
        finalScore: c.finalScore ?? c.similarityScore,
        reasons: this.generateReasons(c),
      })),
      metadata: {
        totalCandidatesConsidered: allCandidates.length,
        totalFiltered: allCandidates.length - filteredCandidates.length,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  private async getCandidatePool(sourceUserId: string): Promise<string[]> {
    // Implementation: query all users with embeddings except source
    return [];
  }

  private generateReasons(candidate: any): string[] {
    // Implementation: explain why this match was suggested
    return [];
  }
}
```

### Dependency Injection Setup

The matching engine is injected into the main API:

**`matches/matches.module.ts`** (API layer):
```typescript
import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchingModule } from '../matching/matching.module'; // Import modular engine

@Module({
  imports: [MatchingModule], // Dependency on matching engine
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
```

**`matches/matches.service.ts`** (Business logic):
```typescript
import { Injectable } from '@nestjs/common';
import { MatchingEngineService } from '../matching/services/matching-engine.service';

@Injectable()
export class MatchesService {
  constructor(
    private readonly matchingEngine: MatchingEngineService,
    private readonly prisma: PrismaService,
  ) {}

  async getMatchesForUser(userId: string) {
    // Generate fresh matches using engine
    const result = await this.matchingEngine.generateMatches({ userId });

    // Store matches in database
    await this.storeMatches(userId, result.matches);

    // Return to API
    return result.matches;
  }

  private async storeMatches(userId: string, matches: MatchCandidate[]) {
    // Implementation: insert into matches table
  }
}
```

### How Teams Work Concurrently

**API Team** (can start immediately after Phase 4.5):
- Uses `MockMatchingEngine` that returns dummy data
- Develops endpoints, validation, error handling
- Writes integration tests with mocked engine

**Algorithm Team** (Phase 4.5 + Phase 5):
- Implements real strategies against interfaces
- Unit tests each strategy independently
- No API dependencies required

**Integration** (End of Phase 5):
- Swap mock for real engine via DI config
- Run end-to-end tests
- Tune parameters (thresholds, weights)

---

## 4. Revised Phase Breakdown

### NEW: Phase 4.5 - Matching Engine Foundation

**Duration**: 3 days
**Status**: Pending
**Prerequisites**: None (can run parallel to Phases 2-3)
**Team**: Algorithm developers

#### Phase Overview

Create the matching engine module scaffold with all interfaces, mock implementations, and testing infrastructure. This phase enables parallel development: API team uses mock engine while algorithm team builds real strategies.

#### Deliverables

- ✅ Matching module structure created
- ✅ All TypeScript interfaces defined
- ✅ Mock matching engine for API development
- ✅ Unit test setup with example tests
- ✅ Strategy registration via DI configured
- ✅ Documentation for adding new strategies

---

#### Task 4.5.1: Create Module Scaffold (0.5 days)

**Files Created**:
- `src/matching/matching.module.ts`
- `src/matching/services/matching-engine.service.ts` (stub)
- `src/matching/interfaces/` (all interface files)

**Steps**:
1. Create folder structure as defined in Section 3
2. Generate NestJS module: `nest g module matching`
3. Create interface files with complete TypeScript definitions
4. Add JSDoc comments to all interfaces

**Acceptance Criteria**:
- Module compiles without errors
- All interfaces exported from module
- No implementation logic yet (stubs only)

---

#### Task 4.5.2: Define Complete TypeScript Interfaces (1 day)

**Files Created**:
- `src/matching/interfaces/matching-engine.interface.ts`
- `src/matching/interfaces/matching-strategy.interface.ts`
- `src/matching/interfaces/filter-strategy.interface.ts`
- `src/matching/interfaces/ranking-strategy.interface.ts`
- `src/matching/dto/generate-matches.dto.ts`
- `src/matching/dto/batch-match.dto.ts`

**Steps**:
1. Copy interface definitions from Section 2 of this addendum
2. Add class-validator decorators to DTOs for API validation
3. Add JSDoc comments with usage examples
4. Create barrel export: `src/matching/interfaces/index.ts`

**Example DTO**:
```typescript
// src/matching/dto/generate-matches.dto.ts
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class GenerateMatchesDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 5;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minSimilarityScore?: number = 0.7;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  diversityWeight?: number = 0.3;
}
```

**Acceptance Criteria**:
- All interfaces compile with strict TypeScript
- DTOs have validation decorators
- Barrel export allows: `import { IMatchingEngine } from '@matching/interfaces'`

---

#### Task 4.5.3: Implement Mock Matching Engine (1 day)

**Files Created**:
- `src/matching/__tests__/mocks/mock-matching-engine.ts`
- `src/matching/__tests__/mocks/mock-data.ts`

**Purpose**: Enable API team to develop endpoints without waiting for real algorithms.

**Implementation**:
```typescript
// src/matching/__tests__/mocks/mock-matching-engine.ts
import { Injectable } from '@nestjs/common';
import { IMatchingEngine, GenerateMatchesRequest, GenerateMatchesResponse } from '../../interfaces';

@Injectable()
export class MockMatchingEngine implements IMatchingEngine {
  async generateMatches(request: GenerateMatchesRequest): Promise<GenerateMatchesResponse> {
    // Return deterministic fake data
    return {
      userId: request.userId,
      matches: [
        {
          candidateUserId: 'mock-user-1',
          similarityScore: 0.92,
          diversityScore: 0.75,
          finalScore: 0.87,
          reasons: ['Similar values', 'Different backgrounds'],
        },
        {
          candidateUserId: 'mock-user-2',
          similarityScore: 0.88,
          diversityScore: 0.80,
          finalScore: 0.85,
          reasons: ['Complementary goals', 'Geographic diversity'],
        },
      ],
      metadata: {
        totalCandidatesConsidered: 100,
        totalFiltered: 50,
        processingTimeMs: 42,
      },
    };
  }

  async generateBatchMatches(userIds: string[]): Promise<any> {
    return {
      totalUsersProcessed: userIds.length,
      totalMatchesGenerated: userIds.length * 5,
      failures: [],
      durationMs: 1000,
    };
  }

  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      details: {
        vectorIndexReady: true,
        databaseConnected: true,
      },
    };
  }
}
```

**Acceptance Criteria**:
- Mock engine implements full interface
- Returns realistic-looking data
- Can be injected via DI: `{ provide: 'MATCHING_ENGINE', useClass: MockMatchingEngine }`

---

#### Task 4.5.4: Set Up Testing Infrastructure (0.5 days)

**Files Created**:
- `src/matching/__tests__/matching-engine.service.spec.ts`
- `src/matching/__tests__/setup.ts`
- `jest.config.js` (update if needed)

**Steps**:
1. Create example unit test for mock engine
2. Set up test utilities (e.g., `createTestingModule` helper)
3. Add test scripts to `package.json`:
   ```json
   {
     "scripts": {
       "test:matching": "jest --testPathPattern=matching",
       "test:matching:watch": "jest --watch --testPathPattern=matching"
     }
   }
   ```

**Example Test**:
```typescript
// src/matching/__tests__/matching-engine.service.spec.ts
import { Test } from '@nestjs/testing';
import { MockMatchingEngine } from './mocks/mock-matching-engine';

describe('MatchingEngineService', () => {
  let engine: MockMatchingEngine;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MockMatchingEngine],
    }).compile();

    engine = module.get(MockMatchingEngine);
  });

  it('should generate matches', async () => {
    const result = await engine.generateMatches({ userId: 'test-user' });
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0]).toHaveProperty('candidateUserId');
  });
});
```

**Acceptance Criteria**:
- `npm run test:matching` passes
- Test coverage setup for matching module
- CI can run matching tests independently

---

#### Task 4.5.5: Document Strategy Registration Pattern (0.5 days)

**Files Created**:
- `src/matching/README.md`

**Content**:
```markdown
# Matching Engine Module

## Adding a New Matching Strategy

1. Create file: `src/matching/strategies/matching/my-strategy.strategy.ts`
2. Implement `IMatchingStrategy` interface
3. Register in `matching.module.ts`:
   ```typescript
   {
     provide: 'MATCHING_STRATEGY',
     useClass: MyStrategy,
   }
   ```
4. Write unit tests in `__tests__/strategies/my-strategy.strategy.spec.ts`

## Adding a New Filter

1. Create file: `src/matching/strategies/filtering/my-filter.filter.ts`
2. Implement `IFilterStrategy` interface
3. Add to `CompositeFilterStrategy` constructor
4. Test independently

## Running Tests

- All tests: `npm run test:matching`
- Watch mode: `npm run test:matching:watch`
- Coverage: `npm run test:matching -- --coverage`
```

**Acceptance Criteria**:
- README explains how to add strategies
- Includes code examples
- Documents testing approach

---

#### Phase 4.5 Success Criteria

- ✅ Matching module compiles and passes linting
- ✅ All interfaces defined with full TypeScript types
- ✅ Mock engine available for API integration
- ✅ Unit tests passing (even if just testing mocks)
- ✅ Documentation complete
- ✅ **API team can begin Phase 6 work using mock engine**

---

### REVISED: Phase 5 - Matching Implementation

**Duration**: 11 days (reduced from 14 days due to parallel Phase 4.5)
**Status**: Pending
**Prerequisites**: Phase 4 (Embeddings) complete, Phase 4.5 complete
**Team**: Algorithm developers

#### Phase Overview

Implement production matching strategies against the interfaces from Phase 4.5. Each strategy is developed and tested independently, then integrated into the main engine. Focus on vector similarity for MVP, with hooks for future collaborative filtering.

#### Deliverables

- ✅ `VectorSimilarityStrategy` implementation with pgvector
- ✅ Three filter strategies (prior matches, blocked, same org)
- ✅ `DiversityRankingStrategy` implementation
- ✅ Real `MatchingEngineService` orchestrating strategies
- ✅ Batch matching job for nightly runs
- ✅ Integration with MatchesService (API layer)
- ✅ Comprehensive unit and integration tests
- ✅ Performance benchmarks and optimization

---

#### Task 5.1: Implement Vector Similarity Strategy (2 days)

**Files Created**:
- `src/matching/strategies/matching/vector-similarity.strategy.ts`
- `src/matching/__tests__/strategies/vector-similarity.strategy.spec.ts`

**Implementation**:
```typescript
// src/matching/strategies/matching/vector-similarity.strategy.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { IMatchingStrategy } from '../../interfaces/matching-strategy.interface';

@Injectable()
export class VectorSimilarityStrategy implements IMatchingStrategy {
  constructor(private prisma: PrismaService) {}

  async computeSimilarity(
    sourceUserId: string,
    candidateUserIds: string[],
  ): Promise<Map<string, number>> {
    // Step 1: Get source user's embedding
    const sourceUser = await this.prisma.user.findUnique({
      where: { id: sourceUserId },
      select: { embedding: true },
    });

    if (!sourceUser?.embedding) {
      throw new Error(`No embedding found for user ${sourceUserId}`);
    }

    // Step 2: Batch query pgvector for cosine similarity
    // Use parameterized query to avoid SQL injection
    const query = `
      SELECT
        id,
        1 - (embedding <=> $1::vector) AS similarity_score
      FROM users
      WHERE id = ANY($2::uuid[])
        AND embedding IS NOT NULL
      ORDER BY similarity_score DESC
    `;

    const results = await this.prisma.$queryRawUnsafe(
      query,
      JSON.stringify(sourceUser.embedding), // pgvector format: "[0.1, 0.2, ...]"
      candidateUserIds,
    );

    // Step 3: Convert to Map
    const scoreMap = new Map<string, number>();
    for (const row of results as any[]) {
      scoreMap.set(row.id, row.similarity_score);
    }

    return scoreMap;
  }

  getName(): string {
    return 'VectorSimilarityStrategy';
  }
}
```

**Unit Test**:
```typescript
// src/matching/__tests__/strategies/vector-similarity.strategy.spec.ts
import { Test } from '@nestjs/testing';
import { VectorSimilarityStrategy } from '../../strategies/matching/vector-similarity.strategy';
import { PrismaService } from '@prisma/prisma.service';

describe('VectorSimilarityStrategy', () => {
  let strategy: VectorSimilarityStrategy;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VectorSimilarityStrategy,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
            $queryRawUnsafe: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get(VectorSimilarityStrategy);
    prisma = module.get(PrismaService);
  });

  it('should compute cosine similarity', async () => {
    // Mock data
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
    } as any);

    jest.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([
      { id: 'candidate-1', similarity_score: 0.92 },
      { id: 'candidate-2', similarity_score: 0.88 },
    ]);

    const result = await strategy.computeSimilarity('source', ['candidate-1', 'candidate-2']);

    expect(result.get('candidate-1')).toBe(0.92);
    expect(result.get('candidate-2')).toBe(0.88);
  });

  it('should throw if source user has no embedding', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    await expect(
      strategy.computeSimilarity('source', ['candidate-1']),
    ).rejects.toThrow('No embedding found');
  });
});
```

**Acceptance Criteria**:
- Cosine similarity computed using pgvector `<=>` operator
- Handles users with missing embeddings gracefully
- Unit tests cover happy path and edge cases
- Performance: computes similarity for 100 candidates in <100ms

---

#### Task 5.2: Implement Filter Strategies (2 days)

**Files Created**:
- `src/matching/strategies/filtering/prior-matches.filter.ts`
- `src/matching/strategies/filtering/blocked-users.filter.ts`
- `src/matching/strategies/filtering/same-org.filter.ts`
- `src/matching/strategies/filtering/composite-filter.strategy.ts`
- Unit tests for each filter

**Prior Matches Filter**:
```typescript
// src/matching/strategies/filtering/prior-matches.filter.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';

@Injectable()
export class PriorMatchesFilter implements IFilterStrategy {
  constructor(private prisma: PrismaService) {}

  async filter(sourceUserId: string, candidateUserIds: string[]): Promise<string[]> {
    // Get all user IDs that have been matched with source user before
    const priorMatches = await this.prisma.match.findMany({
      where: {
        OR: [
          { userId: sourceUserId },
          { matchedUserId: sourceUserId },
        ],
      },
      select: {
        userId: true,
        matchedUserId: true,
      },
    });

    const priorUserIds = new Set<string>();
    for (const match of priorMatches) {
      priorUserIds.add(match.userId === sourceUserId ? match.matchedUserId : match.userId);
    }

    // Filter out prior matches
    return candidateUserIds.filter(id => !priorUserIds.has(id));
  }

  getName(): string {
    return 'PriorMatchesFilter';
  }
}
```

**Composite Filter** (chains all filters):
```typescript
// src/matching/strategies/filtering/composite-filter.strategy.ts
import { Injectable } from '@nestjs/common';
import { IFilterStrategy } from '../../interfaces/filter-strategy.interface';
import { PriorMatchesFilter } from './prior-matches.filter';
import { BlockedUsersFilter } from './blocked-users.filter';
import { SameOrgFilter } from './same-org.filter';

@Injectable()
export class CompositeFilterStrategy implements IFilterStrategy {
  constructor(
    private priorMatchesFilter: PriorMatchesFilter,
    private blockedUsersFilter: BlockedUsersFilter,
    private sameOrgFilter: SameOrgFilter,
  ) {}

  async filter(sourceUserId: string, candidateUserIds: string[]): Promise<string[]> {
    let filtered = candidateUserIds;

    // Apply filters sequentially
    filtered = await this.priorMatchesFilter.filter(sourceUserId, filtered);
    filtered = await this.blockedUsersFilter.filter(sourceUserId, filtered);
    filtered = await this.sameOrgFilter.filter(sourceUserId, filtered);

    return filtered;
  }

  getName(): string {
    return 'CompositeFilterStrategy';
  }
}
```

**Acceptance Criteria**:
- Each filter independently tested
- Composite filter applies all filters in sequence
- Filters handle empty candidate lists gracefully
- Performance: filters 1000 candidates in <200ms

---

#### Task 5.3: Implement Diversity Ranking Strategy (2 days)

**Files Created**:
- `src/matching/strategies/ranking/diversity-ranking.strategy.ts`
- `src/matching/__tests__/strategies/diversity-ranking.strategy.spec.ts`

**Implementation**:
```typescript
// src/matching/strategies/ranking/diversity-ranking.strategy.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { IRankingStrategy, RankingCandidate } from '../../interfaces/ranking-strategy.interface';

@Injectable()
export class DiversityRankingStrategy implements IRankingStrategy {
  constructor(private prisma: PrismaService) {}

  async rerank(
    sourceUserId: string,
    candidates: RankingCandidate[],
  ): Promise<RankingCandidate[]> {
    // Get source user's profile
    const sourceUser = await this.prisma.user.findUnique({
      where: { id: sourceUserId },
      include: { profile: true },
    });

    // Get candidate profiles
    const candidateProfiles = await this.prisma.profile.findMany({
      where: {
        userId: { in: candidates.map(c => c.userId) },
      },
    });

    const profileMap = new Map(candidateProfiles.map(p => [p.userId, p]));

    // Compute diversity scores based on:
    // 1. Different organization
    // 2. Different role
    // 3. Different geographic region
    const rankedCandidates = candidates.map(candidate => {
      const profile = profileMap.get(candidate.userId);
      let diversityScore = 0;

      if (profile) {
        if (profile.organization !== sourceUser.profile.organization) {
          diversityScore += 0.4;
        }
        if (profile.role !== sourceUser.profile.role) {
          diversityScore += 0.3;
        }
        if (profile.region !== sourceUser.profile.region) {
          diversityScore += 0.3;
        }
      }

      // Weighted final score: 70% similarity + 30% diversity
      const finalScore = 0.7 * candidate.similarityScore + 0.3 * diversityScore;

      return {
        ...candidate,
        diversityScore,
        finalScore,
      };
    });

    // Sort by final score descending
    return rankedCandidates.sort((a, b) => b.finalScore - a.finalScore);
  }

  getName(): string {
    return 'DiversityRankingStrategy';
  }
}
```

**Acceptance Criteria**:
- Diversity score computed from profile differences
- Final score is weighted combination (configurable)
- Candidates re-sorted by final score
- Unit tests verify scoring logic

---

#### Task 5.4: Implement Real Matching Engine Service (2 days)

**Files Modified**:
- `src/matching/services/matching-engine.service.ts` (replace stub with real implementation)

**Steps**:
1. Copy skeleton from Section 3 of this addendum
2. Implement `getCandidatePool()` using Prisma query
3. Implement `generateReasons()` based on profile similarities
4. Add error handling and logging
5. Implement `generateBatchMatches()` with parallel processing

**Batch Matching Implementation**:
```typescript
async generateBatchMatches(
  userIds: string[],
  options?: BatchMatchOptions,
): Promise<BatchMatchResult> {
  const batchSize = options?.batchSize ?? 100;
  const parallelism = options?.parallelism ?? 5;

  const results = {
    totalUsersProcessed: 0,
    totalMatchesGenerated: 0,
    failures: [],
    durationMs: 0,
  };

  const startTime = Date.now();

  // Process in batches with controlled parallelism
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    // Process batch with limited concurrency
    const promises = batch.map(userId =>
      this.generateMatches({ userId, limit: 5 })
        .then(result => {
          results.totalUsersProcessed++;
          results.totalMatchesGenerated += result.matches.length;
          return { success: true };
        })
        .catch(error => {
          results.failures.push({ userId, error: error.message });
          return { success: false };
        }),
    );

    // Wait for batch to complete
    await Promise.all(promises);
  }

  results.durationMs = Date.now() - startTime;
  return results;
}
```

**Acceptance Criteria**:
- Real engine orchestrates all strategies correctly
- Error handling for missing embeddings
- Batch matching processes users in parallel
- Integration test with real Prisma (test database)

---

#### Task 5.5: Create Batch Matching Job (1 day)

**Files Created**:
- `src/matching/jobs/batch-match.processor.ts`
- `src/matching/jobs/batch-match.scheduler.ts`

**Implementation**:
```typescript
// src/matching/jobs/batch-match.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MatchingEngineService } from '../services/matching-engine.service';
import { PrismaService } from '@prisma/prisma.service';

@Processor('batch-matching')
export class BatchMatchProcessor extends WorkerHost {
  constructor(
    private matchingEngine: MatchingEngineService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    // Get all users who need matches (have embeddings, not recently matched)
    const usersNeedingMatches = await this.prisma.user.findMany({
      where: {
        embedding: { not: null },
        lastMatchedAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Not matched in last 24h
        },
      },
      select: { id: true },
    });

    const userIds = usersNeedingMatches.map(u => u.id);
    job.log(`Processing batch matches for ${userIds.length} users`);

    // Generate matches
    const result = await this.matchingEngine.generateBatchMatches(userIds, {
      batchSize: 50,
      parallelism: 5,
    });

    // Store matches in database
    await this.storeGeneratedMatches(result);

    return result;
  }

  private async storeGeneratedMatches(result: any) {
    // Implementation: bulk insert matches
  }
}
```

**Scheduler** (nightly cron job):
```typescript
// src/matching/jobs/batch-match.scheduler.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BatchMatchScheduler {
  constructor(@InjectQueue('batch-matching') private queue: Queue) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM) // Run at 2 AM daily
  async scheduleBatchMatching() {
    await this.queue.add('generate-batch-matches', {
      timestamp: new Date(),
    });
  }
}
```

**Acceptance Criteria**:
- Job processes all users with embeddings
- Runs on schedule (2 AM daily)
- Stores generated matches in database
- Logs progress and errors
- Can be manually triggered via Bull Board

---

#### Task 5.6: Integrate with Matches API (1 day)

**Files Modified**:
- `src/matches/matches.service.ts`
- `src/matches/matches.module.ts`

**Steps**:
1. Replace `MockMatchingEngine` with real `MatchingEngineService` in DI
2. Update `MatchesService.getMatchesForUser()` to use real engine
3. Add caching (Redis) for match results
4. Add logging and monitoring

**Updated MatchesService**:
```typescript
// src/matches/matches.service.ts
import { Injectable, CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { MatchingEngineService } from '../matching/services/matching-engine.service';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class MatchesService {
  constructor(
    private matchingEngine: MatchingEngineService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async getMatchesForUser(userId: string) {
    // Check cache first
    const cacheKey = `matches:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // Generate fresh matches
    const result = await this.matchingEngine.generateMatches({ userId, limit: 5 });

    // Store in database
    await this.storeMatches(userId, result.matches);

    // Cache for 1 hour
    await this.cache.set(cacheKey, result.matches, 3600);

    return result.matches;
  }

  private async storeMatches(userId: string, matches: any[]) {
    // Bulk insert matches with expiration
    const matchRecords = matches.map(m => ({
      userId,
      matchedUserId: m.candidateUserId,
      similarityScore: m.similarityScore,
      diversityScore: m.diversityScore,
      finalScore: m.finalScore,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }));

    await this.prisma.match.createMany({
      data: matchRecords,
      skipDuplicates: true,
    });
  }
}
```

**Acceptance Criteria**:
- API returns real matches from matching engine
- Matches cached to avoid recomputation
- Matches stored with 7-day expiration
- Integration test: end-to-end match generation

---

#### Task 5.7: Write Comprehensive Tests (1 day)

**Files Created**:
- `src/matching/__tests__/integration/matching-engine.integration.spec.ts`
- `src/matching/__tests__/e2e/batch-matching.e2e.spec.ts`

**Integration Test** (with test database):
```typescript
// src/matching/__tests__/integration/matching-engine.integration.spec.ts
import { Test } from '@nestjs/testing';
import { MatchingEngineService } from '../../services/matching-engine.service';
import { PrismaService } from '@prisma/prisma.service';
import { MatchingModule } from '../../matching.module';

describe('MatchingEngine Integration', () => {
  let engine: MatchingEngineService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [MatchingModule],
    }).compile();

    engine = module.get(MatchingEngineService);
    prisma = module.get(PrismaService);

    // Seed test database with users and embeddings
    await seedTestData(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should generate matches end-to-end', async () => {
    const result = await engine.generateMatches({
      userId: 'test-user-1',
      limit: 3,
    });

    expect(result.matches.length).toBeLessThanOrEqual(3);
    expect(result.matches[0].similarityScore).toBeGreaterThan(0.7);
    expect(result.metadata.processingTimeMs).toBeLessThan(500);
  });

  it('should filter out prior matches', async () => {
    // Create a prior match
    await prisma.match.create({
      data: {
        userId: 'test-user-1',
        matchedUserId: 'test-user-2',
      },
    });

    const result = await engine.generateMatches({ userId: 'test-user-1' });

    // test-user-2 should not appear in results
    expect(result.matches.every(m => m.candidateUserId !== 'test-user-2')).toBe(true);
  });
});
```

**E2E Test** (batch job):
```typescript
// src/matching/__tests__/e2e/batch-matching.e2e.spec.ts
import { Test } from '@nestjs/testing';
import { BatchMatchProcessor } from '../../jobs/batch-match.processor';
import { Job } from 'bullmq';

describe('Batch Matching E2E', () => {
  let processor: BatchMatchProcessor;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [BatchMatchProcessor],
    }).compile();

    processor = module.get(BatchMatchProcessor);
    await seedTestData();
  });

  it('should process batch job successfully', async () => {
    const mockJob = { log: jest.fn() } as unknown as Job;

    const result = await processor.process(mockJob);

    expect(result.totalUsersProcessed).toBeGreaterThan(0);
    expect(result.failures.length).toBe(0);
  });
});
```

**Acceptance Criteria**:
- Unit tests: 90%+ coverage for all strategies
- Integration tests: end-to-end matching flow
- E2E tests: batch job execution
- Performance tests: benchmark query times

---

#### Task 5.8: Performance Optimization (1 day)

**Focus Areas**:
1. Add database indexes for common queries
2. Optimize pgvector query with HNSW index
3. Batch database queries where possible
4. Profile and optimize slow paths

**Migrations**:
```sql
-- Add HNSW index for faster vector similarity
CREATE INDEX idx_users_embedding_hnsw
ON users USING hnsw (embedding vector_cosine_ops);

-- Add indexes for filtering
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_matched_user_id ON matches(matched_user_id);
CREATE INDEX idx_blocked_users_composite ON blocked_users(blocker_id, blocked_id);
```

**Acceptance Criteria**:
- Vector similarity query: <50ms for 1000 candidates
- Full match generation: <200ms end-to-end
- Batch matching: processes 1000 users in <5 minutes
- Load test: handles 100 concurrent match requests

---

#### Phase 5 Success Criteria

- ✅ All strategies implemented and tested independently
- ✅ Real matching engine generates high-quality matches
- ✅ Filters correctly exclude invalid candidates
- ✅ Diversity re-ranking improves match variety
- ✅ Batch job runs nightly and processes all users
- ✅ API integration complete (mock swapped for real engine)
- ✅ Unit test coverage >90%
- ✅ Integration tests pass
- ✅ Performance benchmarks met (<200ms match generation)
- ✅ **Ready for Phase 6 (Double Opt-In Flow)**

---

## 5. Parallel Development Plan

### Dependency Graph

```
Phase 1 (Foundation)
    │
    ├──▶ Phase 2 (Auth) ──────────┐
    │                              │
    ├──▶ Phase 3 (Onboarding) ────┤
    │                              │
    ├──▶ Phase 4 (Embeddings) ────┤
    │                              │
    └──▶ Phase 4.5 (Matching Foundation) [PARALLEL]
              │                    │
              │                    │
              ▼                    │
         Phase 5 (Matching Implementation)
                                   │
                                   ▼
                            Phase 6 (Double Opt-In)
                                   │
                                   ▼
                            Phase 7 (Deployment)
```

### Work Streams

**Stream 1: API Development** (can start after Phase 4.5 Task 3)
- Uses `MockMatchingEngine` for endpoint development
- Develops:
  - `GET /api/matches` endpoint
  - `POST /api/matches/:id/accept` endpoint
  - `POST /api/matches/:id/pass` endpoint
- Writes API tests with mocked engine
- Ready to integrate real engine when Phase 5 completes

**Stream 2: Algorithm Development** (Phase 4.5 → Phase 5)
- Builds real matching strategies
- Unit tests each strategy independently
- No dependency on API or frontend
- Delivers working engine to Stream 1

**Stream 3: Frontend Development** (can continue independently)
- Frontend already complete
- Can integrate with API endpoints as they become available

### Mock Implementation for Early Integration

```typescript
// src/matching/matching.module.ts (development config)
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchingEngineService } from './services/matching-engine.service';
import { MockMatchingEngine } from './__tests__/mocks/mock-matching-engine';

@Module({
  providers: [
    {
      provide: 'MATCHING_ENGINE',
      useFactory: (config: ConfigService) => {
        // Use mock in development until real engine ready
        if (config.get('USE_MOCK_MATCHING_ENGINE') === 'true') {
          return new MockMatchingEngine();
        }
        return new MatchingEngineService(/* ... */);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['MATCHING_ENGINE'],
})
export class MatchingModule {}
```

Set in `.env.development`:
```
USE_MOCK_MATCHING_ENGINE=true
```

### Timeline with Parallelization

**Week 5** (Phase 4 + Phase 4.5 start):
- Day 1-3: Phase 4.5 Tasks 1-3 (Foundation + Mock)
- Days 4-7: Phase 4 continues (Embeddings)

**Week 6** (Phase 5 + API dev):
- Stream 1 (API): Develops endpoints with mock engine (3 days)
- Stream 2 (Algorithm): Tasks 5.1-5.3 (Strategies) (6 days)

**Week 7** (Phase 5 completion):
- Stream 2: Tasks 5.4-5.8 (Integration + Tests) (5 days)
- Stream 1: Integrates real engine (1 day)
- Combined: End-to-end testing (1 day)

**Result**: Phase 5 completes in 11 days instead of 14, with higher confidence due to independent testing.

---

## 6. Testing & Migration Path

### Unit Testing Strategy

**Test Each Strategy Independently**:

```typescript
// Example: Test filter without database
describe('PriorMatchesFilter', () => {
  let filter: PriorMatchesFilter;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = createMockPrisma();
    filter = new PriorMatchesFilter(prisma);
  });

  it('should filter out prior matches', async () => {
    // Mock database to return prior match
    prisma.match.findMany.mockResolvedValue([
      { userId: 'source', matchedUserId: 'candidate-1' },
    ]);

    const result = await filter.filter('source', ['candidate-1', 'candidate-2']);

    expect(result).toEqual(['candidate-2']); // candidate-1 filtered out
  });
});
```

**Benefits**:
- Fast test execution (no database)
- Test edge cases easily
- Mock dependencies cleanly

### Integration Testing Approach

**Test Engine with Real Database** (test DB):

```typescript
describe('MatchingEngine Integration', () => {
  let engine: MatchingEngineService;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Connect to test database
    prisma = new PrismaService({ datasources: { db: { url: TEST_DATABASE_URL } } });
    engine = new MatchingEngineService(
      new VectorSimilarityStrategy(prisma),
      new CompositeFilterStrategy(/* ... */),
      new DiversityRankingStrategy(prisma),
    );
  });

  it('should generate matches end-to-end', async () => {
    // Seed test data
    await seedUsers(prisma, [
      { id: 'user-1', embedding: [0.1, 0.2, 0.3] },
      { id: 'user-2', embedding: [0.11, 0.21, 0.31] }, // Similar to user-1
      { id: 'user-3', embedding: [0.9, 0.8, 0.7] }, // Dissimilar
    ]);

    const result = await engine.generateMatches({ userId: 'user-1' });

    expect(result.matches[0].candidateUserId).toBe('user-2'); // Most similar
    expect(result.matches.every(m => m.candidateUserId !== 'user-3')).toBe(true);
  });
});
```

### Extracting to Microservice (Future)

When ready to extract matching engine to separate service:

**Step 1**: Create HTTP adapter implementing `IMatchingEngine`:

```typescript
// src/matching/adapters/http-matching-engine.adapter.ts
import { Injectable, HttpService } from '@nestjs/common';
import { IMatchingEngine, GenerateMatchesRequest, GenerateMatchesResponse } from '../interfaces';

@Injectable()
export class HttpMatchingEngineAdapter implements IMatchingEngine {
  constructor(private http: HttpService) {}

  async generateMatches(request: GenerateMatchesRequest): Promise<GenerateMatchesResponse> {
    const response = await this.http.post(
      'https://matching-service.example.com/generate',
      request,
    ).toPromise();

    return response.data;
  }

  // ... other methods
}
```

**Step 2**: Swap implementation via DI:

```typescript
// src/matching/matching.module.ts
@Module({
  providers: [
    {
      provide: 'MATCHING_ENGINE',
      useFactory: (config: ConfigService) => {
        if (config.get('MATCHING_ENGINE_MODE') === 'microservice') {
          return new HttpMatchingEngineAdapter(/* ... */);
        }
        return new MatchingEngineService(/* ... */);
      },
      inject: [ConfigService],
    },
  ],
})
export class MatchingModule {}
```

**Step 3**: Extract matching service to separate repo/container:
- Create standalone NestJS app with matching module
- Expose HTTP endpoints
- Deploy separately
- Update config: `MATCHING_ENGINE_MODE=microservice`

**Zero code changes required in API layer** - interface abstraction enables this.

### Migration Checklist

When moving from Phase 4.5 to Phase 5:

- [ ] All Phase 4.5 unit tests passing
- [ ] Mock engine validated with API team
- [ ] API endpoints developed using mock
- [ ] Real strategies implementation begins
- [ ] Unit tests written for each strategy
- [ ] Integration tests pass with test database
- [ ] Performance benchmarks met
- [ ] Mock engine swapped for real engine in DI config
- [ ] End-to-end tests pass
- [ ] Production deployment with real engine

---

## Appendix: Quick Reference

### Adding a New Strategy

**Matching Strategy**:
```bash
# 1. Create file
touch src/matching/strategies/matching/my-strategy.strategy.ts

# 2. Implement IMatchingStrategy
# 3. Register in matching.module.ts
# 4. Write tests

# 5. Swap in module
providers: [
  { provide: 'MATCHING_STRATEGY', useClass: MyStrategy },
]
```

**Filter Strategy**:
```bash
# 1. Create file
touch src/matching/strategies/filtering/my-filter.filter.ts

# 2. Implement IFilterStrategy
# 3. Add to CompositeFilterStrategy constructor
# 4. Test independently
```

### Performance Targets

| Metric | Target | Test Command |
|--------|--------|--------------|
| Vector similarity (100 candidates) | <50ms | `npm run benchmark:similarity` |
| Full match generation | <200ms | `npm run benchmark:matching` |
| Batch processing (1000 users) | <5min | `npm run test:batch -- --timeout=600000` |
| API endpoint `/api/matches` | <500ms | `npm run test:e2e -- matches.e2e.spec.ts` |

### Key Files Reference

| File | Purpose |
|------|---------|
| `src/matching/matching.module.ts` | DI configuration |
| `src/matching/services/matching-engine.service.ts` | Main orchestrator |
| `src/matching/interfaces/matching-engine.interface.ts` | Primary contract |
| `src/matching/strategies/matching/vector-similarity.strategy.ts` | MVP similarity algorithm |
| `src/matching/strategies/filtering/composite-filter.strategy.ts` | Combines all filters |
| `src/matching/strategies/ranking/diversity-ranking.strategy.ts` | Re-ranking logic |
| `src/matching/__tests__/mocks/mock-matching-engine.ts` | Mock for API dev |

---

**End of Addendum**

This addendum revises the matching engine architecture to be modular, testable, and independently developable. The new Phase 4.5 enables parallel work streams, while revised Phase 5 focuses on implementing production strategies against clean interfaces. Total timeline remains ~14 days but with higher quality and flexibility.
