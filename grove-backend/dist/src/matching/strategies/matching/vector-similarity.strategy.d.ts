import { PrismaService } from '../../../prisma/prisma.service';
import { IMatchingStrategy } from '../../interfaces/matching-strategy.interface';
export declare class VectorSimilarityStrategy implements IMatchingStrategy {
    private readonly prisma;
    constructor(prisma: PrismaService);
    computeSimilarity(sourceUserId: string, candidateUserIds: string[]): Promise<Map<string, number>>;
    getName(): string;
    private parseVector;
}
