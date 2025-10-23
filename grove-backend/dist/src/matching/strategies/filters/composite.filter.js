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
exports.CompositeFilterStrategy = void 0;
const common_1 = require("@nestjs/common");
const prior_matches_filter_1 = require("./prior-matches.filter");
const blocked_users_filter_1 = require("./blocked-users.filter");
const same_org_filter_1 = require("./same-org.filter");
let CompositeFilterStrategy = class CompositeFilterStrategy {
    priorMatchesFilter;
    blockedUsersFilter;
    sameOrgFilter;
    constructor(priorMatchesFilter, blockedUsersFilter, sameOrgFilter) {
        this.priorMatchesFilter = priorMatchesFilter;
        this.blockedUsersFilter = blockedUsersFilter;
        this.sameOrgFilter = sameOrgFilter;
    }
    async filter(sourceUserId, candidateUserIds) {
        let filtered = candidateUserIds;
        filtered = await this.priorMatchesFilter.filter(sourceUserId, filtered);
        filtered = await this.blockedUsersFilter.filter(sourceUserId, filtered);
        filtered = await this.sameOrgFilter.filter(sourceUserId, filtered);
        return filtered;
    }
    getName() {
        return 'CompositeFilterStrategy';
    }
};
exports.CompositeFilterStrategy = CompositeFilterStrategy;
exports.CompositeFilterStrategy = CompositeFilterStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prior_matches_filter_1.PriorMatchesFilter,
        blocked_users_filter_1.BlockedUsersFilter,
        same_org_filter_1.SameOrgFilter])
], CompositeFilterStrategy);
//# sourceMappingURL=composite.filter.js.map