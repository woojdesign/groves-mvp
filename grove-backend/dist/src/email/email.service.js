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
        this.fromEmail = fromEmail || 'noreply@grove.dev';
        this.client = new postmark.ServerClient(apiKey || '');
    }
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
    }
    async sendMagicLink(to, magicLink, expiresIn) {
        try {
            this.validateEmail(to);
            const template = this.loadTemplate('magic-link');
            const html = template({
                magicLink: Handlebars.escapeExpression(magicLink),
                expiresIn: Handlebars.escapeExpression(expiresIn),
                recipientEmail: Handlebars.escapeExpression(to),
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
    async sendMatchNotification(to, userName, match) {
        try {
            this.validateEmail(to);
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
            const template = this.loadTemplate('match-notification');
            const html = template({
                userName: Handlebars.escapeExpression(userName),
                matchName: Handlebars.escapeExpression(match.name),
                score: Math.round(match.score * 100),
                sharedInterest: Handlebars.escapeExpression(match.sharedInterest),
                reason: Handlebars.escapeExpression(match.reason),
                acceptUrl: Handlebars.escapeExpression(`${frontendUrl}/matches/${match.id}/accept`),
                passUrl: Handlebars.escapeExpression(`${frontendUrl}/matches/${match.id}/pass`),
                recipientEmail: Handlebars.escapeExpression(to),
            });
            const result = await this.client.sendEmail({
                From: this.fromEmail,
                To: to,
                Subject: `We found a great match: ${match.name}`,
                HtmlBody: html,
                TextBody: `You have a new match: ${match.name} (${Math.round(match.score * 100)}% match)\n\nShared interest: ${match.sharedInterest}\n\n${match.reason}\n\nAccept: ${frontendUrl}/matches/${match.id}/accept\nPass: ${frontendUrl}/matches/${match.id}/pass`,
                MessageStream: 'outbound',
            });
            this.logger.log(`Match notification sent to ${to}. MessageID: ${result.MessageID}`);
        }
        catch (error) {
            this.logger.error(`Failed to send match notification to ${to}:`, error);
            throw error;
        }
    }
    async sendMutualIntroduction(to, userName, match, sharedInterest, context) {
        try {
            this.validateEmail(to);
            this.validateEmail(match.email);
            const template = this.loadTemplate('mutual-introduction');
            const html = template({
                userName: Handlebars.escapeExpression(userName),
                matchName: Handlebars.escapeExpression(match.name),
                matchEmail: Handlebars.escapeExpression(match.email),
                sharedInterest: Handlebars.escapeExpression(sharedInterest),
                context: Handlebars.escapeExpression(context),
                recipientEmail: Handlebars.escapeExpression(to),
            });
            const result = await this.client.sendEmail({
                From: this.fromEmail,
                To: to,
                Subject: `It's a match with ${match.name}!`,
                HtmlBody: html,
                TextBody: `Great news! You and ${match.name} both expressed interest in connecting.\n\nEmail: ${match.email}\n\nShared interest: ${sharedInterest}\n\n${context}\n\nReach out soon to start the conversation!`,
                MessageStream: 'outbound',
            });
            this.logger.log(`Mutual introduction sent to ${to}. MessageID: ${result.MessageID}`);
        }
        catch (error) {
            this.logger.error(`Failed to send mutual introduction to ${to}:`, error);
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