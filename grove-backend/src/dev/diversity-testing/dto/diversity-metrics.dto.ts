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
