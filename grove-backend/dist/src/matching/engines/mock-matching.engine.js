"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockMatchingEngine = void 0;
const common_1 = require("@nestjs/common");
const base_matching_engine_1 = require("./base-matching.engine");
const mock_matching_strategy_1 = require("../__tests__/mocks/mock-matching-strategy");
const mock_filter_strategy_1 = require("../__tests__/mocks/mock-filter-strategy");
const mock_ranking_strategy_1 = require("../__tests__/mocks/mock-ranking-strategy");
let MockMatchingEngine = class MockMatchingEngine extends base_matching_engine_1.BaseMatchingEngine {
    constructor() {
        super(new mock_matching_strategy_1.MockMatchingStrategy(), new mock_filter_strategy_1.MockFilterStrategy(), new mock_ranking_strategy_1.MockRankingStrategy());
    }
    async getCandidatePool(sourceUserId) {
        const mockCandidates = [
            'mock-user-1',
            'mock-user-2',
            'mock-user-3',
            'mock-user-4',
            'mock-user-5',
        ];
        return mockCandidates.filter((id) => id !== sourceUserId);
    }
    async generateReasons(sourceUserId, candidateUserId) {
        return [
            'Similar values and goals',
            'Complementary skill sets',
            'Different professional backgrounds for diversity',
        ];
    }
};
exports.MockMatchingEngine = MockMatchingEngine;
exports.MockMatchingEngine = MockMatchingEngine = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MockMatchingEngine);
//# sourceMappingURL=mock-matching.engine.js.map