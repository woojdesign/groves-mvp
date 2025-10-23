"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgScoped = exports.ORG_SCOPED_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ORG_SCOPED_KEY = 'isOrgScoped';
const OrgScoped = () => (0, common_1.SetMetadata)(exports.ORG_SCOPED_KEY, true);
exports.OrgScoped = OrgScoped;
//# sourceMappingURL=org-scoped.decorator.js.map