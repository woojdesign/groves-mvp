"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMatchingEngine = void 0;
class BaseMatchingEngine {
    matchingStrategy;
    filterStrategy;
    rankingStrategy;
    constructor(matchingStrategy, filterStrategy, rankingStrategy) {
        this.matchingStrategy = matchingStrategy;
        this.filterStrategy = filterStrategy;
        this.rankingStrategy = rankingStrategy;
    }
    async generateMatches(request) {
        const startTime = Date.now();
        const allCandidates = await this.getCandidatePool(request.userId);
        const filteredCandidates = await this.filterStrategy.filter(request.userId, allCandidates);
        const similarityScores = await this.matchingStrategy.computeSimilarity(request.userId, filteredCandidates);
        const candidates = Array.from(similarityScores.entries())
            .filter(([_, score]) => score >= (request.minSimilarityScore ?? 0.7))
            .map(([userId, score]) => ({
            userId,
            similarityScore: score,
        }));
        const rankedCandidates = await this.rankingStrategy.rerank(request.userId, candidates);
        const topMatches = rankedCandidates.slice(0, request.limit ?? 5);
        const matches = await Promise.all(topMatches.map(async (candidate) => ({
            candidateUserId: candidate.userId,
            similarityScore: candidate.similarityScore,
            diversityScore: candidate.diversityScore ?? 0,
            finalScore: candidate.finalScore ?? candidate.similarityScore,
            reasons: await this.generateReasons(request.userId, candidate.userId),
        })));
        return {
            userId: request.userId,
            matches,
            metadata: {
                totalCandidatesConsidered: allCandidates.length,
                totalFiltered: allCandidates.length - filteredCandidates.length,
                processingTimeMs: Date.now() - startTime,
            },
        };
    }
    async generateBatchMatches(userIds, options) {
        const batchSize = options?.batchSize ?? 100;
        const parallelism = options?.parallelism ?? 5;
        const startTime = Date.now();
        const results = {
            totalUsersProcessed: 0,
            totalMatchesGenerated: 0,
            failures: [],
            durationMs: 0,
        };
        for (let i = 0; i < userIds.length; i += batchSize) {
            const batch = userIds.slice(i, i + batchSize);
            const promises = batch.map((userId) => this.generateMatches({ userId, limit: 5 })
                .then((result) => {
                results.totalUsersProcessed++;
                results.totalMatchesGenerated += result.matches.length;
                return { success: true };
            })
                .catch((error) => {
                results.failures.push({ userId, error: error.message });
                return { success: false };
            }));
            await Promise.all(promises);
        }
        results.durationMs = Date.now() - startTime;
        return results;
    }
    async healthCheck() {
        return {
            status: 'healthy',
            details: {
                vectorIndexReady: true,
                databaseConnected: true,
            },
        };
    }
}
exports.BaseMatchingEngine = BaseMatchingEngine;
//# sourceMappingURL=base-matching.engine.js.map