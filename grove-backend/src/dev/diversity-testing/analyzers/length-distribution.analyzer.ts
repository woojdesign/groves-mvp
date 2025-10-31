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
