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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const crypto_1 = require("crypto");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    emailService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, emailService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.configService = configService;
    }
    async requestMagicLink(email) {
        this.logger.log(`Magic link requested for: ${email}`);
        const domain = email.split('@')[1];
        const org = await this.prisma.org.findUnique({
            where: { domain },
        });
        if (!org) {
            this.logger.warn(`Attempt to request magic link for unallowed domain: ${domain}`);
            return {
                message: `Magic link sent to ${email}`,
                expiresIn: '15 minutes',
            };
        }
        const token = (0, crypto_1.randomBytes)(64).toString('hex');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        await this.prisma.authToken.create({
            data: {
                email,
                token,
                expiresAt,
                used: false,
            },
        });
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
        const magicLink = `${frontendUrl}/auth/verify?token=${token}`;
        await this.emailService.sendMagicLink(email, magicLink, '15 minutes');
        return {
            message: `Magic link sent to ${email}`,
            expiresIn: '15 minutes',
        };
    }
    async verifyMagicLink(token) {
        this.logger.log(`Verifying magic link token`);
        const authToken = await this.prisma.authToken.findFirst({
            where: {
                token,
                used: false,
                expiresAt: {
                    gte: new Date(),
                },
            },
        });
        if (!authToken) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        await this.prisma.authToken.update({
            where: { id: authToken.id },
            data: { used: true },
        });
        let user = await this.prisma.user.findUnique({
            where: { email: authToken.email },
            include: { profile: true },
        });
        if (!user) {
            const domain = authToken.email.split('@')[1];
            const org = await this.prisma.org.findUnique({
                where: { domain },
            });
            if (!org) {
                throw new common_1.ForbiddenException('Email domain not allowed');
            }
            user = await this.prisma.user.create({
                data: {
                    email: authToken.email,
                    name: '',
                    orgId: org.id,
                    status: 'active',
                },
                include: { profile: true },
            });
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastActive: new Date() },
        });
        await this.prisma.event.create({
            data: {
                userId: user.id,
                eventType: 'login',
                metadata: { method: 'magic_link' },
            },
        });
        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '15m',
        });
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name || '',
                hasCompletedOnboarding: !!user.profile,
            },
        };
    }
    async refreshAccessToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || user.status === 'deleted') {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const newPayload = { sub: user.id, email: user.email };
            const accessToken = this.jwtService.sign(newPayload, {
                expiresIn: '15m',
            });
            return { accessToken };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async logout(userId) {
        await this.prisma.event.create({
            data: {
                userId,
                eventType: 'logout',
                metadata: {},
            },
        });
        return { message: 'Logged out successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map