"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockMatchingStrategy = void 0;
class MockMatchingStrategy {
    async computeSimilarity(sourceUserId, candidateUserIds) {
        const scores = new Map();
        candidateUserIds.forEach((candidateId, index) => {
            const score = 0.95 - index * 0.05;
            scores.set(candidateId, Math.max(0.7, score));
        });
        return scores;
    }
    getName() {
        return 'MockMatchingStrategy';
    }
}
exports.MockMatchingStrategy = MockMatchingStrategy;
//# sourceMappingURL=mock-matching-strategy.js.map