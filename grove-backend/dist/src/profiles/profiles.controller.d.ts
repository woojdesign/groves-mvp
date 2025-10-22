import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { User } from '@prisma/client';
export declare class ProfilesController {
    private profilesService;
    constructor(profilesService: ProfilesService);
    createProfile(user: User, dto: CreateProfileDto): Promise<{
        profile: import("./dto/profile-response.dto").ProfileResponseDto;
        embeddingStatus: string;
    }>;
    getProfile(user: User): Promise<import("./dto/profile-response.dto").ProfileResponseDto>;
    updateProfile(user: User, dto: UpdateProfileDto): Promise<{
        profile: import("./dto/profile-response.dto").ProfileResponseDto;
        embeddingStatus: string;
    }>;
    getEmbeddingStatus(user: User): Promise<{
        status: string;
    }>;
}
