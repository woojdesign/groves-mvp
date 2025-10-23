"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockRankingStrategy = void 0;
class MockRankingStrategy {
    async rerank(sourceUserId, candidates) {
        const rankedCandidates = candidates.map((candidate) => ({
            ...candidate,
            diversityScore: 0.75,
            finalScore: 0.7 * candidate.similarityScore + 0.3 * 0.75,
        }));
        return rankedCandidates.sort((a, b) => b.finalScore - a.finalScore);
    }
    getName() {
        return 'MockRankingStrategy';
    }
}
exports.MockRankingStrategy = MockRankingStrategy;
//# sourceMappingURL=mock-ranking-strategy.js.map