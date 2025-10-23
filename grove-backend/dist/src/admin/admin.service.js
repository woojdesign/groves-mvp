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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getRequestMetadata(req) {
        if (!req) {
            return { ipAddress: 'system', userAgent: 'system' };
        }
        return {
            ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown',
        };
    }
    async createUser(dto, adminId, orgId, req) {
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                orgId,
                role: dto.role || 'user',
                ssoProvider: dto.ssoProvider || 'magic_link',
            },
        });
        const { ipAddress, userAgent } = this.getRequestMetadata(req);
        await this.prisma.adminAction.create({
            data: {
                adminId,
                action: 'create_user',
                targetType: 'user',
                targetId: user.id,
                orgId,
                metadata: { email: dto.email },
                ipAddress,
                userAgent,
            },
        });
        return user;
    }
    async getOrgUsers(adminRole, orgId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { orgId },
                include: { profile: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where: { orgId } }),
        ]);
        return {
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async updateUser(userId, dto, adminId, orgId, req) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || user.orgId !== orgId) {
            throw new common_1.NotFoundException('User not found in your organization');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                name: dto.name,
                status: dto.status,
                role: dto.role,
            },
        });
        const { ipAddress, userAgent } = this.getRequestMetadata(req);
        await this.prisma.adminAction.create({
            data: {
                adminId,
                action: 'update_user',
                targetType: 'user',
                targetId: userId,
                orgId,
                metadata: dto,
                ipAddress,
                userAgent,
            },
        });
        return updated;
    }
    async suspendUser(userId, adminId, orgId, req) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.orgId !== orgId) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'paused' },
        });
        const { ipAddress, userAgent } = this.getRequestMetadata(req);
        await this.prisma.adminAction.create({
            data: {
                adminId,
                action: 'suspend_user',
                targetType: 'user',
                targetId: userId,
                orgId,
                metadata: {},
                ipAddress,
                userAgent,
            },
        });
        return updated;
    }
    async deleteUser(userId, adminId, orgId, req) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.orgId !== orgId) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'deleted' },
        });
        const { ipAddress, userAgent } = this.getRequestMetadata(req);
        await this.prisma.adminAction.create({
            data: {
                adminId,
                action: 'delete_user',
                targetType: 'user',
                targetId: userId,
                orgId,
                metadata: {},
                ipAddress,
                userAgent,
            },
        });
        return { message: 'User deleted successfully' };
    }
    async getOrganization(orgId) {
        const org = await this.prisma.org.findUnique({
            where: { id: orgId },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        status: true,
                        role: true,
                    },
                },
            },
        });
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return org;
    }
    async updateOrganization(orgId, dto, adminId, req) {
        const org = await this.prisma.org.update({
            where: { id: orgId },
            data: {
                name: dto.name,
                ssoEnabled: dto.ssoEnabled,
                ssoProvider: dto.ssoProvider,
            },
        });
        const { ipAddress, userAgent } = this.getRequestMetadata(req);
        await this.prisma.adminAction.create({
            data: {
                adminId,
                action: 'update_org',
                targetType: 'org',
                targetId: orgId,
                orgId,
                metadata: { changes: dto },
                ipAddress,
                userAgent,
            },
        });
        return org;
    }
    async getAdminActions(orgId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [actions, total] = await Promise.all([
            this.prisma.adminAction.findMany({
                where: { orgId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.adminAction.count({ where: { orgId } }),
        ]);
        return {
            actions,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map