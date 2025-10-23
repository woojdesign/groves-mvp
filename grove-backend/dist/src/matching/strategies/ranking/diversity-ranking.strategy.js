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
exports.DiversityRankingStrategy = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let DiversityRankingStrategy = class DiversityRankingStrategy {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async rerank(sourceUserId, candidates) {
        if (candidates.length === 0) {
            return [];
        }
        const sourceUser = await this.prisma.user.findUnique({
            where: { id: sourceUserId },
            include: {
                profile: true,
                org: true,
            },
        });
        if (!sourceUser || !sourceUser.profile) {
            throw new Error(`Source user ${sourceUserId} not found or has no profile`);
        }
        const candidateIds = candidates.map((c) => c.userId);
        const candidateUsers = await this.prisma.user.findMany({
            where: {
                id: { in: candidateIds },
            },
            include: {
                profile: true,
                org: true,
            },
        });
        const candidateMap = new Map(candidateUsers.map((u) => [u.id, u]));
        const diversityWeight = 0.3;
        const rankedCandidates = candidates.map((candidate) => {
            const candidateUser = candidateMap.get(candidate.userId);
            let diversityScore = 0;
            if (candidateUser && candidateUser.profile) {
                if (candidateUser.orgId !== sourceUser.orgId) {
                    diversityScore += 0.4;
                }
                if (candidateUser.profile.connectionType !==
                    sourceUser.profile.connectionType) {
                    diversityScore += 0.3;
                }
                if (candidateUser.org.domain !== sourceUser.org.domain) {
                    diversityScore += 0.3;
                }
            }
            diversityScore = Math.min(diversityScore, 1.0);
            const finalScore = candidate.similarityScore * (1 - diversityWeight) +
                diversityScore * diversityWeight;
            return {
                ...candidate,
                diversityScore,
                finalScore,
            };
        });
        return rankedCandidates.sort((a, b) => b.finalScore - a.finalScore);
    }
    getName() {
        return 'DiversityRankingStrategy';
    }
};
exports.DiversityRankingStrategy = DiversityRankingStrategy;
exports.DiversityRankingStrategy = DiversityRankingStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DiversityRankingStrategy);
//# sourceMappingURL=diversity-ranking.strategy.js.map