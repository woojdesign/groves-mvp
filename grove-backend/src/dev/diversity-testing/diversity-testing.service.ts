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
      `Overall: ${passed ? 'PASSED' : 'FAILED'}`,
      '',
      `Embedding Similarity: ${similarity.passed ? 'PASS' : 'FAIL'}`,
      `  - Average: ${similarity.avgPairwiseSimilarity} ${similarity.avgPairwiseSimilarity < 0.40 ? 'PASS' : '(target: < 0.40)'}`,
      `  - Clustered pairs: ${similarity.clusterPercentage}% ${similarity.clusterPercentage < 5 ? 'PASS' : '(target: < 5%)'}`,
      `  - Std dev: ${similarity.similarityStdDev} ${similarity.similarityStdDev > 0.15 ? 'PASS' : '(target: > 0.15)'}`,
      '',
      `Length Distribution: ${length.passed ? 'PASS' : 'FAIL'}`,
      `  - Std dev: ${length.stdDev} ${length.stdDev > 50 ? 'PASS' : '(target: > 50)'}`,
      `  - Distribution: ${length.distribution.brief}% brief, ${length.distribution.short}% short, ${length.distribution.medium}% medium, ${length.distribution.long}% long, ${length.distribution.veryLong}% very long`,
      '',
      `N-gram Diversity: ${ngrams.passed ? 'PASS' : 'FAIL'}`,
      `  - Trigram diversity: ${ngrams.trigramDiversity} ${ngrams.trigramDiversity > 0.80 ? 'PASS' : '(target: > 0.80)'}`,
      `  - High repetition count: ${ngrams.highRepetitionCount} ${ngrams.highRepetitionCount === 0 ? 'PASS' : '(target: 0)'}`,
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
      `Embedding Similarity: ${improvement.similarity.baseline} -> ${improvement.similarity.experiment} (${improvement.similarity.percentChange}%)`,
      improvement.similarity.change < 0 ? '  IMPROVEMENT!' : '  WORSE',
      '',
      `Cluster Percentage: ${improvement.clusterPercentage.baseline}% -> ${improvement.clusterPercentage.experiment}% (${improvement.clusterPercentage.percentChange}%)`,
      improvement.clusterPercentage.change < 0 ? '  IMPROVEMENT!' : '  WORSE',
      '',
      `Trigram Diversity: ${improvement.trigramDiversity.baseline} -> ${improvement.trigramDiversity.experiment} (${improvement.trigramDiversity.percentChange}%)`,
      improvement.trigramDiversity.change > 0 ? '  IMPROVEMENT!' : '  WORSE',
    ];

    return lines.join('\n');
  }
}
