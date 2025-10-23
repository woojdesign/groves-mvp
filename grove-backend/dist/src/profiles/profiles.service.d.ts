import type { Queue } from 'bull';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { EmbeddingJobPayload } from '../jobs/embedding-generation.processor';
export declare class ProfilesService {
    private prisma;
    private embeddingsService;
    private embeddingQueue;
    private readonly logger;
    constructor(prisma: PrismaService, embeddingsService: EmbeddingsService, embeddingQueue: Queue<EmbeddingJobPayload>);
    createProfile(userId: string, dto: CreateProfileDto, req: Request): Promise<{
        profile: ProfileResponseDto;
        embeddingStatus: string;
    }>;
    getProfile(userId: string): Promise<ProfileResponseDto>;
    updateProfile(userId: string, dto: UpdateProfileDto, req: Request): Promise<{
        profile: ProfileResponseDto;
        embeddingStatus: string;
    }>;
    hasCompletedOnboarding(userId: string): Promise<boolean>;
    getEmbeddingStatus(userId: string): Promise<string>;
    private mapToProfileResponse;
}
