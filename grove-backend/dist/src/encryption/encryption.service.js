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
var EncryptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let EncryptionService = EncryptionService_1 = class EncryptionService {
    configService;
    logger = new common_1.Logger(EncryptionService_1.name);
    algorithm = 'aes-256-gcm';
    key;
    enabled;
    constructor(configService) {
        this.configService = configService;
        const encryptionKey = this.configService.get('ENCRYPTION_KEY');
        if (!encryptionKey || encryptionKey.length < 32) {
            this.logger.warn('ENCRYPTION_KEY not configured or too short. Field-level encryption disabled. ' +
                'Set ENCRYPTION_KEY to a 32+ character string for production.');
            this.enabled = false;
            this.key = Buffer.alloc(32);
        }
        else {
            this.enabled = true;
            this.key = Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32), 'utf-8');
            this.logger.log('Field-level encryption enabled with AES-256-GCM');
        }
    }
    encrypt(text) {
        if (!text)
            return text;
        if (!this.enabled)
            return text;
        try {
            const iv = (0, crypto_1.randomBytes)(16);
            const cipher = (0, crypto_1.createCipheriv)(this.algorithm, this.key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        }
        catch (error) {
            this.logger.error(`Encryption failed: ${error.message}`, error.stack);
            throw new Error('Encryption failed');
        }
    }
    decrypt(encryptedText) {
        if (!encryptedText)
            return encryptedText;
        if (!this.enabled)
            return encryptedText;
        if (!encryptedText.includes(':')) {
            return encryptedText;
        }
        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 3) {
                return encryptedText;
            }
            const [ivHex, authTagHex, encrypted] = parts;
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const decipher = (0, crypto_1.createDecipheriv)(this.algorithm, this.key, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error(`Decryption failed: ${error.message}. Returning encrypted value.`, error.stack);
            return encryptedText;
        }
    }
    isEnabled() {
        return this.enabled;
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = EncryptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map