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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamlController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const saml_service_1 = require("./saml.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let SamlController = class SamlController {
    samlService;
    constructor(samlService) {
        this.samlService = samlService;
    }
    async samlLogin(req) {
    }
    async samlCallback(req, res) {
        const user = req.user;
        const result = await this.samlService.createSamlSession(user, res);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/auth/callback?success=true`);
    }
    async getMetadata(res) {
        const metadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${process.env.SAML_ISSUER}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        Location="${process.env.SAML_CALLBACK_URL}"
        index="0" />
  </SPSSODescriptor>
</EntityDescriptor>`;
        res.set('Content-Type', 'application/xml');
        return res.send(metadata);
    }
};
exports.SamlController = SamlController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('login'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('saml')),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "samlLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('saml')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "samlCallback", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('metadata'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "getMetadata", null);
exports.SamlController = SamlController = __decorate([
    (0, common_1.Controller)('auth/saml'),
    __metadata("design:paramtypes", [saml_service_1.SamlService])
], SamlController);
//# sourceMappingURL=saml.controller.js.map