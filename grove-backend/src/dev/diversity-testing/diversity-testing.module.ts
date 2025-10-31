import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { OpenaiModule } from '../../openai/openai.module';
import { DiversityTestingController } from './diversity-testing.controller';
import { DiversityTestingService } from './diversity-testing.service';
import { EmbeddingSimilarityAnalyzer } from './analyzers/embedding-similarity.analyzer';
import { LengthDistributionAnalyzer } from './analyzers/length-distribution.analyzer';
import { NgramRepetitionAnalyzer } from './analyzers/ngram-repetition.analyzer';
import { MetricsStorageService } from './storage/metrics-storage.service';

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
