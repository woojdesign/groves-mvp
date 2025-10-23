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
exports.OidcStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_openidconnect_1 = require("passport-openidconnect");
const oidc_service_1 = require("../oidc/oidc.service");
const config_1 = require("@nestjs/config");
let OidcStrategy = class OidcStrategy extends (0, passport_1.PassportStrategy)(passport_openidconnect_1.Strategy, 'oidc') {
    oidcService;
    configService;
    constructor(oidcService, configService) {
        const oidcIssuer = configService.get('OIDC_ISSUER') || '';
        super({
            issuer: oidcIssuer,
            authorizationURL: `${oidcIssuer}/authorize`,
            tokenURL: `${oidcIssuer}/token`,
            userInfoURL: `${oidcIssuer}/userinfo`,
            clientID: configService.get('OIDC_CLIENT_ID') || '',
            clientSecret: configService.get('OIDC_CLIENT_SECRET') || '',
            callbackURL: configService.get('OIDC_CALLBACK_URL') || '',
            scope: configService.get('OIDC_SCOPE') || 'openid profile email',
        });
        this.oidcService = oidcService;
        this.configService = configService;
    }
    async validate(issuer, profile, context, idToken, accessToken, refreshToken, done) {
        try {
            const email = profile.emails?.[0]?.value || profile.email;
            if (!email) {
                return done(new common_1.UnauthorizedException('Email not found in OIDC profile'), undefined);
            }
            const orgDomain = email.split('@')[1];
            const user = await this.oidcService.validateOidcUser(profile, orgDomain);
            return done(null, user);
        }
        catch (error) {
            return done(error, undefined);
        }
    }
};
exports.OidcStrategy = OidcStrategy;
exports.OidcStrategy = OidcStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [oidc_service_1.OidcService,
        config_1.ConfigService])
], OidcStrategy);
//# sourceMappingURL=oidc.strategy.js.map