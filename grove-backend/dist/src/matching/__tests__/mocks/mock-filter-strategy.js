"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockFilterStrategy = void 0;
class MockFilterStrategy {
    async filter(sourceUserId, candidateUserIds) {
        return candidateUserIds;
    }
    getName() {
        return 'MockFilterStrategy';
    }
}
exports.MockFilterStrategy = MockFilterStrategy;
//# sourceMappingURL=mock-filter-strategy.js.map