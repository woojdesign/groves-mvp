import type { Job } from 'bull';
import { OpenaiService } from '../openai/openai.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PrismaService } from '../prisma/prisma.service';
export interface EmbeddingJobPayload {
    userId: string;
    profileId: string;
}
export declare class EmbeddingGenerationProcessor {
    private openaiService;
    private embeddingsService;
    private prisma;
    private readonly logger;
    constructor(openaiService: OpenaiService, embeddingsService: EmbeddingsService, prisma: PrismaService);
    handleEmbeddingGeneration(job: Job<EmbeddingJobPayload>): Promise<{
        success: boolean;
        userId: string;
        profileId: string;
        dimensions: number;
    }>;
}
