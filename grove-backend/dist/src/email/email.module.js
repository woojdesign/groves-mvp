"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const email_service_1 = require("./email.service");
const email_noop_service_1 = require("./email-noop.service");
const email_service_interface_1 = require("./email.service.interface");
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: email_service_interface_1.EMAIL_SERVICE,
                useFactory: (config) => {
                    const apiKey = config.get('POSTMARK_API_KEY');
                    const isConfigured = apiKey &&
                        !apiKey.includes('dummy') &&
                        !apiKey.includes('placeholder');
                    if (isConfigured) {
                        console.log('✅ Email service enabled (Postmark configured)');
                        return new email_service_1.EmailService(config);
                    }
                    else {
                        console.log('⚠️  Email service in NO-OP mode (Postmark not configured)');
                        return new email_noop_service_1.EmailNoopService();
                    }
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [email_service_interface_1.EMAIL_SERVICE],
    })
], EmailModule);
//# sourceMappingURL=email.module.js.map