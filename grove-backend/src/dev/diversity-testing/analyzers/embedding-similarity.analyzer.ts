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
