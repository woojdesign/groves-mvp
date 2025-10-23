export interface IMatchingEngine {
    generateMatches(request: GenerateMatchesRequest): Promise<GenerateMatchesResponse>;
    generateBatchMatches(userIds: string[], options?: BatchMatchOptions): Promise<BatchMatchResult>;
    healthCheck(): Promise<MatchingEngineHealthStatus>;
}
export interface GenerateMatchesRequest {
    userId: string;
    limit?: number;
    minSimilarityScore?: number;
    diversityWeight?: number;
}
export interface GenerateMatchesResponse {
    userId: string;
    matches: MatchCandidate[];
    metadata: {
        totalCandidatesConsidered: number;
        totalFiltered: number;
        processingTimeMs: number;
    };
}
export interface MatchCandidate {
    candidateUserId: string;
    similarityScore: number;
    diversityScore: number;
    finalScore: number;
    reasons: string[];
}
export interface BatchMatchOptions {
    batchSize?: number;
    parallelism?: number;
}
export interface BatchMatchResult {
    totalUsersProcessed: number;
    totalMatchesGenerated: number;
    failures: Array<{
        userId: string;
        error: string;
    }>;
    durationMs: number;
}
export interface MatchingEngineHealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
        vectorIndexReady: boolean;
        databaseConnected: boolean;
        lastSuccessfulMatch?: Date;
    };
}
