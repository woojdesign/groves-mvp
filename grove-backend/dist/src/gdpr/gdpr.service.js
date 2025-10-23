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
var GdprService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GdprService = GdprService_1 = class GdprService {
    prisma;
    logger = new common_1.Logger(GdprService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportUserData(userId, req) {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';
        this.logger.log(`Data export requested for user: ${userId}`);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                embedding: true,
                matchesAsA: {
                    include: {
                        userB: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
                matchesAsB: {
                    include: {
                        userA: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
                feedback: true,
                reportsMade: true,
                reportsReceived: true,
                events: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.event.create({
            data: {
                userId,
                eventType: 'data_export',
                metadata: { format: 'json' },
                ipAddress,
                userAgent,
            },
        });
        return {
            exportDate: new Date().toISOString(),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                status: user.status,
                role: user.role,
                orgId: user.orgId,
                ssoProvider: user.ssoProvider,
                ssoSubject: user.ssoSubject,
                createdAt: user.createdAt,
                lastActive: user.lastActive,
            },
            profile: user.profile
                ? {
                    id: user.profile.id,
                    nicheInterest: user.profile.nicheInterest,
                    project: user.profile.project,
                    connectionType: user.profile.connectionType,
                    rabbitHole: user.profile.rabbitHole,
                    preferences: user.profile.preferences,
                    createdAt: user.profile.createdAt,
                    updatedAt: user.profile.updatedAt,
                }
                : null,
            matches: [
                ...user.matchesAsA.map((match) => ({
                    id: match.id,
                    otherUser: match.userB,
                    similarityScore: match.similarityScore,
                    sharedInterest: match.sharedInterest,
                    status: match.status,
                    createdAt: match.createdAt,
                    expiresAt: match.expiresAt,
                })),
                ...user.matchesAsB.map((match) => ({
                    id: match.id,
                    otherUser: match.userA,
                    similarityScore: match.similarityScore,
                    sharedInterest: match.sharedInterest,
                    status: match.status,
                    createdAt: match.createdAt,
                    expiresAt: match.expiresAt,
                })),
            ],
            feedback: user.feedback.map((f) => ({
                id: f.id,
                introId: f.introId,
                didMeet: f.didMeet,
                helpful: f.helpful,
                note: f.note,
                createdAt: f.createdAt,
            })),
            safetyReports: {
                reported: user.reportsMade.map((sf) => ({
                    id: sf.id,
                    reportedUserId: sf.reportedId,
                    reason: sf.reason,
                    comment: sf.comment,
                    status: sf.status,
                    createdAt: sf.createdAt,
                })),
                received: user.reportsReceived.map((sf) => ({
                    id: sf.id,
                    reporterUserId: sf.reporterId,
                    reason: sf.reason,
                    status: sf.status,
                    createdAt: sf.createdAt,
                })),
            },
            activityLog: user.events.map((event) => ({
                id: event.id,
                eventType: event.eventType,
                metadata: event.metadata,
                ipAddress: event.ipAddress,
                userAgent: event.userAgent,
                createdAt: event.createdAt,
            })),
        };
    }
    async deleteUserData(userId, req) {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';
        this.logger.warn(`Hard delete requested for user: ${userId}`);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.event.create({
            data: {
                userId,
                eventType: 'data_deletion',
                metadata: { type: 'hard_delete', reason: 'user_requested' },
                ipAddress,
                userAgent,
            },
        });
        await this.prisma.user.delete({
            where: { id: userId },
        });
        this.logger.log(`User ${userId} and all related data permanently deleted`);
        return {
            message: 'All your data has been permanently deleted',
        };
    }
    async recordConsent(userId, consentType, version, req) {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';
        this.logger.log(`Consent recorded for user ${userId}: ${consentType} v${version}`);
        await this.prisma.event.create({
            data: {
                userId,
                eventType: 'consent_recorded',
                metadata: {
                    consentType,
                    version,
                    acceptedAt: new Date().toISOString(),
                },
                ipAddress,
                userAgent,
            },
        });
        return { success: true };
    }
};
exports.GdprService = GdprService;
exports.GdprService = GdprService = GdprService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GdprService);
//# sourceMappingURL=gdpr.service.js.map