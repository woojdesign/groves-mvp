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
      top10RepeatedTrigrams: top10.map(item => ({ trigram: item.ngram, count: item.count })),
      highRepetitionCount,
      passed,
    };
  }
}
