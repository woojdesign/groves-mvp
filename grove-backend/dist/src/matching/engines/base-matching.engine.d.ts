import { IMatchingEngine, GenerateMatchesRequest, GenerateMatchesResponse, BatchMatchOptions, BatchMatchResult, MatchingEngineHealthStatus } from '../interfaces';
import { IMatchingStrategy } from '../interfaces/matching-strategy.interface';
import { IFilterStrategy } from '../interfaces/filter-strategy.interface';
import { IRankingStrategy } from '../interfaces/ranking-strategy.interface';
export declare abstract class BaseMatchingEngine implements IMatchingEngine {
    protected readonly matchingStrategy: IMatchingStrategy;
    protected readonly filterStrategy: IFilterStrategy;
    protected readonly rankingStrategy: IRankingStrategy;
    constructor(matchingStrategy: IMatchingStrategy, filterStrategy: IFilterStrategy, rankingStrategy: IRankingStrategy);
    generateMatches(request: GenerateMatchesRequest): Promise<GenerateMatchesResponse>;
    generateBatchMatches(userIds: string[], options?: BatchMatchOptions): Promise<BatchMatchResult>;
    healthCheck(): Promise<MatchingEngineHealthStatus>;
    protected abstract getCandidatePool(sourceUserId: string): Promise<string[]>;
    protected abstract generateReasons(sourceUserId: string, candidateUserId: string): Promise<string[]>;
}
