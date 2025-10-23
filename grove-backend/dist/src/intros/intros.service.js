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
exports.IntrosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
let IntrosService = class IntrosService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async createIntroduction(matchId) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            include: {
                userA: {
                    select: { id: true, name: true, email: true },
                },
                userB: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        if (!match) {
            throw new common_1.NotFoundException('Match not found');
        }
        const existingIntro = await this.prisma.intro.findUnique({
            where: { matchId },
        });
        if (existingIntro) {
            return {
                id: existingIntro.id,
                status: existingIntro.status,
            };
        }
        const intro = await this.prisma.intro.create({
            data: {
                matchId,
                userAStatus: 'accepted',
                userBStatus: 'accepted',
                status: 'mutual',
                introSentAt: new Date(),
            },
        });
        await this.sendMutualIntroductionEmail(match);
        await this.prisma.event.createMany({
            data: [
                {
                    userId: match.userAId,
                    eventType: 'intro_created',
                    metadata: { matchId, introId: intro.id },
                },
                {
                    userId: match.userBId,
                    eventType: 'intro_created',
                    metadata: { matchId, introId: intro.id },
                },
            ],
        });
        return {
            id: intro.id,
            status: intro.status,
        };
    }
    async sendMutualIntroductionEmail(match) {
        const { userA, userB, sharedInterest, context } = match;
        await this.emailService.sendMutualIntroduction(userA.email, userA.name, {
            name: userB.name,
            email: userB.email,
        }, sharedInterest || 'shared interests', context || '');
        await this.emailService.sendMutualIntroduction(userB.email, userB.name, {
            name: userA.name,
            email: userA.email,
        }, sharedInterest || 'shared interests', context || '');
    }
    async getActiveIntros(userId) {
        const intros = await this.prisma.intro.findMany({
            where: {
                status: {
                    in: ['mutual', 'active'],
                },
                match: {
                    OR: [{ userAId: userId }, { userBId: userId }],
                },
            },
            include: {
                match: {
                    include: {
                        userA: {
                            select: { id: true, name: true, email: true },
                        },
                        userB: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return intros.map((intro) => {
            const match = intro.match;
            const otherUser = match.userAId === userId ? match.userB : match.userA;
            return {
                id: intro.id,
                match: {
                    id: match.id,
                    name: otherUser.name,
                    email: otherUser.email,
                    sharedInterest: match.sharedInterest || 'shared interests',
                    interests: match.context ? match.context.split('. ') : [],
                },
                status: intro.status,
                createdAt: intro.createdAt.toISOString(),
            };
        });
    }
    async completeIntroduction(introId) {
        await this.prisma.intro.update({
            where: { id: introId },
            data: { status: 'completed' },
        });
    }
};
exports.IntrosService = IntrosService;
exports.IntrosService = IntrosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], IntrosService);
//# sourceMappingURL=intros.service.js.map