import { PrismaService } from '../../../prisma/prisma.service';
import { IRankingStrategy, RankingCandidate } from '../../interfaces/ranking-strategy.interface';
export declare class DiversityRankingStrategy implements IRankingStrategy {
    private readonly prisma;
    constructor(prisma: PrismaService);
    rerank(sourceUserId: string, candidates: RankingCandidate[]): Promise<RankingCandidate[]>;
    getName(): string;
}
