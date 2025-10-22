import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

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

    // Return profile with embedding status placeholder
    // Phase 4 will implement actual embedding generation
    return {
      profile: this.mapToProfileResponse(profile),
      embeddingStatus: 'queued',
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

    // Phase 4: Trigger embedding regeneration if interests changed
    // if (dto.nicheInterest || dto.project || dto.rabbitHole) {
    //   await this.embeddingsQueue.add('regenerate', { userId });
    // }

    return {
      profile: this.mapToProfileResponse(updated),
      embeddingStatus: 'queued',
    };
  }

  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    return !!profile;
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
