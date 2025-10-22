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

  private loadTemplate(name: string): HandlebarsTemplateDelegate {
    const templatePath = path.join(__dirname, 'templates', `${name}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    return Handlebars.compile(templateSource);
  }
}
