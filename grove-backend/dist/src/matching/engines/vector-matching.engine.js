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
exports.VectorMatchingEngine = void 0;
const common_1 = require("@nestjs/common");
const base_matching_engine_1 = require("./base-matching.engine");
const prisma_service_1 = require("../../prisma/prisma.service");
let VectorMatchingEngine = class VectorMatchingEngine extends base_matching_engine_1.BaseMatchingEngine {
    prisma;
    constructor(prisma, matchingStrategy, filterStrategy, rankingStrategy) {
        super(matchingStrategy, filterStrategy, rankingStrategy);
        this.prisma = prisma;
    }
    async getCandidatePool(sourceUserId) {
        const candidates = await this.prisma.user.findMany({
            where: {
                id: { not: sourceUserId },
                status: 'active',
                embedding: {
                    isNot: null,
                },
            },
            select: {
                id: true,
            },
            take: 100,
        });
        return candidates.map((u) => u.id);
    }
    async generateReasons(sourceUserId, candidateUserId) {
        const [sourceProfile, candidateProfile] = await Promise.all([
            this.prisma.profile.findUnique({
                where: { userId: sourceUserId },
            }),
            this.prisma.profile.findUnique({
                where: { userId: candidateUserId },
            }),
        ]);
        if (!sourceProfile || !candidateProfile) {
            return ['Similar interests and values'];
        }
        const reasons = [];
        if (sourceProfile.connectionType === candidateProfile.connectionType) {
            const typeLabel = this.formatConnectionType(sourceProfile.connectionType);
            reasons.push(`Both seeking ${typeLabel}`);
        }
        const sharedTopics = this.extractSharedTopics(sourceProfile.nicheInterest + ' ' + sourceProfile.project, candidateProfile.nicheInterest + ' ' + candidateProfile.project);
        if (sharedTopics.length > 0) {
            reasons.push(`You both mentioned ${sharedTopics[0]}`);
        }
        if (sourceProfile.rabbitHole && candidateProfile.rabbitHole) {
            const rabbitHoleTopics = this.extractSharedTopics(sourceProfile.rabbitHole, candidateProfile.rabbitHole);
            if (rabbitHoleTopics.length > 0) {
                reasons.push(`Both exploring ${rabbitHoleTopics[0]}`);
            }
        }
        if (reasons.length === 0) {
            reasons.push('Similar interests and values');
        }
        return reasons.slice(0, 3);
    }
    formatConnectionType(connectionType) {
        const labels = {
            collaboration: 'collaboration',
            mentorship: 'mentorship',
            friendship: 'friendship',
            knowledge_exchange: 'knowledge exchange',
        };
        return labels[connectionType] || connectionType;
    }
    extractSharedTopics(text1, text2) {
        const words1 = this.tokenize(text1.toLowerCase());
        const words2 = this.tokenize(text2.toLowerCase());
        const commonWords = words1.filter((word) => words2.includes(word));
        const meaningfulWords = commonWords.filter((word) => word.length > 4 && !this.isStopword(word));
        return [...new Set(meaningfulWords)].slice(0, 3);
    }
    tokenize(text) {
        return text
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length > 0);
    }
    isStopword(word) {
        const stopwords = new Set([
            'the',
            'and',
            'for',
            'with',
            'this',
            'that',
            'from',
            'have',
            'been',
            'about',
            'into',
            'through',
            'during',
            'before',
            'after',
            'above',
            'below',
            'between',
            'under',
            'again',
            'further',
            'then',
            'once',
        ]);
        return stopwords.has(word);
    }
};
exports.VectorMatchingEngine = VectorMatchingEngine;
exports.VectorMatchingEngine = VectorMatchingEngine = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('MATCHING_STRATEGY')),
    __param(2, (0, common_1.Inject)('FILTER_STRATEGY')),
    __param(3, (0, common_1.Inject)('RANKING_STRATEGY')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, Object, Object])
], VectorMatchingEngine);
//# sourceMappingURL=vector-matching.engine.js.map