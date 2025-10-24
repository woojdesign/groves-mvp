import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailNoopService } from './email-noop.service';
import { EMAIL_SERVICE } from './email.service.interface';

@Module({
  providers: [
    {
      provide: EMAIL_SERVICE,
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('POSTMARK_API_KEY');
        const isConfigured = apiKey &&
                            !apiKey.includes('dummy') &&
                            !apiKey.includes('placeholder');

        if (isConfigured) {
          console.log('✅ Email service enabled (Postmark configured)');
          return new EmailService(config);
        } else {
          console.log('⚠️  Email service in NO-OP mode (Postmark not configured)');
          return new EmailNoopService();
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
