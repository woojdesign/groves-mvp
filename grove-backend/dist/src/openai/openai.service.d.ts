import { ConfigService } from '@nestjs/config';
export declare class OpenaiService {
    private configService;
    private readonly logger;
    private readonly openai;
    private readonly model;
    constructor(configService: ConfigService);
    generateEmbedding(text: string): Promise<number[]>;
    preprocessProfileText(nicheInterest: string, project: string, rabbitHole?: string): string;
}
