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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OpenaiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenaiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
let OpenaiService = OpenaiService_1 = class OpenaiService {
    configService;
    logger = new common_1.Logger(OpenaiService_1.name);
    openai;
    model;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        this.model =
            this.configService.get('OPENAI_MODEL') ||
                'text-embedding-3-small';
        if (!apiKey || apiKey === 'sk-placeholder') {
            this.logger.warn('OpenAI API key not configured. Embeddings will fail until a valid key is provided.');
        }
        this.openai = new openai_1.default({
            apiKey: apiKey || 'sk-placeholder',
        });
    }
    async generateEmbedding(text) {
        try {
            this.logger.debug(`Generating embedding for text (length: ${text.length})`);
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: text,
                encoding_format: 'float',
            });
            const embedding = response.data[0].embedding;
            const usage = response.usage;
            this.logger.log(`Embedding generated successfully. Tokens used: ${usage.total_tokens}, Dimensions: ${embedding.length}`);
            return embedding;
        }
        catch (error) {
            if (error.status === 429) {
                this.logger.error('OpenAI API rate limit exceeded', error.message);
                throw new Error('Rate limit exceeded. Please try again in a few moments.');
            }
            if (error.status === 401) {
                this.logger.error('OpenAI API authentication failed', error.message);
                throw new Error('Invalid OpenAI API key');
            }
            this.logger.error('Failed to generate embedding', error.message);
            throw new Error(`Embedding generation failed: ${error.message}`);
        }
    }
    preprocessProfileText(nicheInterest, project, rabbitHole) {
        const parts = [
            `Interest: ${nicheInterest.trim()}`,
            `Project: ${project.trim()}`,
        ];
        if (rabbitHole && rabbitHole.trim()) {
            parts.push(`Exploring: ${rabbitHole.trim()}`);
        }
        return parts.join('. ');
    }
};
exports.OpenaiService = OpenaiService;
exports.OpenaiService = OpenaiService = OpenaiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenaiService);
//# sourceMappingURL=openai.service.js.map