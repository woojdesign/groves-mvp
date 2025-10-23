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
exports.OrgFilterInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const org_scoped_decorator_1 = require("../decorators/org-scoped.decorator");
let OrgFilterInterceptor = class OrgFilterInterceptor {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    intercept(context, next) {
        const isOrgScoped = this.reflector.get(org_scoped_decorator_1.ORG_SCOPED_KEY, context.getHandler());
        if (isOrgScoped) {
            const request = context.switchToHttp().getRequest();
            if (!request.orgId) {
                throw new common_1.ForbiddenException('Organization context required');
            }
        }
        return next.handle();
    }
};
exports.OrgFilterInterceptor = OrgFilterInterceptor;
exports.OrgFilterInterceptor = OrgFilterInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], OrgFilterInterceptor);
//# sourceMappingURL=org-filter.interceptor.js.map