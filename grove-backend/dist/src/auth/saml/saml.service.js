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
var SamlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamlService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
let SamlService = SamlService_1 = class SamlService {
    prisma;
    jwtService;
    logger = new common_1.Logger(SamlService_1.name);
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateSamlUser(profile, orgDomain) {
        this.logger.log(`SAML assertion received for: ${profile.email}`);
        const email = profile.email || profile.nameID;
        const name = profile.displayName || profile.name || email.split('@')[0];
        const ssoSubject = profile.nameID;
        if (!email) {
            throw new common_1.UnauthorizedException('Email not provided in SAML assertion');
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
                    ssoProvider: 'saml',
                },
            });
            this.logger.log(`Created new org via SAML JIT: ${emailDomain}`);
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
                    ssoProvider: 'saml',
                    ssoSubject,
                    ssoMetadata: profile,
                },
                include: { profile: true },
            });
            this.logger.log(`Created new user via SAML JIT: ${email}`);
            await this.prisma.event.create({
                data: {
                    userId: user.id,
                    eventType: 'user_created_saml',
                    metadata: { email, ssoProvider: 'saml' },
                },
            });
        }
        else {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    ssoProvider: 'saml',
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
                metadata: { method: 'saml', ssoProvider: 'saml' },
            },
        });
        return user;
    }
    async createSamlSession(user, res) {
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
exports.SamlService = SamlService;
exports.SamlService = SamlService = SamlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], SamlService);
//# sourceMappingURL=saml.service.js.map