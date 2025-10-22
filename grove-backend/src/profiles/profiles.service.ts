import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { EmbeddingJobPayload } from '../jobs/embedding-generation.processor';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private prisma: PrismaService,
    private embeddingsService: EmbeddingsService,
    @InjectQueue('embedding-generation')
    private embeddingQueue: Queue<EmbeddingJobPayload>,
  ) {}

  async createProfile(userId: string, dto: CreateProfileDto) {
    // Check if profile already exists
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('User has already completed onboarding');
    }

    // Create profile
    const profile = await this.prisma.profile.create({
      data: {
        userId,
        nicheInterest: dto.nicheInterest,
        project: dto.project,
        connectionType: dto.connectionType,
        rabbitHole: dto.rabbitHole,
        preferences: dto.preferences,
      },
    });

    // Log event
    await this.prisma.event.create({
      data: {
        userId,
        eventType: 'profile_created',
        metadata: { connectionType: dto.connectionType },
      },
    });

    // Queue embedding generation job
    await this.embeddingQueue.add(
      {
        userId,
        profileId: profile.id,
      },
      {
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay
        },
      },
    );

    this.logger.log(
      `Queued embedding generation job for user ${userId}, profile ${profile.id}`,
    );

    // Get actual embedding status
    const embeddingStatus = await this.getEmbeddingStatus(userId);

    return {
      profile: this.mapToProfileResponse(profile),
      embeddingStatus,
    };
  }

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.mapToProfileResponse(profile);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ profile: ProfileResponseDto; embeddingStatus: string }> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: dto,
    });

    // Log event
    await this.prisma.event.create({
      data: {
        userId,
        eventType: 'profile_updated',
        metadata: { fields: Object.keys(dto) },
      },
    });

    // Trigger embedding regeneration if semantic fields changed
    if (dto.nicheInterest || dto.project || dto.rabbitHole !== undefined) {
      this.logger.log(
        `Profile semantic fields updated for user ${userId}, triggering embedding regeneration`,
      );

      await this.embeddingQueue.add(
        {
          userId,
          profileId: profile.id,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(
        `Queued embedding regeneration job for user ${userId}`,
      );
    }

    // Get actual embedding status
    const embeddingStatus = await this.getEmbeddingStatus(userId);

    return {
      profile: this.mapToProfileResponse(updated),
      embeddingStatus,
    };
  }

  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    return !!profile;
  }

  /**
   * Get the embedding status for a user
   * @param userId - The user ID
   * @returns "pending" | "processing" | "completed" | "failed"
   */
  async getEmbeddingStatus(userId: string): Promise<string> {
    try {
      // Check if embedding exists in database
      const hasEmbedding = await this.embeddingsService.hasEmbedding(userId);

      if (hasEmbedding) {
        return 'completed';
      }

      // Check if there's a pending/active job in the queue
      const jobs = await this.embeddingQueue.getJobs([
        'waiting',
        'active',
        'delayed',
      ]);

      const userJob = jobs.find((job) => job.data.userId === userId);

      if (userJob) {
        const state = await userJob.getState();
        if (state === 'active') {
          return 'processing';
        }
        return 'pending';
      }

      // Check for failed jobs
      const failedJobs = await this.embeddingQueue.getJobs(['failed']);
      const userFailedJob = failedJobs.find((job) => job.data.userId === userId);

      if (userFailedJob) {
        return 'failed';
      }

      // Default to pending if profile exists but no embedding
      return 'pending';
    } catch (error) {
      this.logger.error(
        `Failed to get embedding status for user ${userId}`,
        error.message,
      );
      return 'pending';
    }
  }

  private mapToProfileResponse(profile: any): ProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      nicheInterest: profile.nicheInterest,
      project: profile.project,
      connectionType: profile.connectionType,
      rabbitHole: profile.rabbitHole,
      preferences: profile.preferences,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
