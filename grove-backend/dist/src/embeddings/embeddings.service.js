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
var EmbeddingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EmbeddingsService = EmbeddingsService_1 = class EmbeddingsService {
    prisma;
    logger = new common_1.Logger(EmbeddingsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEmbedding(userId, vector) {
        try {
            this.logger.debug(`Storing embedding for user ${userId} (${vector.length} dimensions)`);
            const vectorString = `[${vector.join(',')}]`;
            const result = await this.prisma.$executeRaw `
        INSERT INTO embeddings (id, user_id, vector, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${userId}::uuid,
          ${vectorString}::vector,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
          vector = ${vectorString}::vector,
          updated_at = NOW()
        RETURNING id, user_id, created_at, updated_at
      `;
            this.logger.log(`Embedding stored successfully for user ${userId}`);
            const embedding = await this.prisma.embedding.findUnique({
                where: { userId },
            });
            return embedding;
        }
        catch (error) {
            this.logger.error(`Failed to store embedding for user ${userId}`, error.message);
            throw new Error(`Embedding storage failed: ${error.message}`);
        }
    }
    async getEmbeddingByUserId(userId) {
        try {
            const embedding = await this.prisma.embedding.findUnique({
                where: { userId },
            });
            return embedding;
        }
        catch (error) {
            this.logger.error(`Failed to get embedding for user ${userId}`, error.message);
            throw error;
        }
    }
    async hasEmbedding(userId) {
        try {
            const count = await this.prisma.embedding.count({
                where: { userId },
            });
            return count > 0;
        }
        catch (error) {
            this.logger.error(`Failed to check embedding for user ${userId}`, error.message);
            return false;
        }
    }
    async deleteEmbedding(userId) {
        try {
            await this.prisma.embedding.deleteMany({
                where: { userId },
            });
            this.logger.log(`Embedding deleted for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete embedding for user ${userId}`, error.message);
            throw error;
        }
    }
};
exports.EmbeddingsService = EmbeddingsService;
exports.EmbeddingsService = EmbeddingsService = EmbeddingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmbeddingsService);
//# sourceMappingURL=embeddings.service.js.map