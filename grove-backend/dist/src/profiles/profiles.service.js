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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProfilesService = class ProfilesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
        return {
            profile: this.mapToProfileResponse(profile),
            embeddingStatus: 'queued',
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
        return {
            profile: this.mapToProfileResponse(updated),
            embeddingStatus: 'queued',
        };
    }
    async hasCompletedOnboarding(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            select: { id: true },
        });
        return !!profile;
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
exports.ProfilesService = ProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfilesService);
//# sourceMappingURL=profiles.service.js.map