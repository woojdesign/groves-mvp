import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private client;
    private logger;
    private fromEmail;
    constructor(configService: ConfigService);
    sendMagicLink(to: string, magicLink: string, expiresIn: string): Promise<void>;
    sendMatchNotification(to: string, userName: string, match: {
        id: string;
        name: string;
        score: number;
        sharedInterest: string;
        reason: string;
    }): Promise<void>;
    sendMutualIntroduction(to: string, userName: string, match: {
        name: string;
        email: string;
    }, sharedInterest: string, context: string): Promise<void>;
    private loadTemplate;
}
