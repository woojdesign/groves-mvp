import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    event: {
      create: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockProfileDto: CreateProfileDto = {
    nicheInterest: 'Urban beekeeping and teaching people about pollinators in cities',
    project: 'Building a community garden database to track crop yields across neighborhoods',
    connectionType: 'collaboration',
    rabbitHole: 'Recently went deep on permaculture principles',
    preferences: 'I prefer async communication first',
  };

  const mockProfile = {
    id: 'profile-123',
    userId: mockUserId,
    nicheInterest: mockProfileDto.nicheInterest,
    project: mockProfileDto.project,
    connectionType: mockProfileDto.connectionType,
    rabbitHole: mockProfileDto.rabbitHole,
    preferences: mockProfileDto.preferences,
    createdAt: new Date('2025-10-22T10:00:00Z'),
    updatedAt: new Date('2025-10-22T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProfile', () => {
    it('should create a profile successfully', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);
      mockPrismaService.profile.create.mockResolvedValue(mockProfile);
      mockPrismaService.event.create.mockResolvedValue({});

      const result = await service.createProfile(mockUserId, mockProfileDto);

      expect(result).toEqual({
        profile: {
          id: mockProfile.id,
          userId: mockProfile.userId,
          nicheInterest: mockProfile.nicheInterest,
          project: mockProfile.project,
          connectionType: mockProfile.connectionType,
          rabbitHole: mockProfile.rabbitHole,
          preferences: mockProfile.preferences,
          createdAt: mockProfile.createdAt,
          updatedAt: mockProfile.updatedAt,
        },
        embeddingStatus: 'queued',
      });

      expect(mockPrismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(mockPrismaService.profile.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          nicheInterest: mockProfileDto.nicheInterest,
          project: mockProfileDto.project,
          connectionType: mockProfileDto.connectionType,
          rabbitHole: mockProfileDto.rabbitHole,
          preferences: mockProfileDto.preferences,
        },
      });
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          eventType: 'profile_created',
          metadata: { connectionType: mockProfileDto.connectionType },
        },
      });
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);

      await expect(
        service.createProfile(mockUserId, mockProfileDto),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createProfile(mockUserId, mockProfileDto),
      ).rejects.toThrow('User has already completed onboarding');

      expect(mockPrismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(mockPrismaService.profile.create).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return profile for valid userId', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile(mockUserId);

      expect(result).toEqual({
        id: mockProfile.id,
        userId: mockProfile.userId,
        nicheInterest: mockProfile.nicheInterest,
        project: mockProfile.project,
        connectionType: mockProfile.connectionType,
        rabbitHole: mockProfile.rabbitHole,
        preferences: mockProfile.preferences,
        createdAt: mockProfile.createdAt,
        updatedAt: mockProfile.updatedAt,
      });

      expect(mockPrismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getProfile(mockUserId)).rejects.toThrow(
        'Profile not found',
      );
    });
  });

  describe('updateProfile', () => {
    const updateDto: UpdateProfileDto = {
      preferences: 'Updated preferences',
    };

    const updatedProfile = {
      ...mockProfile,
      preferences: updateDto.preferences,
      updatedAt: new Date('2025-10-22T11:00:00Z'),
    };

    it('should update profile successfully', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.profile.update.mockResolvedValue(updatedProfile);
      mockPrismaService.event.create.mockResolvedValue({});

      const result = await service.updateProfile(mockUserId, updateDto);

      expect(result).toEqual({
        profile: {
          id: updatedProfile.id,
          userId: updatedProfile.userId,
          nicheInterest: updatedProfile.nicheInterest,
          project: updatedProfile.project,
          connectionType: updatedProfile.connectionType,
          rabbitHole: updatedProfile.rabbitHole,
          preferences: updatedProfile.preferences,
          createdAt: updatedProfile.createdAt,
          updatedAt: updatedProfile.updatedAt,
        },
        embeddingStatus: 'queued',
      });

      expect(mockPrismaService.profile.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: updateDto,
      });
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          eventType: 'profile_updated',
          metadata: { fields: Object.keys(updateDto) },
        },
      });
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile(mockUserId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateProfile(mockUserId, updateDto)).rejects.toThrow(
        'Profile not found',
      );

      expect(mockPrismaService.profile.update).not.toHaveBeenCalled();
    });
  });

  describe('hasCompletedOnboarding', () => {
    it('should return true if profile exists', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({ id: 'profile-123' });

      const result = await service.hasCompletedOnboarding(mockUserId);

      expect(result).toBe(true);
      expect(mockPrismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: { id: true },
      });
    });

    it('should return false if profile does not exist', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      const result = await service.hasCompletedOnboarding(mockUserId);

      expect(result).toBe(false);
    });
  });
});
