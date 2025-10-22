import { PrismaService } from '../prisma/prisma.service';
export declare class EmbeddingsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createEmbedding(userId: string, vector: number[]): Promise<any>;
    getEmbeddingByUserId(userId: string): Promise<any>;
    hasEmbedding(userId: string): Promise<boolean>;
    deleteEmbedding(userId: string): Promise<void>;
}
