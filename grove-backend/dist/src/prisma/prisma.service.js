"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = exports.tenantContext = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const async_hooks_1 = require("async_hooks");
exports.tenantContext = new async_hooks_1.AsyncLocalStorage();
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        await this.$connect();
        console.log('✅ Database connected');
        this.$use(async (params, next) => {
            const context = exports.tenantContext.getStore();
            if (!context) {
                return next(params);
            }
            const { orgId } = context;
            const tenantModels = [
                'User',
                'Profile',
                'Match',
                'Embedding',
                'Feedback',
                'SafetyFlag',
            ];
            if (tenantModels.includes(params.model || '')) {
                if (params.action === 'findUnique' || params.action === 'findFirst') {
                    params.args.where = {
                        ...params.args.where,
                        org: { id: orgId },
                    };
                }
                if (params.action === 'findMany') {
                    if (!params.args)
                        params.args = {};
                    if (!params.args.where)
                        params.args.where = {};
                    params.args.where = {
                        ...params.args.where,
                        org: { id: orgId },
                    };
                }
                if (params.action === 'create' || params.action === 'update') {
                    if (params.args.data && !params.args.data.orgId) {
                        params.args.data.orgId = orgId;
                    }
                }
            }
            return next(params);
        });
    }
    async onModuleDestroy() {
        await this.$disconnect();
        console.log('👋 Database disconnected');
    }
    async withOrgContext(orgId, userId, fn) {
        return exports.tenantContext.run({ orgId, userId }, fn);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map