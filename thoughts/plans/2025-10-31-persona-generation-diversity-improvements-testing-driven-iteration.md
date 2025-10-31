---
doc_type: plan
date: 2025-10-31T11:51:09+00:00
title: "Persona Generation Diversity Improvements - Testing-Driven Iteration"
feature: "AI Persona Generation Diversity"
plan_reference: thoughts/research/2025-10-31-persona-generation-diversity-improvements-research.md

# Update phase status as implementation progresses
phases:
  - name: "Phase 1: Diversity Testing Infrastructure"
    status: pending
  - name: "Phase 2: Baseline Metrics Establishment"
    status: pending
  - name: "Phase 3: Iterative Improvements"
    status: pending
  - name: "Phase 4: Validation and Production Deployment"
    status: pending

git_commit: 113ff9809f1c28ab78b9150035270a3c9c300804
branch: main
repository: workspace

created_by: Sean Kim
last_updated: 2025-10-31
last_updated_by: Sean Kim

tags:
  - ai
  - testing
  - diversity
  - personas
  - iteration
status: draft

related_docs:
  - thoughts/research/2025-10-31-persona-generation-diversity-improvements-research.md
  - thoughts/plans/2025-10-31-persona-diversity-testing-framework.md
---

# Implementation Plan: Persona Generation Diversity Improvements (Testing-Driven)

## Executive Summary

This plan establishes a systematic, metrics-driven approach to improving persona generation diversity through iterative testing. Rather than making blind improvements, we will first build testing infrastructure, measure baseline performance, then iterate with quantitative validation at each step.

## Problem Statement

Current persona generation produces overly clustered results despite using temperature=1.0 and anti-pattern tracking:

- **Within-persona similarity**: ~0.92 (very high clustering)
- **Between-persona similarity**: ~0.20 (shows diversity is possible, but not achieved)
- **Symptom**: Similar tone, writing style, sentence structures across generated personas
- **Impact**: Weak test data for matching algorithm validation, less robust embedding-based matching

## Solution Approach

**Testing-First Development**: Build measurement infrastructure before improvements, then iterate systematically:

1. **Phase 1**: Create fast, reliable diversity testing tools
2. **Phase 2**: Establish quantitative baseline with current system
3. **Phase 3**: Implement improvements iteratively with testing after each change
4. **Phase 4**: Validate and deploy to production

## Success Metrics

### Quantitative Targets

| Metric | Current (Estimated) | Minimum Viable | Target | Aspirational |
|--------|---------------------|----------------|--------|--------------|
| Avg Pairwise Similarity | 0.70-0.85 | < 0.50 | < 0.40 | < 0.30 |
| Clustered Pairs (>0.85) | 20-40% | < 10% | < 5% | < 2% |
| Diversity Score (D) | 0.30-0.45 | > 0.60 | > 0.70 | > 0.80 |
| Trigram Diversity | 0.65-0.75 | > 0.75 | > 0.80 | > 0.85 |
| Topic Entropy | 2.5-3.0 | > 3.0 | > 3.5 | > 3.8 |

### Qualitative Validation

- Personas feel like different people (not single "AI voice")
- Variety in tone, style, and depth
- Natural language that doesn't sound template-generated
- Useful for testing edge cases in matching algorithm

---

## Phase 1: Diversity Testing Infrastructure

**Goal**: Build fast, reliable testing tools for measuring persona diversity

**Duration**: 5-7 days

**Dependencies**: None

### 1.1 Create Testing Module Structure

**New Directory Structure**:
```
grove-backend/src/dev/
  ├── diversity-testing/
  │   ├── diversity-testing.module.ts
  │   ├── diversity-testing.service.ts
  │   ├── diversity-testing.controller.ts
  │   ├── analyzers/
  │   │   ├── embedding-similarity.analyzer.ts
  │   │   ├── length-distribution.analyzer.ts
  │   │   ├── ngram-repetition.analyzer.ts
  │   │   ├── cluster-analysis.analyzer.ts (Phase 3)
  │   │   └── topic-diversity.analyzer.ts (Phase 3)
  │   ├── dto/
  │   │   ├── diversity-metrics.dto.ts
  │   │   ├── analyze-request.dto.ts
  │   │   └── comparison-request.dto.ts
  │   ├── storage/
  │   │   └── metrics-storage.service.ts
  │   └── utils/
  │       ├── math.utils.ts (cosine similarity, std dev, etc.)
  │       └── text.utils.ts (n-gram extraction, etc.)
```

**Implementation Steps**:

1. **Create module** (`diversity-testing.module.ts`):
   ```typescript
   @Module({
     imports: [PrismaModule, OpenaiModule],
     controllers: [DiversityTestingController],
     providers: [
       DiversityTestingService,
       EmbeddingSimilarityAnalyzer,
       LengthDistributionAnalyzer,
       NgramRepetitionAnalyzer,
       MetricsStorageService,
     ],
     exports: [DiversityTestingService],
   })
   export class DiversityTestingModule {}
   ```

2. **Register in app.module.ts**:
   ```typescript
   @Module({
     imports: [
       // ... existing imports
       DiversityTestingModule,
     ],
   })
   ```

**Time Estimate**: 1 day

**Success Criteria**:
- Module compiles without errors
- Module registered in app
- Directory structure created

### 1.2 Implement Math Utilities

**File**: `/workspace/grove-backend/src/dev/diversity-testing/utils/math.utils.ts`

**Functions to Implement**:

```typescript
/**
 * Calculate cosine similarity between two vectors
 * @returns number between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

/**
 * Calculate mean of array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  return Math.sqrt(mean(squaredDiffs));
}

/**
 * Calculate min, max, median
 */
export function min(values: number[]): number {
  return Math.min(...values);
}

export function max(values: number[]): number {
  return Math.max(...values);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate percentile
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate Shannon entropy
 * Measures information diversity in a distribution
 */
export function shannonEntropy(counts: number[]): number {
  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return 0;

  return -counts
    .filter(c => c > 0)
    .map(c => {
      const p = c / total;
      return p * Math.log2(p);
    })
    .reduce((sum, val) => sum + val, 0);
}
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- All functions have unit tests
- Tests pass with edge cases (empty arrays, single elements, etc.)
- TypeScript types are correct

### 1.3 Implement Text Utilities

**File**: `/workspace/grove-backend/src/dev/diversity-testing/utils/text.utils.ts`

```typescript
/**
 * Extract n-grams from text
 */
export function extractNgrams(text: string, n: number): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 0);

  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }

  return ngrams;
}

/**
 * Extract trigrams (3-word sequences)
 */
export function extractTrigrams(text: string): string[] {
  return extractNgrams(text, 3);
}

/**
 * Count n-gram occurrences
 */
export function countNgrams(ngrams: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ngram of ngrams) {
    counts.set(ngram, (counts.get(ngram) || 0) + 1);
  }
  return counts;
}

/**
 * Get top N most frequent n-grams
 */
export function getTopNgrams(
  counts: Map<string, number>,
  n: number
): Array<{ ngram: string; count: number }> {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([ngram, count]) => ({ ngram, count }));
}

/**
 * Extract keywords (simple version - words > 4 chars)
 */
export function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4);

  return new Set(words);
}
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- Functions work with various text inputs
- Edge cases handled (empty strings, single words, etc.)

### 1.4 Implement DTOs

**File**: `/workspace/grove-backend/src/dev/diversity-testing/dto/diversity-metrics.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class SimilarityMetricsDto {
  @ApiProperty({ description: 'Average pairwise cosine similarity (0-1, lower = more diverse)' })
  avgPairwiseSimilarity: number;

  @ApiProperty({ description: 'Minimum similarity score' })
  minSimilarity: number;

  @ApiProperty({ description: 'Maximum similarity score' })
  maxSimilarity: number;

  @ApiProperty({ description: 'Median similarity score' })
  medianSimilarity: number;

  @ApiProperty({ description: 'Standard deviation of similarities' })
  similarityStdDev: number;

  @ApiProperty({ description: 'Number of highly clustered pairs (similarity > 0.85)' })
  clusteredPairs: number;

  @ApiProperty({ description: 'Total number of pairs analyzed' })
  totalPairs: number;

  @ApiProperty({ description: 'Percentage of pairs that are clustered' })
  clusterPercentage: number;

  @ApiProperty({ description: 'Pass/fail based on target metrics' })
  passed: boolean;
}

export class LengthMetricsDto {
  @ApiProperty()
  avgLength: number;

  @ApiProperty()
  minLength: number;

  @ApiProperty()
  maxLength: number;

  @ApiProperty()
  medianLength: number;

  @ApiProperty()
  stdDev: number;

  @ApiProperty()
  distribution: {
    brief: number;      // < 100 chars (%)
    short: number;      // 100-200 chars (%)
    medium: number;     // 200-300 chars (%)
    long: number;       // 300-400 chars (%)
    veryLong: number;   // > 400 chars (%)
  };

  @ApiProperty()
  passed: boolean;
}

export class NgramMetricsDto {
  @ApiProperty()
  uniqueTrigrams: number;

  @ApiProperty()
  totalTrigrams: number;

  @ApiProperty({ description: 'Ratio of unique to total (higher = better)' })
  trigramDiversity: number;

  @ApiProperty()
  top10RepeatedTrigrams: Array<{
    trigram: string;
    count: number;
  }>;

  @ApiProperty({ description: 'Number of trigrams repeated > 5 times' })
  highRepetitionCount: number;

  @ApiProperty()
  passed: boolean;
}

export class QuickDiversityMetricsDto {
  @ApiProperty()
  personaCount: number;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  similarity: SimilarityMetricsDto;

  @ApiProperty()
  length: LengthMetricsDto;

  @ApiProperty()
  ngrams: NgramMetricsDto;

  @ApiProperty({ description: 'Overall pass/fail' })
  overallPassed: boolean;

  @ApiProperty({ description: 'Human-readable summary' })
  summary: string;
}
```

**File**: `/workspace/grove-backend/src/dev/diversity-testing/dto/analyze-request.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PersonaInputDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  interests: string;

  @ApiProperty()
  @IsString()
  project: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deepDive?: string;
}

export class AnalyzePersonasDto {
  @ApiProperty({ type: [PersonaInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonaInputDto)
  personas: PersonaInputDto[];

  @ApiProperty({ required: false, description: 'Optional batch ID for tracking' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty({ required: false, description: 'Store results for later comparison' })
  @IsOptional()
  saveResults?: boolean;
}
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- DTOs compile correctly
- Swagger documentation generated
- Validation decorators work

### 1.5 Implement Embedding Similarity Analyzer

**File**: `/workspace/grove-backend/src/dev/diversity-testing/analyzers/embedding-similarity.analyzer.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { OpenaiService } from '../../../openai/openai.service';
import { SimilarityMetricsDto } from '../dto/diversity-metrics.dto';
import { cosineSimilarity, mean, min, max, median, stdDev } from '../utils/math.utils';

interface PersonaInput {
  id: string;
  interests: string;
  project: string;
  deepDive?: string;
}

@Injectable()
export class EmbeddingSimilarityAnalyzer {
  private readonly logger = new Logger(EmbeddingSimilarityAnalyzer.name);

  constructor(private openaiService: OpenaiService) {}

  /**
   * Analyze embedding-based similarity between personas
   */
  async analyze(personas: PersonaInput[]): Promise<SimilarityMetricsDto> {
    this.logger.log(`Analyzing embedding similarity for ${personas.length} personas`);

    // 1. Generate embeddings for all personas
    const embeddings = await Promise.all(
      personas.map(async (p) => {
        const text = this.openaiService.preprocessProfileText(
          p.interests,
          p.project,
          p.deepDive
        );
        return this.openaiService.generateEmbedding(text);
      })
    );

    this.logger.debug(`Generated ${embeddings.length} embeddings`);

    // 2. Calculate pairwise cosine similarities
    const similarities: number[] = [];
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const sim = cosineSimilarity(embeddings[i], embeddings[j]);
        similarities.push(sim);
      }
    }

    this.logger.debug(`Calculated ${similarities.length} pairwise similarities`);

    // 3. Calculate metrics
    const avgSim = mean(similarities);
    const minSim = min(similarities);
    const maxSim = max(similarities);
    const medianSim = median(similarities);
    const stdDevSim = stdDev(similarities);
    const clusteredPairs = similarities.filter(s => s > 0.85).length;
    const totalPairs = similarities.length;
    const clusterPercentage = (clusteredPairs / totalPairs) * 100;

    // 4. Determine pass/fail (Target: avg < 0.40, clustered < 5%)
    const passed = avgSim < 0.40 && clusterPercentage < 5;

    this.logger.log(
      `Embedding analysis complete: avg=${avgSim.toFixed(3)}, ` +
      `clustered=${clusterPercentage.toFixed(1)}%, passed=${passed}`
    );

    return {
      avgPairwiseSimilarity: Number(avgSim.toFixed(4)),
      minSimilarity: Number(minSim.toFixed(4)),
      maxSimilarity: Number(maxSim.toFixed(4)),
      medianSimilarity: Number(medianSim.toFixed(4)),
      similarityStdDev: Number(stdDevSim.toFixed(4)),
      clusteredPairs,
      totalPairs,
      clusterPercentage: Number(clusterPercentage.toFixed(2)),
      passed,
    };
  }
}
```

**Time Estimate**: 1 day

**Success Criteria**:
- Analyzer generates embeddings correctly
- Similarity calculations are accurate
- Pass/fail logic works
- Performance is acceptable (< 10 seconds for 100 personas)

### 1.6 Implement Length Distribution Analyzer

**File**: `/workspace/grove-backend/src/dev/diversity-testing/analyzers/length-distribution.analyzer.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { LengthMetricsDto } from '../dto/diversity-metrics.dto';
import { mean, min, max, median, stdDev } from '../utils/math.utils';

interface PersonaInput {
  id: string;
  interests: string;
  project: string;
  deepDive?: string;
}

@Injectable()
export class LengthDistributionAnalyzer {
  private readonly logger = new Logger(LengthDistributionAnalyzer.name);

  analyze(personas: PersonaInput[]): LengthMetricsDto {
    this.logger.log(`Analyzing length distribution for ${personas.length} personas`);

    // Calculate total content length for each persona
    const lengths = personas.map(p => {
      const total = `${p.interests} ${p.project} ${p.deepDive || ''}`;
      return total.length;
    });

    // Calculate basic stats
    const avgLength = mean(lengths);
    const minLength = min(lengths);
    const maxLength = max(lengths);
    const medianLength = median(lengths);
    const stdDevLength = stdDev(lengths);

    // Calculate distribution buckets
    const brief = lengths.filter(l => l < 100).length / lengths.length;
    const short = lengths.filter(l => l >= 100 && l < 200).length / lengths.length;
    const medium = lengths.filter(l => l >= 200 && l < 300).length / lengths.length;
    const long = lengths.filter(l => l >= 300 && l < 400).length / lengths.length;
    const veryLong = lengths.filter(l => l >= 400).length / lengths.length;

    const distribution = {
      brief: Number((brief * 100).toFixed(1)),
      short: Number((short * 100).toFixed(1)),
      medium: Number((medium * 100).toFixed(1)),
      long: Number((long * 100).toFixed(1)),
      veryLong: Number((veryLong * 100).toFixed(1)),
    };

    // Pass criteria: stdDev > 50, distribution reasonably varied
    const passed = stdDevLength > 50;

    this.logger.log(
      `Length analysis complete: avg=${avgLength.toFixed(0)}, ` +
      `stdDev=${stdDevLength.toFixed(0)}, passed=${passed}`
    );

    return {
      avgLength: Number(avgLength.toFixed(1)),
      minLength,
      maxLength,
      medianLength: Number(medianLength.toFixed(1)),
      stdDev: Number(stdDevLength.toFixed(1)),
      distribution,
      passed,
    };
  }
}
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- Length calculations are accurate
- Distribution buckets work correctly
- Performance is fast (< 1 second for 100 personas)

### 1.7 Implement N-gram Repetition Analyzer

**File**: `/workspace/grove-backend/src/dev/diversity-testing/analyzers/ngram-repetition.analyzer.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { NgramMetricsDto } from '../dto/diversity-metrics.dto';
import { extractTrigrams, countNgrams, getTopNgrams } from '../utils/text.utils';

interface PersonaInput {
  id: string;
  interests: string;
  project: string;
  deepDive?: string;
}

@Injectable()
export class NgramRepetitionAnalyzer {
  private readonly logger = new Logger(NgramRepetitionAnalyzer.name);

  analyze(personas: PersonaInput[]): NgramMetricsDto {
    this.logger.log(`Analyzing n-gram repetition for ${personas.length} personas`);

    // Combine all persona text
    const allText = personas
      .map(p => `${p.interests} ${p.project} ${p.deepDive || ''}`)
      .join(' ');

    // Extract trigrams
    const trigrams = extractTrigrams(allText);
    const trigramCounts = countNgrams(trigrams);

    const uniqueTrigrams = trigramCounts.size;
    const totalTrigrams = trigrams.length;
    const trigramDiversity = totalTrigrams > 0 ? uniqueTrigrams / totalTrigrams : 0;

    // Get top 10 most repeated
    const top10 = getTopNgrams(trigramCounts, 10);

    // Count high-repetition trigrams (> 5 occurrences)
    const highRepetitionCount = Array.from(trigramCounts.values())
      .filter(count => count > 5).length;

    // Pass criteria: diversity > 0.80, no trigram repeated > 5 times
    const passed = trigramDiversity > 0.80 && highRepetitionCount === 0;

    this.logger.log(
      `N-gram analysis complete: diversity=${trigramDiversity.toFixed(3)}, ` +
      `highRep=${highRepetitionCount}, passed=${passed}`
    );

    return {
      uniqueTrigrams,
      totalTrigrams,
      trigramDiversity: Number(trigramDiversity.toFixed(4)),
      top10RepeatedTrigrams: top10,
      highRepetitionCount,
      passed,
    };
  }
}
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- Trigram extraction works correctly
- Counts are accurate
- Top 10 list is correct
- Performance is fast

### 1.8 Implement Diversity Testing Service

**File**: `/workspace/grove-backend/src/dev/diversity-testing/diversity-testing.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingSimilarityAnalyzer } from './analyzers/embedding-similarity.analyzer';
import { LengthDistributionAnalyzer } from './analyzers/length-distribution.analyzer';
import { NgramRepetitionAnalyzer } from './analyzers/ngram-repetition.analyzer';
import { MetricsStorageService } from './storage/metrics-storage.service';
import { QuickDiversityMetricsDto } from './dto/diversity-metrics.dto';
import { AnalyzePersonasDto } from './dto/analyze-request.dto';

@Injectable()
export class DiversityTestingService {
  private readonly logger = new Logger(DiversityTestingService.name);

  constructor(
    private embeddingAnalyzer: EmbeddingSimilarityAnalyzer,
    private lengthAnalyzer: LengthDistributionAnalyzer,
    private ngramAnalyzer: NgramRepetitionAnalyzer,
    private storageService: MetricsStorageService,
  ) {}

  /**
   * Run quick diversity metrics (Tier 1)
   */
  async analyzeQuick(dto: AnalyzePersonasDto): Promise<QuickDiversityMetricsDto> {
    const startTime = Date.now();
    this.logger.log(`Starting quick diversity analysis for ${dto.personas.length} personas`);

    // Run all analyzers in parallel for speed
    const [similarity, length, ngrams] = await Promise.all([
      this.embeddingAnalyzer.analyze(dto.personas),
      Promise.resolve(this.lengthAnalyzer.analyze(dto.personas)),
      Promise.resolve(this.ngramAnalyzer.analyze(dto.personas)),
    ]);

    const overallPassed = similarity.passed && length.passed && ngrams.passed;

    // Generate human-readable summary
    const summary = this.generateSummary(similarity, length, ngrams, overallPassed);

    const metrics: QuickDiversityMetricsDto = {
      personaCount: dto.personas.length,
      timestamp: new Date(),
      similarity,
      length,
      ngrams,
      overallPassed,
      summary,
    };

    // Store results if requested
    if (dto.saveResults) {
      await this.storageService.save(dto.batchId || 'unnamed', metrics);
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Quick analysis complete in ${duration}ms: ${overallPassed ? 'PASSED' : 'FAILED'}`
    );

    return metrics;
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    similarity: any,
    length: any,
    ngrams: any,
    passed: boolean
  ): string {
    const lines: string[] = [
      `Overall: ${passed ? 'PASSED ✓' : 'FAILED ✗'}`,
      '',
      `Embedding Similarity: ${similarity.passed ? '✓' : '✗'}`,
      `  - Average: ${similarity.avgPairwiseSimilarity} ${similarity.avgPairwiseSimilarity < 0.40 ? '✓' : '(target: < 0.40)'}`,
      `  - Clustered pairs: ${similarity.clusterPercentage}% ${similarity.clusterPercentage < 5 ? '✓' : '(target: < 5%)'}`,
      `  - Std dev: ${similarity.similarityStdDev} ${similarity.similarityStdDev > 0.15 ? '✓' : '(target: > 0.15)'}`,
      '',
      `Length Distribution: ${length.passed ? '✓' : '✗'}`,
      `  - Std dev: ${length.stdDev} ${length.stdDev > 50 ? '✓' : '(target: > 50)'}`,
      `  - Distribution: ${length.distribution.brief}% brief, ${length.distribution.short}% short, ${length.distribution.medium}% medium, ${length.distribution.long}% long, ${length.distribution.veryLong}% very long`,
      '',
      `N-gram Diversity: ${ngrams.passed ? '✓' : '✗'}`,
      `  - Trigram diversity: ${ngrams.trigramDiversity} ${ngrams.trigramDiversity > 0.80 ? '✓' : '(target: > 0.80)'}`,
      `  - High repetition count: ${ngrams.highRepetitionCount} ${ngrams.highRepetitionCount === 0 ? '✓' : '(target: 0)'}`,
    ];

    if (ngrams.top10RepeatedTrigrams.length > 0 && ngrams.top10RepeatedTrigrams[0].count > 3) {
      lines.push('');
      lines.push('Top repeated trigrams:');
      ngrams.top10RepeatedTrigrams.slice(0, 5).forEach(t => {
        lines.push(`  - "${t.trigram}" (${t.count} times)`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Compare two batches
   */
  async compare(baselineBatchId: string, experimentBatchId: string): Promise<any> {
    const baseline = await this.storageService.load(baselineBatchId);
    const experiment = await this.storageService.load(experimentBatchId);

    if (!baseline || !experiment) {
      throw new Error('Batch not found');
    }

    const improvement = {
      similarity: {
        baseline: baseline.similarity.avgPairwiseSimilarity,
        experiment: experiment.similarity.avgPairwiseSimilarity,
        change: experiment.similarity.avgPairwiseSimilarity - baseline.similarity.avgPairwiseSimilarity,
        percentChange: ((experiment.similarity.avgPairwiseSimilarity - baseline.similarity.avgPairwiseSimilarity) / baseline.similarity.avgPairwiseSimilarity * 100).toFixed(1),
      },
      clusterPercentage: {
        baseline: baseline.similarity.clusterPercentage,
        experiment: experiment.similarity.clusterPercentage,
        change: experiment.similarity.clusterPercentage - baseline.similarity.clusterPercentage,
        percentChange: ((experiment.similarity.clusterPercentage - baseline.similarity.clusterPercentage) / baseline.similarity.clusterPercentage * 100).toFixed(1),
      },
      trigramDiversity: {
        baseline: baseline.ngrams.trigramDiversity,
        experiment: experiment.ngrams.trigramDiversity,
        change: experiment.ngrams.trigramDiversity - baseline.ngrams.trigramDiversity,
        percentChange: ((experiment.ngrams.trigramDiversity - baseline.ngrams.trigramDiversity) / baseline.ngrams.trigramDiversity * 100).toFixed(1),
      },
    };

    return {
      baseline: baselineBatchId,
      experiment: experimentBatchId,
      improvement,
      summary: this.generateComparisonSummary(improvement),
    };
  }

  private generateComparisonSummary(improvement: any): string {
    const lines = [
      'Comparison Results:',
      '',
      `Embedding Similarity: ${improvement.similarity.baseline} → ${improvement.similarity.experiment} (${improvement.similarity.percentChange}%)`,
      improvement.similarity.change < 0 ? '  ✓✓✓ Improvement!' : '  ✗ Worse',
      '',
      `Cluster Percentage: ${improvement.clusterPercentage.baseline}% → ${improvement.clusterPercentage.experiment}% (${improvement.clusterPercentage.percentChange}%)`,
      improvement.clusterPercentage.change < 0 ? '  ✓✓✓ Improvement!' : '  ✗ Worse',
      '',
      `Trigram Diversity: ${improvement.trigramDiversity.baseline} → ${improvement.trigramDiversity.experiment} (${improvement.trigramDiversity.percentChange}%)`,
      improvement.trigramDiversity.change > 0 ? '  ✓✓ Improvement!' : '  ✗ Worse',
    ];

    return lines.join('\n');
  }
}
```

**Time Estimate**: 1 day

**Success Criteria**:
- Service orchestrates all analyzers
- Parallel execution works
- Summary generation is clear
- Comparison logic is accurate

### 1.9 Implement Metrics Storage Service

**File**: `/workspace/grove-backend/src/dev/diversity-testing/storage/metrics-storage.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { QuickDiversityMetricsDto } from '../dto/diversity-metrics.dto';

@Injectable()
export class MetricsStorageService {
  private readonly logger = new Logger(MetricsStorageService.name);
  private readonly storageDir = path.join(process.cwd(), 'diversity-metrics');

  constructor() {
    this.ensureStorageDir();
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDir() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create storage directory: ${error.message}`);
    }
  }

  /**
   * Save metrics to disk
   */
  async save(batchId: string, metrics: QuickDiversityMetricsDto): Promise<void> {
    const filename = `${batchId}_${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.storageDir, filename);

    try {
      await fs.writeFile(filepath, JSON.stringify(metrics, null, 2));
      this.logger.log(`Metrics saved to ${filepath}`);
    } catch (error) {
      this.logger.error(`Failed to save metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load metrics from disk
   */
  async load(batchId: string): Promise<QuickDiversityMetricsDto | null> {
    try {
      const files = await fs.readdir(this.storageDir);
      const matchingFile = files.find(f => f.startsWith(batchId));

      if (!matchingFile) {
        this.logger.warn(`No metrics found for batch ${batchId}`);
        return null;
      }

      const filepath = path.join(this.storageDir, matchingFile);
      const content = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Failed to load metrics: ${error.message}`);
      return null;
    }
  }

  /**
   * List all saved batches
   */
  async list(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.storageDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace(/\.json$/, ''));
    } catch (error) {
      this.logger.error(`Failed to list batches: ${error.message}`);
      return [];
    }
  }
}
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- Metrics save correctly to JSON files
- Loading works
- Directory creation is automatic

### 1.10 Implement REST API Controller

**File**: `/workspace/grove-backend/src/dev/diversity-testing/diversity-testing.controller.ts`

```typescript
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { DiversityTestingService } from './diversity-testing.service';
import { AnalyzePersonasDto } from './dto/analyze-request.dto';
import { QuickDiversityMetricsDto } from './dto/diversity-metrics.dto';

@ApiTags('dev/diversity-testing')
@Controller('dev/diversity-testing')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class DiversityTestingController {
  constructor(private diversityTestingService: DiversityTestingService) {}

  @Post('analyze/quick')
  @ApiOperation({ summary: 'Run quick diversity analysis (Tier 1)' })
  @ApiResponse({ status: 200, type: QuickDiversityMetricsDto })
  async analyzeQuick(@Body() dto: AnalyzePersonasDto): Promise<QuickDiversityMetricsDto> {
    return this.diversityTestingService.analyzeQuick(dto);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two batches' })
  async compare(
    @Query('baseline') baseline: string,
    @Query('experiment') experiment: string,
  ): Promise<any> {
    return this.diversityTestingService.compare(baseline, experiment);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List all saved batches' })
  async listBatches(): Promise<{ batches: string[] }> {
    const batches = await this.diversityTestingService['storageService'].list();
    return { batches };
  }
}
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- Endpoints are accessible
- Swagger documentation works
- Auth guards protect endpoints

### 1.11 Create CLI Test Script

**File**: `/workspace/grove-backend/scripts/test-diversity.ts`

```typescript
#!/usr/bin/env ts-node

/**
 * CLI tool for testing persona diversity
 *
 * Usage:
 *   npm run diversity:test -- --batch-id=batch_001 --count=100
 *   npm run diversity:compare -- --baseline=batch_001 --experiment=batch_002
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DiversityTestingService } from '../src/dev/diversity-testing/diversity-testing.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  const app = await NestFactory.createApplicationContext(AppModule);
  const diversityService = app.get(DiversityTestingService);
  const prisma = app.get(PrismaService);

  if (command === 'analyze') {
    // Get batch ID and count from args
    const batchId = args.find(a => a.startsWith('--batch-id='))?.split('=')[1] || 'unnamed';
    const count = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1] || '100');

    console.log(`Analyzing ${count} most recent test personas...`);

    // Fetch personas from database
    const users = await prisma.user.findMany({
      where: { isTestData: true },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      take: count,
    });

    const personas = users.map(u => ({
      id: u.id,
      interests: u.profile?.interests || '',
      project: u.profile?.project || '',
      deepDive: u.profile?.deepDive || undefined,
    }));

    const result = await diversityService.analyzeQuick({
      personas,
      batchId,
      saveResults: true,
    });

    console.log('\n' + result.summary);
  } else if (command === 'compare') {
    const baseline = args.find(a => a.startsWith('--baseline='))?.split('=')[1];
    const experiment = args.find(a => a.startsWith('--experiment='))?.split('=')[1];

    if (!baseline || !experiment) {
      console.error('Usage: npm run diversity:compare -- --baseline=batch_001 --experiment=batch_002');
      process.exit(1);
    }

    const result = await diversityService.compare(baseline, experiment);
    console.log('\n' + result.summary);
  }

  await app.close();
}

main().catch(console.error);
```

**Add to package.json scripts**:
```json
{
  "scripts": {
    "diversity:test": "ts-node scripts/test-diversity.ts analyze",
    "diversity:compare": "ts-node scripts/test-diversity.ts compare"
  }
}
```

**Time Estimate**: 1 day

**Success Criteria**:
- Script runs from command line
- Can analyze existing personas
- Can compare batches
- Output is clear and actionable

### Phase 1 Summary

**Total Time Estimate**: 5-7 days

**Deliverables**:
- ✓ Diversity testing module with 3 analyzers
- ✓ Math and text utilities
- ✓ REST API endpoints
- ✓ CLI tool for quick testing
- ✓ Metrics storage system

**Success Criteria**:
- Can analyze 100 personas in < 10 seconds
- Metrics are accurate and reproducible
- CLI tool is easy to use
- Results are stored for comparison

---

## Phase 2: Baseline Metrics Establishment

**Goal**: Measure current system performance to establish quantitative baseline

**Duration**: 2-3 days

**Dependencies**: Phase 1 complete

### 2.1 Generate Baseline Test Data

**Implementation Steps**:

1. **Generate 100 personas with current system**:
   ```bash
   # Using existing dev API
   curl -X POST http://localhost:3000/dev/personas/generate/custom \
     -H "Content-Type: application/json" \
     -d '{
       "count": 100,
       "intensityLevels": ["mixed"],
       "categories": ["Creative", "Tech", "Outdoor", "Food", "Wellness", "Maker", "Sports", "Music", "Gaming", "Reading", "DIY", "Collecting", "Social", "Learning", "Craft"]
     }'
   ```

2. **Wait for embedding generation** (monitor queue):
   ```bash
   # Check embedding status
   curl http://localhost:3000/dev/personas | jq '.[] | select(.embeddingStatus == "pending")'
   ```

3. **Run diversity analysis**:
   ```bash
   npm run diversity:test -- --batch-id=baseline_v1 --count=100
   ```

**Time Estimate**: 0.5 days (mostly waiting for embeddings)

**Success Criteria**:
- 100 personas generated successfully
- All embeddings generated
- Diversity metrics calculated

### 2.2 Document Baseline Metrics

**Create document**: `/workspace/thoughts/research/2025-10-31-persona-diversity-baseline-metrics.md`

**Content**:
```markdown
# Persona Diversity Baseline Metrics

**Date**: 2025-10-31
**System Version**: Current (pre-improvements)
**Batch ID**: baseline_v1
**Sample Size**: 100 personas

## Quick Metrics Results

### Embedding Similarity
- Average pairwise similarity: [VALUE] (Target: < 0.40)
- Clustered pairs (>0.85): [VALUE]% (Target: < 5%)
- Standard deviation: [VALUE] (Target: > 0.15)
- Min similarity: [VALUE]
- Max similarity: [VALUE]
- Median similarity: [VALUE]

**Status**: [PASSED/FAILED]

### Length Distribution
- Average length: [VALUE] chars
- Standard deviation: [VALUE] (Target: > 50)
- Distribution:
  - Brief (< 100): [VALUE]%
  - Short (100-200): [VALUE]%
  - Medium (200-300): [VALUE]%
  - Long (300-400): [VALUE]%
  - Very Long (> 400): [VALUE]%

**Status**: [PASSED/FAILED]

### N-gram Diversity
- Trigram diversity: [VALUE] (Target: > 0.80)
- High repetition count: [VALUE] (Target: 0)
- Top 10 repeated trigrams:
  1. "[PHRASE]" ([COUNT] times)
  2. ...

**Status**: [PASSED/FAILED]

## Problem Areas Identified

[Document specific issues found in baseline]

## Next Steps

[List specific improvements to target based on data]
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- All baseline metrics documented
- Problem areas identified
- Improvement priorities established

### 2.3 Manual Qualitative Review

**Process**:

1. **Sample 20 random personas** from baseline batch
2. **Review for**:
   - Clustering patterns (similar phrasing, tone)
   - Voice diversity (do they sound like different people?)
   - Quality issues (generic, template-like, unnatural)
3. **Document findings** in baseline metrics document

**Review Template**:
```markdown
## Qualitative Review

**Reviewer**: [NAME]
**Date**: [DATE]
**Sample Size**: 20 personas (randomly selected from baseline_v1)

### Patterns Observed

1. **Writing Style Clustering**:
   - [Describe common patterns]
   - Example personas: [IDs]

2. **Tone Homogeneity**:
   - [Describe tone issues]
   - Example: [Quote similar personas]

3. **Structural Repetition**:
   - [Describe sentence structure patterns]
   - Example: [Quote patterns]

### Diversity Assessment

- **Voice Variety**: [1-5 score] - [Explanation]
- **Authenticity**: [1-5 score] - [Explanation]
- **Usefulness for Testing**: [1-5 score] - [Explanation]

### Recommendations

[Specific improvements to prioritize]
```

**Time Estimate**: 1 day

**Success Criteria**:
- 20 personas reviewed
- Patterns documented
- Recommendations created

### 2.4 Establish Target Metrics

Based on baseline results, set specific improvement targets:

**Document**: `/workspace/thoughts/plans/2025-10-31-diversity-improvement-targets.md`

```markdown
# Diversity Improvement Targets

**Baseline Date**: 2025-10-31
**Baseline Batch**: baseline_v1

## Current vs. Target Metrics

| Metric | Baseline | Iteration 1 Target | Final Target |
|--------|----------|-------------------|--------------|
| Avg Similarity | [VALUE] | [VALUE] | < 0.40 |
| Cluster % | [VALUE]% | [VALUE]% | < 5% |
| Trigram Diversity | [VALUE] | [VALUE] | > 0.80 |
| Length StdDev | [VALUE] | [VALUE] | > 50 |

## Improvement Priorities

1. **Priority 1**: [Metric with worst performance]
   - Current: [VALUE]
   - Target: [VALUE]
   - Strategy: [Specific approach]

2. **Priority 2**: ...

## Success Criteria for Iteration 1

- [ ] Metric 1: Improve by [X]%
- [ ] Metric 2: Improve by [X]%
- [ ] Overall: Pass at least 2/3 quick metrics
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- Targets documented
- Priorities established
- Success criteria clear

### Phase 2 Summary

**Total Time Estimate**: 2-3 days

**Deliverables**:
- ✓ Baseline metrics from 100 personas
- ✓ Problem areas identified
- ✓ Improvement targets established
- ✓ Qualitative review complete

---

## Phase 3: Iterative Improvements

**Goal**: Implement improvements iteratively with testing after each change

**Duration**: 10-15 days (3 iterations × 3-5 days each)

**Dependencies**: Phases 1 & 2 complete

### Iteration 1: Meta-Persona Architecture

**Duration**: 4-5 days

**Goal**: Implement 8 distinct "persona generator" meta-personas to break single-voice clustering

#### 3.1.1 Design Meta-Persona System

**File**: `/workspace/grove-backend/src/dev/meta-personas/meta-persona.types.ts`

```typescript
export interface MetaPersona {
  id: string;
  name: string;
  description: string;
  writingStyle: string;
  systemPrompt: string;
  exampleOutput: string;
}

export const META_PERSONAS: MetaPersona[] = [
  {
    id: 'minimalist',
    name: 'The Minimalist',
    description: 'Short, matter-of-fact, understated',
    writingStyle: 'Brief, direct, no embellishment. Uses short sentences.',
    systemPrompt: `You generate personas with a minimalist, understated writing style.

Key characteristics:
- Very brief descriptions (20-80 chars typical)
- Direct, no-nonsense language
- Short sentences, simple words
- Matter-of-fact tone
- No enthusiasm or embellishment

Examples:
- "Running. Training for 10K."
- "I cook. Trying new recipes."
- "Photography on weekends."`,
    exampleOutput: 'interests: "Gardening. Mostly vegetables.", project: "Building raised beds"',
  },
  {
    id: 'enthusiast',
    name: 'The Enthusiast',
    description: 'Energetic, exclamation points, passionate',
    writingStyle: 'High energy, excited, uses exclamation points naturally',
    systemPrompt: `You generate personas with enthusiastic, energetic writing.

Key characteristics:
- Exclamation points and energy in text
- Passionate language
- Conveys excitement naturally
- Uses words like "love", "can't get enough", "amazing"
- Medium length (80-200 chars)

Examples:
- "Can't get enough of photography these days! The way light changes everything is just incredible."
- "Sourdough baking has completely taken over my weekends! Each loaf is an experiment."`,
    exampleOutput: 'interests: "Urban gardening is my obsession! Turning every surface into green space!", project: "Setting up a vertical garden wall"',
  },
  {
    id: 'academic',
    name: 'The Academic',
    description: 'Formal, analytical, references concepts',
    writingStyle: 'Intellectual, uses frameworks and concepts, formal tone',
    systemPrompt: `You generate personas with academic, analytical writing.

Key characteristics:
- Formal language
- References frameworks, concepts, theories
- Uses terms like "intersection of", "exploring", "analyzing"
- Medium to long length (120-250 chars)
- Thoughtful, considered tone

Examples:
- "I've been exploring the intersection of behavioral economics and decision-making frameworks in my free time."
- "Studying the historical evolution of urban planning paradigms, particularly the shift toward sustainable design."`,
    exampleOutput: 'interests: "Examining the relationship between soil microbiome diversity and plant health in urban environments", project: "Researching companion planting methodologies"',
  },
  {
    id: 'storyteller',
    name: 'The Storyteller',
    description: 'Narrative style, personal anecdotes, temporal markers',
    writingStyle: 'Uses narrative structure, time references, personal stories',
    systemPrompt: `You generate personas with storytelling, narrative style.

Key characteristics:
- Includes time markers ("Started when...", "Five years ago...")
- Personal anecdotes and origin stories
- Narrative arc in descriptions
- Medium to long length (150-300 chars)
- Warm, personal tone

Examples:
- "Started baking when my grandmother gave me her recipe book. Five years later, still perfecting her chocolate cake recipe."
- "Got into woodworking after watching my neighbor build a deck. Now I can't stop making furniture for friends and family."`,
    exampleOutput: 'interests: "My gardening journey began with a single tomato plant on my apartment balcony. That was three years ago, and now I grow over 20 varieties of heirloom vegetables.", project: "Preserving seeds from this season\'s best performers"',
  },
  {
    id: 'pragmatist',
    name: 'The Pragmatist',
    description: 'Goal-oriented, direct, project-focused',
    writingStyle: 'Focus on objectives, concrete projects, practical outcomes',
    systemPrompt: `You generate personas with pragmatic, goal-focused writing.

Key characteristics:
- Emphasizes concrete projects and goals
- Direct about what they're building/doing
- Uses action verbs (building, creating, developing)
- Technical specificity when relevant
- Medium length (100-200 chars)

Examples:
- "Building a home automation system. Currently integrating smart sensors with Home Assistant."
- "Restoring a 1967 Mustang. Focusing on engine rebuild and sourcing original parts."`,
    exampleOutput: 'interests: "Setting up an aquaponics system to grow vegetables and raise fish in a closed-loop ecosystem", project: "Designing the pump and filtration setup"',
  },
  {
    id: 'casual',
    name: 'The Casual',
    description: 'Conversational, everyday language, relatable',
    writingStyle: 'Relaxed, conversational, uses everyday expressions',
    systemPrompt: `You generate personas with casual, conversational writing.

Key characteristics:
- Everyday language and expressions
- Contractions and informal speech
- Relatable, down-to-earth tone
- Medium length (80-180 chars)
- Uses phrases like "pretty into", "kind of", "lately"

Examples:
- "I'm pretty into cooking these days. Been trying new pasta recipes lately."
- "Started running a couple months back. Nothing too serious, just like staying active."`,
    exampleOutput: 'interests: "I like gardening, nothing fancy. Just trying to keep some herbs and tomatoes alive on my balcony.", project: "Figuring out why my basil keeps dying"',
  },
  {
    id: 'deep_diver',
    name: 'The Deep Diver',
    description: 'Technical details, niche terminology, expertise shown',
    writingStyle: 'Technical depth, specialized terminology, expert-level detail',
    systemPrompt: `You generate personas with deep technical expertise.

Key characteristics:
- Uses specialized terminology naturally
- Shows depth of knowledge
- References specific techniques, tools, methodologies
- Long descriptions (200-400 chars)
- Demonstrates expertise without being pretentious

Examples:
- "Restoring vintage Soviet cameras - specifically Kiev 88 medium format rangefinders. The challenge is sourcing period-correct lenses and understanding the unique shutter mechanisms."
- "Deep into pour-over coffee brewing. Experimenting with different grind sizes, water temperatures, and bloom times using a Hario V60 and Comandante grinder."`,
    exampleOutput: 'interests: "Growing rare heirloom vegetables using biodynamic farming principles. Currently focusing on soil remineralization and companion planting based on lunar cycles.", project: "Establishing a three-year crop rotation plan based on Steiner\'s agricultural calendar"',
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    description: 'Curious, open-ended, discovery-focused',
    writingStyle: 'Emphasizes learning, discovery, trying new things',
    systemPrompt: `You generate personas with curious, exploratory writing.

Key characteristics:
- Emphasizes discovery and learning
- Uses words like "exploring", "discovering", "trying to understand"
- Open-ended, curious questions
- Medium length (100-220 chars)
- Wonder and curiosity in tone

Examples:
- "Exploring different coffee brewing methods - pourover, French press, Aeropress - trying to taste the differences each technique brings out."
- "Recently started experimenting with fermentation. Fascinated by how different bacteria cultures create totally different flavors."`,
    exampleOutput: 'interests: "Exploring the world of native plant gardening and trying to understand which species will thrive in my specific microclimate", project: "Testing different native wildflowers in various spots around my yard"',
  },
];
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- 8 distinct meta-personas defined
- System prompts are clear and differentiated
- Examples demonstrate variety

#### 3.1.2 Implement Meta-Persona Service

**File**: `/workspace/grove-backend/src/dev/meta-personas/meta-persona.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { META_PERSONAS, MetaPersona } from './meta-persona.types';

@Injectable()
export class MetaPersonaService {
  private readonly logger = new Logger(MetaPersonaService.name);

  /**
   * Select meta-personas for a batch
   * Strategy: Distribute evenly across batch
   */
  selectMetaPersonasForBatch(batchSize: number): MetaPersona[] {
    const selections: MetaPersona[] = [];

    for (let i = 0; i < batchSize; i++) {
      // Cycle through meta-personas
      const metaPersona = META_PERSONAS[i % META_PERSONAS.length];
      selections.push(metaPersona);
    }

    // Shuffle to avoid predictable patterns
    return this.shuffle(selections);
  }

  /**
   * Build persona-specific system prompt using meta-persona
   */
  buildSystemPromptForMetaPersona(metaPersona: MetaPersona): string {
    return `${metaPersona.systemPrompt}

You are generating realistic employee profiles for a connection-matching platform.
Write in FIRST PERSON ("I", "my") - NOT third person.
Generate natural, authentic content that sounds like a real person with this specific writing style.

Return valid JSON only.`;
  }

  /**
   * Build user prompt with meta-persona style guidance
   */
  buildUserPromptForMetaPersona(
    metaPersona: MetaPersona,
    name: string,
    interest: string,
    intensityLevel: string
  ): string {
    return `Generate a profile for this person in the ${metaPersona.name} style:

Name: ${name}
Interest area: ${interest}
Intensity: ${intensityLevel}

CRITICAL: Write in the ${metaPersona.writingStyle} style.

Example of this style: ${metaPersona.exampleOutput}

Return JSON with:
- name: "${name}"
- email: dev-persona-[5-digit-random]@test.grove.test
- interests: (in ${metaPersona.name} style)
- project: (in ${metaPersona.name} style)
- connectionType: "collaboration" | "mentorship" | "friendship" | "knowledge_exchange"
- deepDive: (optional, for engaged/deep intensity)
- preferences: (optional)`;
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get statistics on meta-persona usage
   */
  getUsageStats(metaPersonaIds: string[]): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const id of metaPersonaIds) {
      stats[id] = (stats[id] || 0) + 1;
    }

    return stats;
  }
}
```

**Time Estimate**: 1 day

**Success Criteria**:
- Service selects meta-personas evenly
- Prompts are generated correctly
- Shuffling works

#### 3.1.3 Update Dev Service to Use Meta-Personas

**File**: `/workspace/grove-backend/src/dev/dev.service.ts`

**Changes**:

1. **Import MetaPersonaService**:
   ```typescript
   import { MetaPersonaService } from './meta-personas/meta-persona.service';

   constructor(
     // ... existing
     private metaPersonaService: MetaPersonaService,
   ) {}
   ```

2. **Update `generateSubBatch` to use meta-personas**:
   ```typescript
   private async generateSubBatch(
     names: Array<{ fullName: string }>,
     interests: string[],
     intensityLevel: 'casual' | 'engaged' | 'deep' | 'mixed',
     customPrompt?: string,
     avoidPhrases: string[] = [],
   ): Promise<CreateManualPersonaDto[]> {
     // Select meta-personas for this batch
     const metaPersonas = this.metaPersonaService.selectMetaPersonasForBatch(names.length);

     this.logger.log(
       `Generating batch with meta-persona distribution: ${JSON.stringify(
         this.metaPersonaService.getUsageStats(metaPersonas.map(mp => mp.id))
       )}`
     );

     // Generate personas one-by-one (or in small groups) with different meta-personas
     const personas: CreateManualPersonaDto[] = [];

     for (let i = 0; i < names.length; i++) {
       const metaPersona = metaPersonas[i];
       const name = names[i].fullName;
       const interest = interests[i];

       try {
         const systemPrompt = this.metaPersonaService.buildSystemPromptForMetaPersona(metaPersona);
         const userPrompt = this.metaPersonaService.buildUserPromptForMetaPersona(
           metaPersona,
           name,
           interest,
           intensityLevel
         );

         const result = await this.openaiService.generatePersonaContentWithSystemPrompt(
           systemPrompt,
           userPrompt
         );

         personas.push({
           name: result.name || name,
           email: result.email || `dev-persona-${Math.floor(10000 + Math.random() * 90000)}@test.grove.test`,
           interests: result.interests || interest,
           project: result.project || 'Working on personal projects',
           connectionType: result.connectionType || 'friendship',
           deepDive: result.deepDive,
           preferences: result.preferences,
           metaPersonaId: metaPersona.id, // Track which meta-persona was used
         });
       } catch (error) {
         this.logger.error(`Failed to generate persona ${i+1}: ${error.message}`);
         // Fallback
         personas.push({
           name,
           email: `dev-persona-${Math.floor(10000 + Math.random() * 90000)}@test.grove.test`,
           interests: `Interested in ${interest}`,
           project: 'Exploring this interest',
           connectionType: 'friendship',
           metaPersonaId: metaPersona.id,
         });
       }
     }

     return personas;
   }
   ```

**Time Estimate**: 1.5 days

**Success Criteria**:
- Dev service uses meta-personas
- Different personas get different styles
- Tracking of meta-persona usage works

#### 3.1.4 Update OpenAI Service

**File**: `/workspace/grove-backend/src/openai/openai.service.ts`

**Add new method**:

```typescript
/**
 * Generate persona content with custom system prompt
 */
async generatePersonaContentWithSystemPrompt(
  systemPrompt: string,
  userPrompt: string
): Promise<any> {
  if (!this.isConfigured) {
    this.logger.debug('Using mock persona (OpenAI not configured)');
    return this.generateMockPersona();
  }

  try {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 1.0,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    this.logger.warn(`Failed to generate persona: ${error.message}`);
    return this.generateMockPersona();
  }
}
```

**Time Estimate**: 0.5 days

**Success Criteria**:
- System prompts are used correctly
- JSON parsing works
- Fallback works

#### 3.1.5 Test Iteration 1

**Steps**:

1. **Generate 100 new personas**:
   ```bash
   curl -X POST http://localhost:3000/dev/personas/generate/custom \
     -H "Content-Type: application/json" \
     -d '{
       "count": 100,
       "intensityLevels": ["mixed"]
     }'
   ```

2. **Wait for embeddings** (monitor)

3. **Run diversity tests**:
   ```bash
   npm run diversity:test -- --batch-id=iteration1_metapersonas --count=100
   ```

4. **Compare to baseline**:
   ```bash
   npm run diversity:compare -- --baseline=baseline_v1 --experiment=iteration1_metapersonas
   ```

5. **Document results**:
   - Create `/workspace/thoughts/implementation-details/2025-10-31-iteration1-meta-personas-results.md`
   - Include all metrics
   - Include comparison to baseline
   - Note improvements and remaining issues

**Time Estimate**: 1 day

**Success Criteria**:
- New metrics show improvement
- Comparison shows positive changes
- Results documented

### Iteration 2: Enhanced Conditional Prompting

**Duration**: 3-4 days

**Goal**: Add multiple conditioning attributes beyond just interest category

#### 3.2.1 Design Conditioning Attributes

**File**: `/workspace/grove-backend/src/dev/conditioning/conditioning.types.ts`

```typescript
export interface PersonaConditions {
  name: string;
  interest: string;

  // NEW conditioning attributes
  writingStyle: 'minimalist' | 'enthusiastic' | 'academic' | 'storytelling' | 'pragmatic' | 'casual' | 'technical' | 'exploratory';
  toneTarget: 'upbeat' | 'neutral' | 'reflective' | 'matter-of-fact' | 'curious';
  complexityLevel: 'simple' | 'moderate' | 'complex';
  lifeStageSuggestion: 'starting-out' | 'established' | 'transitioning' | 'mixed';
  demographicHint: 'early-career' | 'mid-career' | 'experienced' | 'student' | 'mixed';
}

export const CONDITIONING_OPTIONS = {
  writingStyle: ['minimalist', 'enthusiastic', 'academic', 'storytelling', 'pragmatic', 'casual', 'technical', 'exploratory'],
  toneTarget: ['upbeat', 'neutral', 'reflective', 'matter-of-fact', 'curious'],
  complexityLevel: ['simple', 'moderate', 'complex'],
  lifeStageSuggestion: ['starting-out', 'established', 'transitioning', 'mixed'],
  demographicHint: ['early-career', 'mid-career', 'experienced', 'student', 'mixed'],
};
```

**Time Estimate**: 0.5 days

#### 3.2.2 Implement Conditioning Service

**File**: `/workspace/grove-backend/src/dev/conditioning/conditioning.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PersonaConditions, CONDITIONING_OPTIONS } from './conditioning.types';

@Injectable()
export class ConditioningService {
  /**
   * Generate random conditioning attributes
   * Ensures no two personas share ALL attributes
   */
  generateConditions(name: string, interest: string): PersonaConditions {
    return {
      name,
      interest,
      writingStyle: this.randomChoice(CONDITIONING_OPTIONS.writingStyle),
      toneTarget: this.randomChoice(CONDITIONING_OPTIONS.toneTarget),
      complexityLevel: this.randomChoice(CONDITIONING_OPTIONS.complexityLevel),
      lifeStageSuggestion: this.randomChoice(CONDITIONING_OPTIONS.lifeStageSuggestion),
      demographicHint: this.randomChoice(CONDITIONING_OPTIONS.demographicHint),
    };
  }

  /**
   * Generate batch of conditions ensuring diversity
   */
  generateBatchConditions(
    names: string[],
    interests: string[]
  ): PersonaConditions[] {
    const conditions: PersonaConditions[] = [];
    const usedCombos = new Set<string>();

    for (let i = 0; i < names.length; i++) {
      let attempts = 0;
      let conds: PersonaConditions;

      // Ensure unique combination (at least 1 attribute different)
      do {
        conds = this.generateConditions(names[i], interests[i]);
        const comboKey = this.getComboKey(conds);

        if (!usedCombos.has(comboKey)) {
          usedCombos.add(comboKey);
          break;
        }

        attempts++;
      } while (attempts < 10);

      conditions.push(conds);
    }

    return conditions;
  }

  private getComboKey(conds: PersonaConditions): string {
    return `${conds.writingStyle}|${conds.toneTarget}|${conds.complexityLevel}`;
  }

  private randomChoice<T>(options: readonly T[]): T {
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Build conditioning section for prompt
   */
  buildConditioningPrompt(conds: PersonaConditions): string {
    return `
CONDITIONING ATTRIBUTES (use these to guide your generation):
- Writing Style: ${conds.writingStyle}
- Tone: ${conds.toneTarget}
- Complexity Level: ${conds.complexityLevel}
- Life Stage: ${conds.lifeStageSuggestion}
- Career Stage: ${conds.demographicHint}

Incorporate these attributes naturally into the persona without being explicit about them.`;
  }
}
```

**Time Estimate**: 1 day

**Success Criteria**:
- Generates diverse conditions
- No duplicate combinations (or very few)
- Prompts include conditioning

#### 3.2.3 Update Dev Service

Integrate conditioning service into persona generation

**Time Estimate**: 1 day

#### 3.2.4 Test Iteration 2

Same process as Iteration 1:
- Generate 100 personas
- Run tests
- Compare to iteration 1
- Document

**Time Estimate**: 1 day

**Success Criteria**:
- Further improvement in diversity metrics
- No regression from Iteration 1

### Iteration 3: Additional Improvements (Based on Data)

**Duration**: 3-4 days

**Goal**: Address remaining issues based on Iteration 2 results

**Potential improvements** (to be determined by metrics):

1. **If trigram diversity still low**:
   - Implement stricter anti-pattern tracking
   - Add phrase variation requirements

2. **If length distribution still poor**:
   - Enforce length targets more strictly
   - Add post-generation validation

3. **If similarity still high**:
   - Increase temperature to 1.2 for specific meta-personas
   - Add diversity-boosting techniques

**Process**:
- Review Iteration 2 metrics
- Identify weakest area
- Design targeted fix
- Implement
- Test
- Document

**Time Estimate**: 3-4 days

### Phase 3 Summary

**Total Time Estimate**: 10-15 days

**Deliverables**:
- ✓ Meta-persona architecture implemented
- ✓ Enhanced conditional prompting
- ✓ 3 iterations with metrics at each step
- ✓ Documentation of improvements

---

## Phase 4: Validation and Production Deployment

**Goal**: Validate improvements and deploy to production

**Duration**: 3-4 days

**Dependencies**: Phase 3 complete

### 4.1 Final Metrics Validation

**Steps**:

1. **Generate 200 personas** (larger sample for confidence)
2. **Run all diversity tests**:
   - Quick metrics
   - Deep analysis (cluster-agent)
   - Topic diversity
3. **Document final metrics**
4. **Compare to baseline and targets**

**Success Criteria**:
- All quick metrics pass
- Improvement > 50% on key metrics
- Deep analysis shows good clustering

**Time Estimate**: 1 day

### 4.2 Human Validation Sampling

**Process**:

1. **Sample 50 personas** from final batch
2. **Conduct qualitative review**:
   - Voice diversity (do they sound different?)
   - Authenticity (do they sound real?)
   - Quality (natural language?)
3. **A/B test**: Compare baseline vs. final
4. **Document findings**

**Review Template**:
```markdown
## Final Qualitative Validation

**Reviewer**: [NAME]
**Sample Size**: 50 personas
**Date**: [DATE]

### Voice Diversity Assessment

- **Score**: [1-5]
- **Notes**: [Do personas sound like different people?]

### Authenticity Assessment

- **Score**: [1-5]
- **Notes**: [Do they sound like real people?]

### Quality Assessment

- **Score**: [1-5]
- **Notes**: [Is the language natural?]

### A/B Comparison

Compared 20 baseline vs 20 final personas (blind review):
- **Preference**: Final [X%], Baseline [Y%]
- **Notes**: [What made final better?]

### Recommendation

[ ] Ready for production
[ ] Needs additional iteration
```

**Time Estimate**: 1-2 days

**Success Criteria**:
- Human reviewers score > 4/5 on all dimensions
- A/B preference > 70% for final version
- Recommendation: Ready for production

### 4.3 Performance Testing

**Test**:

1. **Generation speed**: Time to generate 100 personas
2. **API reliability**: Error rate across 500 generations
3. **Embedding queue**: Ensure queue doesn't back up

**Success Criteria**:
- Generation time < 2 minutes for 100 personas
- Error rate < 1%
- Queue processes within 10 minutes

**Time Estimate**: 0.5 days

### 4.4 Documentation and Knowledge Transfer

**Create/Update**:

1. **README**: Update `/workspace/grove-backend/src/dev/README.md`
   - Document meta-persona system
   - Explain conditioning attributes
   - Provide usage examples

2. **API Documentation**: Update Swagger docs

3. **Metrics Guide**: Document how to run diversity tests

4. **Best Practices**: Document lessons learned

**Time Estimate**: 1 day

**Success Criteria**:
- Documentation is complete and clear
- Examples work
- Team can use system

### 4.5 Production Deployment

**Steps**:

1. **Merge feature branch** to main
2. **Deploy to production**
3. **Monitor initial usage**:
   - Check error rates
   - Verify diversity metrics on production data
4. **Create runbook** for maintenance

**Time Estimate**: 0.5 days

**Success Criteria**:
- Deployed without errors
- Production metrics match testing
- Monitoring in place

### Phase 4 Summary

**Total Time Estimate**: 3-4 days

**Deliverables**:
- ✓ Final metrics validated
- ✓ Human validation complete
- ✓ Performance tested
- ✓ Documentation complete
- ✓ Production deployment

---

## Overall Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Testing Infrastructure | 5-7 days | None |
| Phase 2: Baseline Metrics | 2-3 days | Phase 1 |
| Phase 3: Iterative Improvements | 10-15 days | Phase 2 |
| Phase 4: Validation & Deployment | 3-4 days | Phase 3 |
| **TOTAL** | **20-29 days** | - |

## Risk Assessment

### Technical Risks

1. **OpenAI API Rate Limits**
   - **Risk**: Generating 100+ personas may hit rate limits
   - **Mitigation**: Implement retry logic, use smaller batches
   - **Impact**: Medium

2. **Embedding Generation Time**
   - **Risk**: Queue may back up with large batches
   - **Mitigation**: Monitor queue, increase workers if needed
   - **Impact**: Low

3. **Meta-Persona Effectiveness**
   - **Risk**: Meta-personas may not produce enough diversity
   - **Mitigation**: Testing after Iteration 1 will reveal this early
   - **Impact**: Medium

### Process Risks

1. **Metrics Don't Improve**
   - **Risk**: Improvements may not move metrics
   - **Mitigation**: Testing-first approach catches this early
   - **Impact**: High (requires design changes)

2. **Baseline Takes Longer Than Expected**
   - **Risk**: Embedding generation delays baseline
   - **Mitigation**: Can run tests on partial data
   - **Impact**: Low

## Dependencies

### External Dependencies

- OpenAI API availability and performance
- Database capacity for 200+ test personas
- Redis for queue management

### Internal Dependencies

- Access to production-like OpenAI API key
- Ability to generate embeddings (not mocked)
- SuperAdmin access for testing endpoints

## Success Criteria Summary

### Phase 1: Testing Infrastructure
- [ ] Quick metrics run in < 10 seconds for 100 personas
- [ ] CLI tool works correctly
- [ ] Metrics storage works
- [ ] All utilities tested

### Phase 2: Baseline Metrics
- [ ] 100 personas generated and analyzed
- [ ] Baseline metrics documented
- [ ] Problem areas identified
- [ ] Targets established

### Phase 3: Iterative Improvements
- [ ] Iteration 1: Meta-persona architecture shows improvement
- [ ] Iteration 2: Conditional prompting shows further improvement
- [ ] Iteration 3: Final improvements address remaining issues
- [ ] All iterations documented

### Phase 4: Validation & Deployment
- [ ] Final metrics meet targets:
  - Avg similarity < 0.40
  - Cluster % < 5%
  - Trigram diversity > 0.80
- [ ] Human validation scores > 4/5
- [ ] A/B preference > 70%
- [ ] Production deployment successful

## Rollback Plan

If improvements fail to meet targets:

1. **After Iteration 1**: Revert to baseline, redesign meta-personas
2. **After Iteration 2**: Keep Iteration 1, redesign conditioning
3. **After Iteration 3**: Deploy best iteration (1 or 2)
4. **Production Issues**: Revert to previous version, analyze in staging

## Monitoring and Maintenance

### Post-Deployment Monitoring

1. **Diversity Metrics Dashboard**:
   - Track metrics for each batch generated
   - Alert if metrics fall below thresholds

2. **Weekly Reviews**:
   - Sample 10 personas
   - Quick qualitative check
   - Re-run diversity tests monthly

3. **Quarterly Deep Analysis**:
   - Generate 200 persona test batch
   - Full cluster-agent analysis
   - Update meta-personas if drift detected

## Next Steps

To begin implementation:

1. **Review and approve this plan**
2. **Set up development environment**
3. **Create feature branch**: `feature/persona-diversity-improvements`
4. **Begin Phase 1**: Implement testing infrastructure
5. **Daily standups**: Review progress and blockers

## Appendix A: File Structure

```
grove-backend/
├── src/
│   ├── dev/
│   │   ├── dev.service.ts (modified)
│   │   ├── meta-personas/
│   │   │   ├── meta-persona.types.ts
│   │   │   ├── meta-persona.service.ts
│   │   │   └── meta-persona.module.ts
│   │   ├── conditioning/
│   │   │   ├── conditioning.types.ts
│   │   │   ├── conditioning.service.ts
│   │   │   └── conditioning.module.ts
│   │   └── diversity-testing/
│   │       ├── diversity-testing.module.ts
│   │       ├── diversity-testing.service.ts
│   │       ├── diversity-testing.controller.ts
│   │       ├── analyzers/
│   │       │   ├── embedding-similarity.analyzer.ts
│   │       │   ├── length-distribution.analyzer.ts
│   │       │   └── ngram-repetition.analyzer.ts
│   │       ├── dto/
│   │       │   └── diversity-metrics.dto.ts
│   │       ├── storage/
│   │       │   └── metrics-storage.service.ts
│   │       └── utils/
│   │           ├── math.utils.ts
│   │           └── text.utils.ts
│   └── openai/
│       └── openai.service.ts (modified)
├── scripts/
│   └── test-diversity.ts
└── diversity-metrics/ (created at runtime)
    └── *.json (metrics files)

thoughts/
├── plans/
│   └── 2025-10-31-persona-diversity-improvements-testing-driven-iteration.md (this file)
├── research/
│   ├── 2025-10-31-persona-generation-diversity-improvements-research.md
│   └── 2025-10-31-persona-diversity-baseline-metrics.md (created in Phase 2)
└── implementation-details/
    ├── 2025-10-31-iteration1-meta-personas-results.md (created in Phase 3)
    ├── 2025-10-31-iteration2-conditioning-results.md (created in Phase 3)
    └── 2025-10-31-iteration3-final-results.md (created in Phase 3)
```

## Appendix B: Key Metrics Reference

| Metric | Current (Est.) | Minimum | Target | Aspirational |
|--------|---------------|---------|--------|--------------|
| Avg Pairwise Similarity | 0.70-0.85 | < 0.50 | < 0.40 | < 0.30 |
| Clustered Pairs % | 20-40% | < 10% | < 5% | < 2% |
| Diversity Score (D) | 0.30-0.45 | > 0.60 | > 0.70 | > 0.80 |
| Trigram Diversity | 0.65-0.75 | > 0.75 | > 0.80 | > 0.85 |
| Length StdDev | 30-40 | > 50 | > 60 | > 70 |
| Topic Entropy | 2.5-3.0 | > 3.0 | > 3.5 | > 3.8 |

## Appendix C: Example CLI Usage

```bash
# Generate baseline
npm run diversity:test -- --batch-id=baseline_v1 --count=100

# After Iteration 1
npm run diversity:test -- --batch-id=iteration1_metapersonas --count=100

# Compare
npm run diversity:compare -- --baseline=baseline_v1 --experiment=iteration1_metapersonas

# List all batches
curl http://localhost:3000/dev/diversity-testing/batches

# Analyze specific personas via API
curl -X POST http://localhost:3000/dev/diversity-testing/analyze/quick \
  -H "Content-Type: application/json" \
  -d '{
    "personas": [...],
    "batchId": "custom_test",
    "saveResults": true
  }'
```
