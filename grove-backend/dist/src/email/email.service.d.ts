import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private client;
    private logger;
    private fromEmail;
    constructor(configService: ConfigService);
    sendMagicLink(to: string, magicLink: string, expiresIn: string): Promise<void>;
    private loadTemplate;
}
