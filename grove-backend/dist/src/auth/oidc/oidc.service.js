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
var OidcService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
let OidcService = OidcService_1 = class OidcService {
    prisma;
    jwtService;
    logger = new common_1.Logger(OidcService_1.name);
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateOidcUser(profile, orgDomain) {
        this.logger.log(`OIDC authentication for: ${profile.email}`);
        const email = profile.email || profile.emails?.[0]?.value;
        const name = profile.displayName || profile.name || email.split('@')[0];
        const ssoSubject = profile.id || profile.sub;
        if (!email) {
            throw new common_1.UnauthorizedException('Email not provided in OIDC claims');
        }
        const emailDomain = email.split('@')[1];
        let org = await this.prisma.org.findUnique({
            where: { domain: emailDomain },
        });
        if (!org) {
            org = await this.prisma.org.create({
                data: {
                    name: emailDomain,
                    domain: emailDomain,
                    ssoEnabled: true,
                    ssoProvider: 'oidc',
                },
            });
            this.logger.log(`Created new org via OIDC JIT: ${emailDomain}`);
        }
        let user = await this.prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    name,
                    orgId: org.id,
                    ssoProvider: 'oidc',
                    ssoSubject,
                    ssoMetadata: profile,
                },
                include: { profile: true },
            });
            this.logger.log(`Created new user via OIDC JIT: ${email}`);
            await this.prisma.event.create({
                data: {
                    userId: user.id,
                    eventType: 'user_created_oidc',
                    metadata: { email, ssoProvider: 'oidc' },
                },
            });
        }
        else {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    ssoProvider: 'oidc',
                    ssoSubject,
                    ssoMetadata: profile,
                    lastActive: new Date(),
                },
                include: { profile: true },
            });
        }
        if (user.status === 'deleted') {
            throw new common_1.UnauthorizedException('User account is deleted');
        }
        await this.prisma.event.create({
            data: {
                userId: user.id,
                eventType: 'login',
                metadata: { method: 'oidc', ssoProvider: 'oidc' },
            },
        });
        return user;
    }
    async createOidcSession(user, res) {
        const payload = { sub: user.id, email: user.email, role: user.role, orgId: user.orgId };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                hasCompletedOnboarding: !!user.profile,
            },
        };
    }
};
exports.OidcService = OidcService;
exports.OidcService = OidcService = OidcService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], OidcService);
//# sourceMappingURL=oidc.service.js.map