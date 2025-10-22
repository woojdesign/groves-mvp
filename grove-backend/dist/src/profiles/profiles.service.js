"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProfilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
const embeddings_service_1 = require("../embeddings/embeddings.service");
let ProfilesService = ProfilesService_1 = class ProfilesService {
    prisma;
    embeddingsService;
    embeddingQueue;
    logger = new common_1.Logger(ProfilesService_1.name);
    constructor(prisma, embeddingsService, embeddingQueue) {
        this.prisma = prisma;
        this.embeddingsService = embeddingsService;
        this.embeddingQueue = embeddingQueue;
    }
    async createProfile(userId, dto) {
        const existing = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (existing) {
            throw new common_1.ConflictException('User has already completed onboarding');
        }
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
        await this.prisma.event.create({
            data: {
                userId,
                eventType: 'profile_created',
                metadata: { connectionType: dto.connectionType },
            },
        });
        await this.embeddingQueue.add({
            userId,
            profileId: profile.id,
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
        this.logger.log(`Queued embedding generation job for user ${userId}, profile ${profile.id}`);
        const embeddingStatus = await this.getEmbeddingStatus(userId);
        return {
            profile: this.mapToProfileResponse(profile),
            embeddingStatus,
        };
    }
    async getProfile(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return this.mapToProfileResponse(profile);
    }
    async updateProfile(userId, dto) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const updated = await this.prisma.profile.update({
            where: { userId },
            data: dto,
        });
        await this.prisma.event.create({
            data: {
                userId,
                eventType: 'profile_updated',
                metadata: { fields: Object.keys(dto) },
            },
        });
        if (dto.nicheInterest || dto.project || dto.rabbitHole !== undefined) {
            this.logger.log(`Profile semantic fields updated for user ${userId}, triggering embedding regeneration`);
            await this.embeddingQueue.add({
                userId,
                profileId: profile.id,
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });
            this.logger.log(`Queued embedding regeneration job for user ${userId}`);
        }
        const embeddingStatus = await this.getEmbeddingStatus(userId);
        return {
            profile: this.mapToProfileResponse(updated),
            embeddingStatus,
        };
    }
    async hasCompletedOnboarding(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            select: { id: true },
        });
        return !!profile;
    }
    async getEmbeddingStatus(userId) {
        try {
            const hasEmbedding = await this.embeddingsService.hasEmbedding(userId);
            if (hasEmbedding) {
                return 'completed';
            }
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
            const failedJobs = await this.embeddingQueue.getJobs(['failed']);
            const userFailedJob = failedJobs.find((job) => job.data.userId === userId);
            if (userFailedJob) {
                return 'failed';
            }
            return 'pending';
        }
        catch (error) {
            this.logger.error(`Failed to get embedding status for user ${userId}`, error.message);
            return 'pending';
        }
    }
    mapToProfileResponse(profile) {
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
};
exports.ProfilesService = ProfilesService;
exports.ProfilesService = ProfilesService = ProfilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)('embedding-generation')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        embeddings_service_1.EmbeddingsService, Object])
], ProfilesService);
//# sourceMappingURL=profiles.service.js.map