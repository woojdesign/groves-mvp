import { BaseMatchingEngine } from './base-matching.engine';
import { PrismaService } from '../../prisma/prisma.service';
import type { IMatchingStrategy } from '../interfaces/matching-strategy.interface';
import type { IFilterStrategy } from '../interfaces/filter-strategy.interface';
import type { IRankingStrategy } from '../interfaces/ranking-strategy.interface';
export declare class VectorMatchingEngine extends BaseMatchingEngine {
    private readonly prisma;
    constructor(prisma: PrismaService, matchingStrategy: IMatchingStrategy, filterStrategy: IFilterStrategy, rankingStrategy: IRankingStrategy);
    protected getCandidatePool(sourceUserId: string): Promise<string[]>;
    protected generateReasons(sourceUserId: string, candidateUserId: string): Promise<string[]>;
    private formatConnectionType;
    private extractSharedTopics;
    private tokenize;
    private isStopword;
}
