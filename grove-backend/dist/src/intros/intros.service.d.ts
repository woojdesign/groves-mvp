import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { IntroResponseDto } from './dto/intro-response.dto';
export declare class IntrosService {
    private readonly prisma;
    private readonly emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    createIntroduction(matchId: string): Promise<{
        id: string;
        status: string;
    }>;
    private sendMutualIntroductionEmail;
    getActiveIntros(userId: string): Promise<IntroResponseDto[]>;
    completeIntroduction(introId: string): Promise<void>;
}
