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
let MatchingService = class MatchingService {
    matchingEngine;
    prisma;
    constructor(matchingEngine, prisma) {
        this.matchingEngine = matchingEngine;
        this.prisma = prisma;
    }
    async getMatchesForUser(userId, options = {}) {
        const result = await this.matchingEngine.generateMatches({
            userId,
            limit: options.limit,
            minSimilarityScore: options.minSimilarityScore,
            diversityWeight: options.diversityWeight,
        });
        const matchDtos = await Promise.all(result.matches.map(async (match) => {
            const candidate = await this.prisma.user.findUnique({
                where: { id: match.candidateUserId },
                select: { id: true, name: true },
            });
            return {
                candidateId: match.candidateUserId,
                name: candidate?.name || 'Unknown User',
                score: match.similarityScore,
                reason: match.reasons.join('. '),
                sharedInterests: this.extractSharedInterests(match.reasons),
                confidence: match.finalScore,
            };
        }));
        return matchDtos;
    }
    extractSharedInterests(reasons) {
        return reasons;
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('MATCHING_ENGINE')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService])
], MatchingService);
//# sourceMappingURL=matching.service.js.map