import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenaiModule } from '../openai/openai.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingGenerationProcessor } from './embedding-generation.processor';
import { PersonaGenerationProcessor } from '../dev/persona-generation.processor';

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
    BullModule.registerQueue({
      name: 'persona-generation',
    }),
    OpenaiModule,
    EmbeddingsModule,
    PrismaModule,
    // Use forwardRef to avoid circular dependency with DevModule
    forwardRef(() => require('../dev/dev.module').DevModule),
  ],
  providers: [EmbeddingGenerationProcessor, PersonaGenerationProcessor],
  exports: [BullModule],
})
export class JobsModule {}
