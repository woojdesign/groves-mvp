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
var EmbeddingGenerationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingGenerationProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const openai_service_1 = require("../openai/openai.service");
const embeddings_service_1 = require("../embeddings/embeddings.service");
const prisma_service_1 = require("../prisma/prisma.service");
let EmbeddingGenerationProcessor = EmbeddingGenerationProcessor_1 = class EmbeddingGenerationProcessor {
    openaiService;
    embeddingsService;
    prisma;
    logger = new common_1.Logger(EmbeddingGenerationProcessor_1.name);
    constructor(openaiService, embeddingsService, prisma) {
        this.openaiService = openaiService;
        this.embeddingsService = embeddingsService;
        this.prisma = prisma;
    }
    async handleEmbeddingGeneration(job) {
        const { userId, profileId } = job.data;
        this.logger.log(`Processing embedding generation job for user ${userId}, profile ${profileId}`);
        try {
            const profile = await this.prisma.profile.findUnique({
                where: { id: profileId },
            });
            if (!profile) {
                throw new Error(`Profile ${profileId} not found`);
            }
            this.logger.debug(`Profile retrieved for user ${userId}`);
            const text = this.openaiService.preprocessProfileText(profile.nicheInterest, profile.project, profile.rabbitHole || undefined);
            this.logger.debug(`Profile text prepared: "${text.substring(0, 100)}..."`);
            const vector = await this.openaiService.generateEmbedding(text);
            this.logger.debug(`Embedding generated for user ${userId} (${vector.length} dimensions)`);
            await this.embeddingsService.createEmbedding(userId, vector);
            this.logger.log(`Successfully generated and stored embedding for user ${userId}`);
            return {
                success: true,
                userId,
                profileId,
                dimensions: vector.length,
            };
        }
        catch (error) {
            this.logger.error(`Failed to generate embedding for user ${userId}`, error.stack);
            throw error;
        }
    }
};
exports.EmbeddingGenerationProcessor = EmbeddingGenerationProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmbeddingGenerationProcessor.prototype, "handleEmbeddingGeneration", null);
exports.EmbeddingGenerationProcessor = EmbeddingGenerationProcessor = EmbeddingGenerationProcessor_1 = __decorate([
    (0, bull_1.Processor)('embedding-generation'),
    __metadata("design:paramtypes", [openai_service_1.OpenaiService,
        embeddings_service_1.EmbeddingsService,
        prisma_service_1.PrismaService])
], EmbeddingGenerationProcessor);
//# sourceMappingURL=embedding-generation.processor.js.map