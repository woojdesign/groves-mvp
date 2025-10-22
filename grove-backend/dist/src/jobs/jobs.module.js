"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const openai_module_1 = require("../openai/openai.module");
const embeddings_module_1 = require("../embeddings/embeddings.module");
const prisma_module_1 = require("../prisma/prisma.module");
const embedding_generation_processor_1 = require("./embedding-generation.processor");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    redis: {
                        host: configService.get('REDIS_HOST') || 'localhost',
                        port: configService.get('REDIS_PORT') || 6379,
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            bull_1.BullModule.registerQueue({
                name: 'embedding-generation',
            }),
            openai_module_1.OpenaiModule,
            embeddings_module_1.EmbeddingsModule,
            prisma_module_1.PrismaModule,
        ],
        providers: [embedding_generation_processor_1.EmbeddingGenerationProcessor],
        exports: [bull_1.BullModule],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map