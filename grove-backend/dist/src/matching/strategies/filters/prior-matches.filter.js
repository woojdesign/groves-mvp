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
exports.PriorMatchesFilter = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let PriorMatchesFilter = class PriorMatchesFilter {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async filter(sourceUserId, candidateUserIds) {
        if (candidateUserIds.length === 0) {
            return [];
        }
        const priorMatches = await this.prisma.match.findMany({
            where: {
                OR: [
                    { userAId: sourceUserId },
                    { userBId: sourceUserId },
                ],
            },
            select: {
                userAId: true,
                userBId: true,
            },
        });
        const excludeUserIds = new Set();
        for (const match of priorMatches) {
            const otherUserId = match.userAId === sourceUserId ? match.userBId : match.userAId;
            excludeUserIds.add(otherUserId);
        }
        return candidateUserIds.filter((id) => !excludeUserIds.has(id));
    }
    getName() {
        return 'PriorMatchesFilter';
    }
};
exports.PriorMatchesFilter = PriorMatchesFilter;
exports.PriorMatchesFilter = PriorMatchesFilter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PriorMatchesFilter);
//# sourceMappingURL=prior-matches.filter.js.map