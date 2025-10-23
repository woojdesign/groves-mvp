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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const encryption_service_1 = require("../encryption/encryption.service");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    encryptionService;
    logger = new common_1.Logger(PrismaService_1.name);
    constructor(encryptionService) {
        super();
        this.encryptionService = encryptionService;
    }
    async onModuleInit() {
        await this.$connect();
        console.log('✅ Database connected');
        if (process.env.NODE_ENV === 'development') {
            this.$use(async (params, next) => {
                const before = Date.now();
                const result = await next(params);
                const after = Date.now();
                this.logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
                return result;
            });
        }
        this.setupEncryptionMiddleware();
    }
    setupEncryptionMiddleware() {
        const encryptedFields = {
            User: ['email', 'name'],
            Profile: ['nicheInterest', 'project', 'rabbitHole'],
        };
        this.$use(async (params, next) => {
            const { model, action, args } = params;
            if (!model || !encryptedFields[model]) {
                return next(params);
            }
            if (action === 'create' || action === 'update' || action === 'upsert') {
                const fields = encryptedFields[model];
                const dataToEncrypt = action === 'upsert'
                    ? [args.create, args.update]
                    : [args.data];
                for (const data of dataToEncrypt) {
                    if (data) {
                        for (const field of fields) {
                            if (data[field] !== undefined && data[field] !== null) {
                                data[field] = this.encryptionService.encrypt(data[field]);
                            }
                        }
                    }
                }
            }
            return next(params);
        });
        this.$use(async (params, next) => {
            const result = await next(params);
            const { model } = params;
            if (!model || !encryptedFields[model]) {
                return result;
            }
            const fields = encryptedFields[model];
            if (result) {
                if (Array.isArray(result)) {
                    for (const item of result) {
                        this.decryptFields(item, fields);
                    }
                }
                else if (typeof result === 'object') {
                    this.decryptFields(result, fields);
                }
            }
            return result;
        });
        if (this.encryptionService.isEnabled()) {
            this.logger.log('Field-level encryption middleware active for User and Profile models');
        }
    }
    decryptFields(obj, fields) {
        if (!obj)
            return;
        for (const field of fields) {
            if (obj[field] !== undefined && obj[field] !== null) {
                obj[field] = this.encryptionService.decrypt(obj[field]);
            }
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
        console.log('👋 Database disconnected');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(encryption_service_1.EncryptionService)),
    __metadata("design:paramtypes", [encryption_service_1.EncryptionService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map