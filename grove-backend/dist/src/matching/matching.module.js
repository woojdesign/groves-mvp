"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingModule = void 0;
const common_1 = require("@nestjs/common");
const matching_controller_1 = require("./matching.controller");
const matching_service_1 = require("./matching.service");
const vector_matching_engine_1 = require("./engines/vector-matching.engine");
const prisma_module_1 = require("../prisma/prisma.module");
const intros_module_1 = require("../intros/intros.module");
const email_module_1 = require("../email/email.module");
const vector_similarity_strategy_1 = require("./strategies/matching/vector-similarity.strategy");
const composite_filter_1 = require("./strategies/filters/composite.filter");
const prior_matches_filter_1 = require("./strategies/filters/prior-matches.filter");
const blocked_users_filter_1 = require("./strategies/filters/blocked-users.filter");
const same_org_filter_1 = require("./strategies/filters/same-org.filter");
const diversity_ranking_strategy_1 = require("./strategies/ranking/diversity-ranking.strategy");
let MatchingModule = class MatchingModule {
};
exports.MatchingModule = MatchingModule;
exports.MatchingModule = MatchingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, intros_module_1.IntrosModule, email_module_1.EmailModule],
        controllers: [matching_controller_1.MatchingController],
        providers: [
            matching_service_1.MatchingService,
            vector_similarity_strategy_1.VectorSimilarityStrategy,
            prior_matches_filter_1.PriorMatchesFilter,
            blocked_users_filter_1.BlockedUsersFilter,
            same_org_filter_1.SameOrgFilter,
            composite_filter_1.CompositeFilterStrategy,
            diversity_ranking_strategy_1.DiversityRankingStrategy,
            {
                provide: 'MATCHING_ENGINE',
                useClass: vector_matching_engine_1.VectorMatchingEngine,
            },
        ],
        exports: [matching_service_1.MatchingService],
    })
], MatchingModule);
//# sourceMappingURL=matching.module.js.map