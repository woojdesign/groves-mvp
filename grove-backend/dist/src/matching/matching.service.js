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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const intros_service_1 = require("../intros/intros.service");
const email_service_1 = require("../email/email.service");
let MatchingService = class MatchingService {
    matchingEngine;
    prisma;
    introsService;
    emailService;
    constructor(matchingEngine, prisma, introsService, emailService) {
        this.matchingEngine = matchingEngine;
        this.prisma = prisma;
        this.introsService = introsService;
        this.emailService = emailService;
    }
    async getMatchesForUser(userId, options = {}) {
        const existingMatches = await this.prisma.match.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
                status: 'pending',
                expiresAt: { gt: new Date() },
            },
            include: {
                userA: { select: { id: true, name: true } },
                userB: { select: { id: true, name: true } },
            },
            orderBy: { similarityScore: 'desc' },
            take: options.limit || 10,
        });
        if (existingMatches.length > 0) {
            return existingMatches.map((match) => {
                const candidate = match.userAId === userId ? match.userB : match.userA;
                return {
                    id: match.id,
                    candidateId: candidate.id,
                    name: candidate.name,
                    score: match.similarityScore,
                    reason: match.context || '',
                    sharedInterests: match.sharedInterest
                        ? [match.sharedInterest]
                        : [],
                    confidence: match.similarityScore,
                    status: match.status,
                    expiresAt: match.expiresAt?.toISOString(),
                };
            });
        }
        const result = await this.matchingEngine.generateMatches({
            userId,
            limit: options.limit,
            minSimilarityScore: options.minSimilarityScore,
            diversityWeight: options.diversityWeight,
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const currentUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
        });
        const matchDtos = await Promise.all(result.matches.map(async (match) => {
            const candidate = await this.prisma.user.findUnique({
                where: { id: match.candidateUserId },
                select: { id: true, name: true, email: true },
            });
            const storedMatch = await this.prisma.match.create({
                data: {
                    userAId: userId,
                    userBId: match.candidateUserId,
                    similarityScore: match.similarityScore,
                    sharedInterest: match.reasons[0] || 'shared interests',
                    context: match.reasons.join('. '),
                    status: 'pending',
                    expiresAt,
                },
            });
            if (currentUser && candidate) {
                try {
                    await this.emailService.sendMatchNotification(currentUser.email, currentUser.name, {
                        id: storedMatch.id,
                        name: candidate.name,
                        score: match.similarityScore,
                        sharedInterest: match.reasons[0] || 'shared interests',
                        reason: match.reasons.join('. '),
                    });
                }
                catch (error) {
                    console.error('Failed to send match notification:', error);
                }
                try {
                    await this.emailService.sendMatchNotification(candidate.email, candidate.name, {
                        id: storedMatch.id,
                        name: currentUser.name,
                        score: match.similarityScore,
                        sharedInterest: match.reasons[0] || 'shared interests',
                        reason: match.reasons.join('. '),
                    });
                }
                catch (error) {
                    console.error('Failed to send match notification:', error);
                }
            }
            return {
                id: storedMatch.id,
                candidateId: match.candidateUserId,
                name: candidate?.name || 'Unknown User',
                score: match.similarityScore,
                reason: match.reasons.join('. '),
                sharedInterests: this.extractSharedInterests(match.reasons),
                confidence: match.finalScore,
                status: storedMatch.status,
                expiresAt: storedMatch.expiresAt?.toISOString(),
            };
        }));
        return matchDtos;
    }
    extractSharedInterests(reasons) {
        return reasons;
    }
    async acceptMatch(matchId, userId, req) {
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            include: {
                intro: true,
            },
        });
        if (!match) {
            throw new common_1.NotFoundException('Match not found');
        }
        if (match.userAId !== userId && match.userBId !== userId) {
            throw new common_1.ForbiddenException('Not authorized to accept this match');
        }
        if (match.status !== 'pending') {
            throw new common_1.BadRequestException(`Match already ${match.status}. Cannot accept.`);
        }
        if (match.expiresAt && match.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Match has expired');
        }
        const isUserA = match.userAId === userId;
        if (match.intro) {
            const updatedIntro = await this.prisma.intro.update({
                where: { id: match.intro.id },
                data: {
                    ...(isUserA
                        ? { userAStatus: 'accepted' }
                        : { userBStatus: 'accepted' }),
                },
            });
            if (updatedIntro.userAStatus === 'accepted' &&
                updatedIntro.userBStatus === 'accepted') {
                const intro = await this.introsService.createIntroduction(matchId, ipAddress, userAgent);
                await this.prisma.match.update({
                    where: { id: matchId },
                    data: { status: 'accepted' },
                });
                await this.prisma.event.create({
                    data: {
                        userId,
                        eventType: 'match_mutual',
                        metadata: { matchId, introId: intro.id },
                        ipAddress,
                        userAgent,
                    },
                });
                return {
                    status: 'mutual_match',
                    mutualMatch: true,
                    intro: {
                        id: intro.id,
                        status: intro.status,
                    },
                    message: "It's a match! Check your email for an introduction.",
                };
            }
            await this.prisma.event.create({
                data: {
                    userId,
                    eventType: 'match_accepted',
                    metadata: { matchId },
                    ipAddress,
                    userAgent,
                },
            });
            return {
                status: 'accepted',
                mutualMatch: false,
                message: "Your interest has been noted. We'll let you know if they accept too!",
            };
        }
        await this.prisma.intro.create({
            data: {
                matchId,
                userAStatus: isUserA ? 'accepted' : 'pending',
                userBStatus: isUserA ? 'pending' : 'accepted',
                status: isUserA ? 'accepted_by_a' : 'accepted_by_b',
            },
        });
        await this.prisma.event.create({
            data: {
                userId,
                eventType: 'match_accepted',
                metadata: { matchId },
                ipAddress,
                userAgent,
            },
        });
        return {
            status: 'accepted',
            mutualMatch: false,
            message: "Your interest has been noted. We'll let you know if they accept too!",
        };
    }
    async passMatch(matchId, userId) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
        });
        if (!match) {
            throw new common_1.NotFoundException('Match not found');
        }
        if (match.userAId !== userId && match.userBId !== userId) {
            throw new common_1.ForbiddenException('Not authorized to pass on this match');
        }
        if (match.status !== 'pending') {
            throw new common_1.BadRequestException(`Match already ${match.status}. Cannot pass.`);
        }
        await this.prisma.match.update({
            where: { id: matchId },
            data: { status: 'rejected' },
        });
        await this.prisma.event.create({
            data: {
                userId,
                eventType: 'match_passed',
                metadata: { matchId },
            },
        });
        return {
            status: 'passed',
            message: "No worries! We'll find you better matches.",
        };
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('MATCHING_ENGINE')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        intros_service_1.IntrosService,
        email_service_1.EmailService])
], MatchingService);
//# sourceMappingURL=matching.service.js.map