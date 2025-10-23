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
exports.SamlStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_saml_1 = require("passport-saml");
const saml_service_1 = require("../saml/saml.service");
const config_1 = require("@nestjs/config");
let SamlStrategy = class SamlStrategy extends (0, passport_1.PassportStrategy)(passport_saml_1.Strategy, 'saml') {
    samlService;
    configService;
    constructor(samlService, configService) {
        super({
            entryPoint: configService.get('SAML_ENTRY_POINT') || '',
            issuer: configService.get('SAML_ISSUER') || 'grove-mvp',
            callbackUrl: configService.get('SAML_CALLBACK_URL') || '',
            cert: configService.get('SAML_CERT') || '',
            acceptedClockSkewMs: 5000,
            identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        });
        this.samlService = samlService;
        this.configService = configService;
    }
    async validate(profile) {
        const orgDomain = profile.email?.split('@')[1];
        if (!orgDomain) {
            throw new common_1.UnauthorizedException('Email domain not found in SAML assertion');
        }
        const user = await this.samlService.validateSamlUser(profile, orgDomain);
        return user;
    }
};
exports.SamlStrategy = SamlStrategy;
exports.SamlStrategy = SamlStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [saml_service_1.SamlService,
        config_1.ConfigService])
], SamlStrategy);
//# sourceMappingURL=saml.strategy.js.map