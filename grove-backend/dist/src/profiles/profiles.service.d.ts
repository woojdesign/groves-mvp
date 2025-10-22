import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
export declare class ProfilesService {
    private prisma;
    constructor(prisma: PrismaService);
    createProfile(userId: string, dto: CreateProfileDto): Promise<{
        profile: ProfileResponseDto;
        embeddingStatus: string;
    }>;
    getProfile(userId: string): Promise<ProfileResponseDto>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        profile: ProfileResponseDto;
        embeddingStatus: string;
    }>;
    hasCompletedOnboarding(userId: string): Promise<boolean>;
    private mapToProfileResponse;
}
