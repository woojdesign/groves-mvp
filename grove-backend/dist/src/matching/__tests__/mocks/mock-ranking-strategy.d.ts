import { IRankingStrategy, RankingCandidate } from '../../interfaces/ranking-strategy.interface';
export declare class MockRankingStrategy implements IRankingStrategy {
    rerank(sourceUserId: string, candidates: RankingCandidate[]): Promise<RankingCandidate[]>;
    getName(): string;
}
