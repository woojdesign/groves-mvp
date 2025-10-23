import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * EncryptionService provides field-level encryption for PII data
 * using AES-256-GCM authenticated encryption.
 *
 * Encrypted format: <iv>:<authTag>:<encryptedData>
 * - iv: 16-byte initialization vector (hex)
 * - authTag: 16-byte authentication tag (hex)
 * - encryptedData: encrypted payload (hex)
 *
 * This ensures:
 * - Confidentiality (AES-256)
 * - Integrity (GCM authentication)
 * - Uniqueness (random IV per encryption)
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!encryptionKey || encryptionKey.length < 32) {
      this.logger.warn(
        'ENCRYPTION_KEY not configured or too short. Field-level encryption disabled. ' +
        'Set ENCRYPTION_KEY to a 32+ character string for production.',
      );
      this.enabled = false;
      // Use a dummy key to prevent crashes
      this.key = Buffer.alloc(32);
    } else {
      this.enabled = true;
      // Derive a 32-byte key from the environment variable
      // In production, use a proper KDF (e.g., PBKDF2, scrypt)
      this.key = Buffer.from(
        encryptionKey.padEnd(32, '0').slice(0, 32),
        'utf-8',
      );
      this.logger.log('Field-level encryption enabled with AES-256-GCM');
    }
  }

  /**
   * Encrypt a text value using AES-256-GCM
   * @param text - Plain text to encrypt
   * @returns Encrypted string in format: <iv>:<authTag>:<encryptedData>
   */
  encrypt(text: string): string {
    if (!text) return text;
    if (!this.enabled) return text;

    try {
      // Generate random initialization vector
      const iv = randomBytes(16);

      // Create cipher
      const cipher = createCipheriv(this.algorithm, this.key, iv);

      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Return format: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`, error.stack);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt a text value encrypted with AES-256-GCM
   * @param encryptedText - Encrypted string in format: <iv>:<authTag>:<encryptedData>
   * @returns Decrypted plain text
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    if (!this.enabled) return encryptedText;

    // Check if the text is actually encrypted (has the format)
    if (!encryptedText.includes(':')) {
      // Not encrypted, return as-is (backward compatibility)
      return encryptedText;
    }

    try {
      // Parse the encrypted format
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        // Invalid format, return as-is
        return encryptedText;
      }

      const [ivHex, authTagHex, encrypted] = parts;

      // Convert hex strings back to buffers
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(
        `Decryption failed: ${error.message}. Returning encrypted value.`,
        error.stack,
      );
      // Return encrypted value to avoid data loss
      return encryptedText;
    }
  }

  /**
   * Check if encryption is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
