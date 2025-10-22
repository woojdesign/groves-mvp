"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const postmark = __importStar(require("postmark"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Handlebars = __importStar(require("handlebars"));
let EmailService = EmailService_1 = class EmailService {
    configService;
    client;
    logger = new common_1.Logger(EmailService_1.name);
    fromEmail;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('POSTMARK_API_KEY');
        const fromEmail = this.configService.get('POSTMARK_FROM_EMAIL');
        if (!apiKey) {
            throw new Error('POSTMARK_API_KEY is not defined');
        }
        if (!fromEmail) {
            throw new Error('POSTMARK_FROM_EMAIL is not defined');
        }
        this.fromEmail = fromEmail;
        this.client = new postmark.ServerClient(apiKey);
    }
    async sendMagicLink(to, magicLink, expiresIn) {
        try {
            const template = this.loadTemplate('magic-link');
            const html = template({
                magicLink,
                expiresIn,
                recipientEmail: to,
            });
            const result = await this.client.sendEmail({
                From: this.fromEmail,
                To: to,
                Subject: 'Your login link for Grove',
                HtmlBody: html,
                TextBody: `Click here to log in: ${magicLink}\n\nThis link expires in ${expiresIn}.`,
                MessageStream: 'outbound',
            });
            this.logger.log(`Magic link email sent to ${to}. MessageID: ${result.MessageID}`);
        }
        catch (error) {
            this.logger.error(`Failed to send magic link to ${to}:`, error);
            throw error;
        }
    }
    loadTemplate(name) {
        const templatePath = path.join(__dirname, 'templates', `${name}.hbs`);
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        return Handlebars.compile(templateSource);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map