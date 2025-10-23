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
exports.VectorSimilarityStrategy = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let VectorSimilarityStrategy = class VectorSimilarityStrategy {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async computeSimilarity(sourceUserId, candidateUserIds) {
        if (candidateUserIds.length === 0) {
            return new Map();
        }
        const sourceEmbedding = await this.prisma.$queryRaw `
      SELECT embedding::text as embedding
      FROM embeddings
      WHERE user_id = ${sourceUserId}::uuid
    `;
        if (sourceEmbedding.length === 0 || !sourceEmbedding[0].embedding) {
            throw new Error(`No embedding found for user ${sourceUserId}. User must complete onboarding first.`);
        }
        const sourceVector = this.parseVector(sourceEmbedding[0].embedding);
        const results = await this.prisma.$queryRaw `
      SELECT
        user_id::text as user_id,
        1 - (embedding <=> ${`[${sourceVector.join(',')}]`}::vector) AS similarity_score
      FROM embeddings
      WHERE user_id = ANY(${candidateUserIds}::uuid[])
        AND embedding IS NOT NULL
      ORDER BY similarity_score DESC
    `;
        const scoreMap = new Map();
        for (const row of results) {
            scoreMap.set(row.user_id, row.similarity_score);
        }
        return scoreMap;
    }
    getName() {
        return 'VectorSimilarityStrategy';
    }
    parseVector(embedding) {
        if (Array.isArray(embedding)) {
            return embedding;
        }
        if (typeof embedding === 'string') {
            const cleaned = embedding.replace(/^\[|\]$/g, '');
            return cleaned.split(',').map((v) => parseFloat(v.trim()));
        }
        throw new Error('Invalid embedding format');
    }
};
exports.VectorSimilarityStrategy = VectorSimilarityStrategy;
exports.VectorSimilarityStrategy = VectorSimilarityStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VectorSimilarityStrategy);
//# sourceMappingURL=vector-similarity.strategy.js.map