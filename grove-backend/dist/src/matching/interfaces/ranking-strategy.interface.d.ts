export interface IRankingStrategy {
    rerank(sourceUserId: string, candidates: RankingCandidate[]): Promise<RankingCandidate[]>;
    getName(): string;
}
export interface RankingCandidate {
    userId: string;
    similarityScore: number;
    diversityScore?: number;
    finalScore?: number;
    metadata?: Record<string, any>;
}
