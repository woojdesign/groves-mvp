import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { OpenaiService } from '../openai/openai.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PrismaService } from '../prisma/prisma.service';

export interface EmbeddingJobPayload {
  userId: string;
  profileId: string;
}

@Processor('embedding-generation')
export class EmbeddingGenerationProcessor {
  private readonly logger = new Logger(EmbeddingGenerationProcessor.name);

  constructor(
    private openaiService: OpenaiService,
    private embeddingsService: EmbeddingsService,
    private prisma: PrismaService,
  ) {}

  @Process()
  async handleEmbeddingGeneration(job: Job<EmbeddingJobPayload>) {
    const { userId, profileId } = job.data;

    this.logger.log(
      `Processing embedding generation job for user ${userId}, profile ${profileId}`,
    );

    try {
      // Step 1: Fetch the profile from database
      const profile = await this.prisma.profile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new Error(`Profile ${profileId} not found`);
      }

      this.logger.debug(`Profile retrieved for user ${userId}`);

      // Step 2: Preprocess profile text
      const text = this.openaiService.preprocessProfileText(
        profile.interests,
        profile.project,
        profile.deepDive || undefined,
      );

      this.logger.debug(`Profile text prepared: "${text.substring(0, 100)}..."`);

      // Step 3: Generate embedding using OpenAI
      const vector = await this.openaiService.generateEmbedding(text);

      this.logger.debug(
        `Embedding generated for user ${userId} (${vector.length} dimensions)`,
      );

      // Step 4: Store embedding in database
      await this.embeddingsService.createEmbedding(userId, vector);

      this.logger.log(
        `Successfully generated and stored embedding for user ${userId}`,
      );

      return {
        success: true,
        userId,
        profileId,
        dimensions: vector.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding for user ${userId}`,
        error.stack,
      );

      // Re-throw to trigger Bull's retry mechanism
      throw error;
    }
  }
}
