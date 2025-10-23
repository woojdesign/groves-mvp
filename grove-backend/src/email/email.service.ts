import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as postmark from 'postmark';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailService {
  private client: postmark.ServerClient;
  private logger = new Logger(EmailService.name);
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('POSTMARK_API_KEY');
    const fromEmail = this.configService.get<string>('POSTMARK_FROM_EMAIL');

    if (!apiKey) {
      throw new Error('POSTMARK_API_KEY is not defined');
    }
    if (!fromEmail) {
      throw new Error('POSTMARK_FROM_EMAIL is not defined');
    }

    this.fromEmail = fromEmail;
    this.client = new postmark.ServerClient(apiKey);
  }

  async sendMagicLink(
    to: string,
    magicLink: string,
    expiresIn: string,
  ): Promise<void> {
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

      this.logger.log(
        `Magic link email sent to ${to}. MessageID: ${result.MessageID}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send magic link to ${to}:`, error);
      throw error;
    }
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
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      const template = this.loadTemplate('match-notification');
      const html = template({
        userName,
        matchName: match.name,
        score: Math.round(match.score * 100),
        sharedInterest: match.sharedInterest,
        reason: match.reason,
        acceptUrl: `${frontendUrl}/matches/${match.id}/accept`,
        passUrl: `${frontendUrl}/matches/${match.id}/pass`,
        recipientEmail: to,
      });

      const result = await this.client.sendEmail({
        From: this.fromEmail,
        To: to,
        Subject: `We found a great match: ${match.name}`,
        HtmlBody: html,
        TextBody: `You have a new match: ${match.name} (${Math.round(match.score * 100)}% match)\n\nShared interest: ${match.sharedInterest}\n\n${match.reason}\n\nAccept: ${frontendUrl}/matches/${match.id}/accept\nPass: ${frontendUrl}/matches/${match.id}/pass`,
        MessageStream: 'outbound',
      });

      this.logger.log(
        `Match notification sent to ${to}. MessageID: ${result.MessageID}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send match notification to ${to}:`, error);
      throw error;
    }
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
    try {
      const template = this.loadTemplate('mutual-introduction');
      const html = template({
        userName,
        matchName: match.name,
        matchEmail: match.email,
        sharedInterest,
        context,
        recipientEmail: to,
      });

      const result = await this.client.sendEmail({
        From: this.fromEmail,
        To: to,
        Subject: `It's a match with ${match.name}!`,
        HtmlBody: html,
        TextBody: `Great news! You and ${match.name} both expressed interest in connecting.\n\nEmail: ${match.email}\n\nShared interest: ${sharedInterest}\n\n${context}\n\nReach out soon to start the conversation!`,
        MessageStream: 'outbound',
      });

      this.logger.log(
        `Mutual introduction sent to ${to}. MessageID: ${result.MessageID}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send mutual introduction to ${to}:`, error);
      throw error;
    }
  }

  private loadTemplate(name: string): HandlebarsTemplateDelegate {
    const templatePath = path.join(__dirname, 'templates', `${name}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    return Handlebars.compile(templateSource);
  }
}
