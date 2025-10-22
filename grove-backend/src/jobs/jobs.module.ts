import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenaiModule } from '../openai/openai.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingGenerationProcessor } from './embedding-generation.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'embedding-generation',
    }),
    OpenaiModule,
    EmbeddingsModule,
    PrismaModule,
  ],
  providers: [EmbeddingGenerationProcessor],
  exports: [BullModule],
})
export class JobsModule {}
