"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const saml_strategy_1 = require("./strategies/saml.strategy");
const oidc_strategy_1 = require("./strategies/oidc.strategy");
const saml_service_1 = require("./saml/saml.service");
const saml_controller_1 = require("./saml/saml.controller");
const oidc_service_1 = require("./oidc/oidc.service");
const oidc_controller_1 = require("./oidc/oidc.controller");
const email_module_1 = require("../email/email.module");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_config_1 = require("./auth.config");
let AuthModule = AuthModule_1 = class AuthModule {
    static registerAsync() {
        const providers = [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
        ];
        const controllers = [auth_controller_1.AuthController];
        if (auth_config_1.AuthConfig.isSamlEnabled()) {
            console.log('✅ SAML authentication enabled');
            providers.push(saml_service_1.SamlService, saml_strategy_1.SamlStrategy);
            controllers.push(saml_controller_1.SamlController);
        }
        else {
            console.log('⚠️  SAML authentication disabled (not configured)');
        }
        if (auth_config_1.AuthConfig.isOidcEnabled()) {
            console.log('✅ OIDC authentication enabled');
            providers.push(oidc_service_1.OidcService, oidc_strategy_1.OidcStrategy);
            controllers.push(oidc_controller_1.OidcController);
        }
        else {
            console.log('⚠️  OIDC authentication disabled (not configured)');
        }
        return {
            module: AuthModule_1,
            imports: [
                passport_1.PassportModule,
                jwt_1.JwtModule.registerAsync({
                    inject: [config_1.ConfigService],
                    useFactory: (config) => {
                        const jwtSecret = config.get('JWT_SECRET');
                        if (!jwtSecret || jwtSecret.length < 32) {
                            throw new Error('JWT_SECRET must be at least 32 characters. Generate with: openssl rand -base64 32');
                        }
                        if (jwtSecret.includes('CHANGE_ME') || jwtSecret.includes('your-super-secret')) {
                            throw new Error('JWT_SECRET cannot use default/example value. Generate with: openssl rand -base64 32');
                        }
                        return {
                            secret: jwtSecret,
                            signOptions: { expiresIn: '15m' },
                        };
                    },
                }),
                email_module_1.EmailModule,
                prisma_module_1.PrismaModule,
            ],
            controllers,
            providers,
            exports: [auth_service_1.AuthService],
        };
    }
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = AuthModule_1 = __decorate([
    (0, common_1.Module)({})
], AuthModule);
//# sourceMappingURL=auth.module.js.map