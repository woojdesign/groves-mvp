import { PrismaService } from '../prisma/prisma.service';
import type { IEmailService } from '../email/email.service.interface';
import { IntroResponseDto } from './dto/intro-response.dto';
export declare class IntrosService {
    private readonly prisma;
    private readonly emailService;
    constructor(prisma: PrismaService, emailService: IEmailService);
    createIntroduction(matchId: string, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        status: string;
    }>;
    private sendMutualIntroductionEmail;
    getActiveIntros(userId: string): Promise<IntroResponseDto[]>;
    completeIntroduction(introId: string): Promise<void>;
}
