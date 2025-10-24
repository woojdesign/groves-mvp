import { Injectable, Logger } from '@nestjs/common';
import { IEmailService } from './email.service.interface';

@Injectable()
export class EmailNoopService implements IEmailService {
  private readonly logger = new Logger(EmailNoopService.name);

  async sendMagicLink(to: string, magicLink: string, expiresIn: string): Promise<void> {
    this.logger.log(`[NO-OP] Magic link for ${to}:`);
    this.logger.log(`[NO-OP] ${magicLink}`);
    this.logger.log(`[NO-OP] Expires in: ${expiresIn}`);
  }

  async sendMatchNotification(
    to: string,
    userName: string,
    match: {
      id: string;
      name: string;
      score: number;
      sharedInterest: string;
      reason: string;
    },
  ): Promise<void> {
    this.logger.log(`[NO-OP] Match notification for ${to}:`);
    this.logger.log(`[NO-OP] User: ${userName}, Match: ${match.name}`);
    this.logger.log(`[NO-OP] Score: ${Math.round(match.score * 100)}%`);
    this.logger.log(`[NO-OP] Shared interest: ${match.sharedInterest}`);
  }

  async sendMutualIntroduction(
    to: string,
    userName: string,
    match: {
      name: string;
      email: string;
    },
    sharedInterest: string,
    context: string,
  ): Promise<void> {
    this.logger.log(`[NO-OP] Mutual introduction for ${to}:`);
    this.logger.log(`[NO-OP] User: ${userName}, Match: ${match.name} (${match.email})`);
    this.logger.log(`[NO-OP] Shared interest: ${sharedInterest}`);
    this.logger.log(`[NO-OP] Context: ${context}`);
  }
}
