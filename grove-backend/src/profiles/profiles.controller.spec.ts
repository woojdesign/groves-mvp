import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '@prisma/client';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let service: ProfilesService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    orgId: 'org-123',
    status: 'active',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProfileDto: CreateProfileDto = {
    interests: 'Urban beekeeping and teaching people about pollinators in cities',
    project: 'Building a community garden database to track crop yields across neighborhoods',
    connectionType: 'collaboration',
    deepDive: 'Recently went deep on permaculture principles',
    preferences: 'I prefer async communication first',
  };

  const mockProfileResponse = {
    id: 'profile-123',
    userId: mockUser.id,
    interests: mockProfileDto.interests,
    project: mockProfileDto.project,
    connectionType: mockProfileDto.connectionType,
    deepDive: mockProfileDto.deepDive,
    preferences: mockProfileDto.preferences,
    createdAt: new Date('2025-10-22T10:00:00Z'),
    updatedAt: new Date('2025-10-22T10:00:00Z'),
  };

  const mockProfilesService = {
    createProfile: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: mockProfilesService,
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProfile', () => {
    it('should create a profile successfully', async () => {
      const expectedResult = {
        profile: mockProfileResponse,
        embeddingStatus: 'queued',
      };

      mockProfilesService.createProfile.mockResolvedValue(expectedResult);

      const result = await controller.createProfile(mockUser, mockProfileDto);

      expect(result).toEqual(expectedResult);
      expect(mockProfilesService.createProfile).toHaveBeenCalledWith(
        mockUser.id,
        mockProfileDto,
      );
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockProfilesService.createProfile.mockRejectedValue(
        new ConflictException('User has already completed onboarding'),
      );

      await expect(
        controller.createProfile(mockUser, mockProfileDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockProfilesService.getProfile.mockResolvedValue(mockProfileResponse);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockProfileResponse);
      expect(mockProfilesService.getProfile).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockProfilesService.getProfile.mockRejectedValue(
        new NotFoundException('Profile not found'),
      );

      await expect(controller.getProfile(mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    const updateDto: UpdateProfileDto = {
      preferences: 'Updated preferences',
    };

    const updatedProfileResponse = {
      ...mockProfileResponse,
      preferences: updateDto.preferences,
      updatedAt: new Date('2025-10-22T11:00:00Z'),
    };

    it('should update profile successfully', async () => {
      const expectedResult = {
        profile: updatedProfileResponse,
        embeddingStatus: 'queued',
      };

      mockProfilesService.updateProfile.mockResolvedValue(expectedResult);

      const result = await controller.updateProfile(mockUser, updateDto);

      expect(result).toEqual(expectedResult);
      expect(mockProfilesService.updateProfile).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockProfilesService.updateProfile.mockRejectedValue(
        new NotFoundException('Profile not found'),
      );

      await expect(controller.updateProfile(mockUser, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
